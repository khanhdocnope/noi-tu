// ============================================================
// ECHO — Player Service
// Quản lý nghiệp vụ người chơi, bao gồm cấp độ, điểm kinh nghiệm, 
// chuỗi ngày hoạt động (streak) và hành trang (inventory).
// Spec ref: Section 10 (Progression), 11 (Rewards), 13 (Streak), 17 (RAM First)
// ============================================================

import { EventEmitter } from 'events';
import { PlayerState, PlayerItem, PlayerStateUpdate } from './PlayerStateTypes';
import { IPlayerRepository } from './IPlayerRepository';

export const PLAYER_EVENTS = {
    PLAYER_LOADED:      'player:loaded',
    LEVEL_UP:           'player:level_up',
    XP_GAINED:          'player:xp_gained',
    CURRENCY_CHANGED:   'player:currency_changed',
    STREAK_UPDATED:     'player:streak_updated',
    STREAK_LOST:        'player:streak_lost',
    ITEM_ADDED:         'player:item_added',
} as const;

export class PlayerService {
    // In-memory Cache (Hot state in RAM)
    // Spec ref: Section 17 & 23
    private cache: Map<string, PlayerState> = new Map();
    
    public readonly events: EventEmitter = new EventEmitter();

    constructor(private readonly repo: IPlayerRepository) {}

    /**
     * Lấy trạng thái của người chơi. Ưu tiên lấy từ cache RAM, nếu không có sẽ lấy từ DB.
     * Tự động khởi tạo PlayerState mới nếu người chơi chưa tồn tại.
     */
    async getPlayer(userId: string): Promise<PlayerState> {
        const cached = this.cache.get(userId);
        if (cached) return cached;

        let player = await this.repo.findByUserId(userId);
        if (!player) {
            player = await this.repo.create(userId);
            console.log(`[ECHO Player] Created new player profile for user: ${userId}`);
        }

        // Tự động kiểm tra và xử lý streak khi load player
        player = await this.checkAndUpdateStreak(player);

        this.cache.set(userId, player);
        this.events.emit(PLAYER_EVENTS.PLAYER_LOADED, player);
        return player;
    }

    /**
     * Cập nhật trạng thái người chơi, đồng bộ xuống DB và cập nhật cache RAM.
     */
    async updatePlayer(userId: string, data: PlayerStateUpdate): Promise<PlayerState> {
        const updated = await this.repo.update(userId, {
            ...data,
            lastUpdatedAt: new Date(),
        });

        this.cache.set(userId, updated);
        return updated;
    }

    /**
     * Thêm điểm kinh nghiệm cho người chơi và tự động xử lý Level Up.
     */
    async addXp(userId: string, amount: number): Promise<{ player: PlayerState; levelUp: boolean }> {
        const player = await this.getPlayer(userId);
        let xp = player.xp + amount;
        let level = player.level;
        let levelUp = false;

        // Tính lượng XP cần để lên cấp tiếp theo: level * 100
        // Công thức đơn giản cho MVP
        let xpNeeded = this.getXpNeededForLevel(level);
        while (xp >= xpNeeded) {
            xp -= xpNeeded;
            level += 1;
            levelUp = true;
            xpNeeded = this.getXpNeededForLevel(level);
        }

        const updated = await this.updatePlayer(userId, { xp, level });
        
        this.events.emit(PLAYER_EVENTS.XP_GAINED, { userId, amount });
        if (levelUp) {
            this.events.emit(PLAYER_EVENTS.LEVEL_UP, { userId, level });
            console.log(`[ECHO Player] User ${userId} leveled up to ${level}!`);
        }

        return { player: updated, levelUp };
    }

    /**
     * Thay đổi số lượng tiền tệ (Gold).
     */
    async modifyCurrency(userId: string, amount: number): Promise<PlayerState> {
        const player = await this.getPlayer(userId);
        const currency = Math.max(0, player.currency + amount);
        const updated = await this.updatePlayer(userId, { currency });
        
        this.events.emit(PLAYER_EVENTS.CURRENCY_CHANGED, { userId, change: amount, newBalance: currency });
        return updated;
    }

    /**
     * Thêm/Bớt vật phẩm vào hành trang (inventory).
     */
    async addItem(userId: string, item: Omit<PlayerItem, 'quantity'>, quantity: number): Promise<PlayerState> {
        const player = await this.getPlayer(userId);
        const inventory = [...player.inventory];
        const itemIndex = inventory.findIndex(i => i.id === item.id);

        if (itemIndex > -1) {
            const currentItem = inventory[itemIndex]!;
            const newQuantity = currentItem.quantity + quantity;
            if (newQuantity <= 0) {
                inventory.splice(itemIndex, 1); // Xóa vật phẩm nếu số lượng <= 0
            } else {
                inventory[itemIndex] = { ...currentItem, quantity: newQuantity };
            }
        } else if (quantity > 0) {
            inventory.push({ ...item, quantity });
        }

        const updated = await this.updatePlayer(userId, { inventory });
        this.events.emit(PLAYER_EVENTS.ITEM_ADDED, { userId, itemId: item.id, quantity });
        return updated;
    }

    /**
     * Cập nhật mối quan hệ với NPC.
     */
    async modifyRelationship(userId: string, npcId: string, amount: number): Promise<PlayerState> {
        const player = await this.getPlayer(userId);
        const relationships = [...player.relationships];
        const index = relationships.findIndex(r => r.npcId === npcId);

        if (index > -1) {
            relationships[index]!.value = Math.max(-100, Math.min(100, relationships[index]!.value + amount));
        } else {
            relationships.push({ npcId, value: Math.max(-100, Math.min(100, amount)) });
        }

        return this.updatePlayer(userId, { relationships });
    }

    /**
     * Tính toán lượng XP cần thiết để lên level tiếp theo.
     */
    getXpNeededForLevel(level: number): number {
        return level * 100;
    }

    /**
     * Giải phóng bộ nhớ RAM bằng cách loại bỏ cache người chơi không hoạt động.
     * Spec ref: Section 23 (Cache limits)
     */
    evictFromCache(userId: string): void {
        this.cache.delete(userId);
    }

    // --------------------------------------------------------
    // Private Helpers
    // --------------------------------------------------------

    /**
     * Logic kiểm tra và cập nhật Streak (chuỗi ngày hoạt động liên tục).
     * Áp dụng nguyên tắc "Streak không trừng phạt" (Spec ref: Section 13).
     */
    private async checkAndUpdateStreak(player: PlayerState): Promise<PlayerState> {
        const now = new Date();
        const streak = { ...player.streak };

        if (!streak.lastActiveAt) {
            // Lần đầu tiên hoạt động
            streak.lastActiveAt = now;
            streak.current = 1;
            streak.max = 1;
            return this.updatePlayer(player.userId, { streak });
        }

        const lastActive = new Date(streak.lastActiveAt);
        
        // Thiết lập mốc thời gian để so sánh (không tính giờ, chỉ tính ngày)
        const diffTime = Math.abs(now.getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Hoạt động vào ngày tiếp theo -> Tiếp tục chuỗi
            streak.current += 1;
            if (streak.current > streak.max) {
                streak.max = streak.current;
            }
            streak.lastActiveAt = now;
            
            const updated = await this.updatePlayer(player.userId, { streak });
            this.events.emit(PLAYER_EVENTS.STREAK_UPDATED, { userId: player.userId, streak: streak.current });
            return updated;
        } 
        
        if (diffDays > 1) {
            // Bị đứt chuỗi (qua ngày mới mà không hoạt động)
            // Kiểm tra xem có kích hoạt chế độ Bảo vệ Streak (Streak Protection) không
            if (streak.protectionActive) {
                streak.protectionActive = false; // Tiêu tốn bảo vệ
                streak.lastActiveAt = now;       // Cập nhật ngày hoạt động cuối cùng
                console.log(`[ECHO Streak] Streak protection triggered for user: ${player.userId}. Streak saved!`);
                return this.updatePlayer(player.userId, { streak });
            } else {
                // Mất streak
                const oldStreak = streak.current;
                streak.current = 1; // Reset về 1 thay vì 0 (ngày hôm nay đang hoạt động)
                streak.lastActiveAt = now;
                
                const updated = await this.updatePlayer(player.userId, { streak });
                this.events.emit(PLAYER_EVENTS.STREAK_LOST, { userId: player.userId, lostStreak: oldStreak });
                console.log(`[ECHO Streak] User ${player.userId} lost streak of ${oldStreak}`);
                return updated;
            }
        }

        // Nếu diffDays === 0 (hoạt động cùng 1 ngày), chỉ cập nhật thời gian mà không thay đổi số ngày streak
        streak.lastActiveAt = now;
        return this.updatePlayer(player.userId, { streak });
    }
}
