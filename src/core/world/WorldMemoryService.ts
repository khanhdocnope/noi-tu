// ============================================================
// ECHO — World Memory Service
// Xử lý logic tạo và quản lý World Memory.
// Hệ thống ghi nhớ hành động và tạo hệ quả cho thế giới.
// Spec ref: Section 4 (World Observation), 14 (Server World),
//           Core Loop (World Memory - deeper consequences)
// ============================================================

import { EventEmitter } from 'events';
import {
    WorldMemory,
    WorldActionType,
    ImpactLevel,
    MemoryStatus,
    WorldChange,
    PlayerConsequence,
    WorldMemoryState,
    WorldMemoryUpdate,
    WorldMemoryCreatedEvent,
    WorldMemoryExpiredEvent,
    WorldChangedByMemoryEvent,
    DEFAULT_MEMORY_DURATION_DAYS,
    MAX_ACTIVE_MEMORIES,
    INTEGRATION_THRESHOLD,
} from './WorldMemoryTypes';
import { WorldStateService } from './WorldStateService';
import { PlayerService } from '../player/PlayerService';
import { ServerWorldState } from './WorldStateTypes';

// Events
export const WORLD_MEMORY_EVENTS = {
    MEMORY_CREATED:        'world_memory:created',
    MEMORY_EXPIRED:        'world_memory:expired',
    MEMORY_INTEGRATED:     'world_memory:integrated',
    WORLD_CHANGED:         'world_memory:world_changed',
    PLAYER_CONSEQUENCE:    'world_memory:player_consequence',
} as const;

export class WorldMemoryService {
    // In-memory cache: guildId → WorldMemoryState
    private cache: Map<string, WorldMemoryState> = new Map();
    
    public readonly events: EventEmitter = new EventEmitter();

    constructor(
        private readonly worldService: WorldStateService,
        private readonly playerService: PlayerService
    ) {}

    // --------------------------------------------------------
    // Public API
    // --------------------------------------------------------

    /**
     * Lấy World Memory state của guild.
     */
    async getMemoryState(guildId: string): Promise<WorldMemoryState> {
        const cached = this.cache.get(guildId);
        if (cached) return cached;

        // Khởi tạo state mới
        const newState: WorldMemoryState = {
            activeMemories: [],
            memoryHistory: [],
            stats: {
                totalMemories: 0,
                activeMemories: 0,
                positiveImpact: 0,
                negativeImpact: 0,
                topContributors: [],
                currentWorldChanges: [],
            },
            pendingChanges: [],
            lastMemoryUpdate: new Date(),
        };

        this.cache.set(guildId, newState);
        return newState;
    }

    /**
     * Ghi nhận hành động của player và tạo world memory.
     * Đây là hàm chính để tạo hệ quả.
     */
    async recordAction(
        guildId: string,
        playerId: string,
        actionType: WorldActionType,
        description: string,
        impactLevel: ImpactLevel,
        worldChanges: WorldChange[] = [],
        playerConsequences: PlayerConsequence[] = [],
        unlockedOpportunities: string[] = [],
        lockedOpportunities: string[] = []
    ): Promise<WorldMemory> {
        const state = await this.getMemoryState(guildId);
        const now = new Date();

        // Tạo memory ID
        const memoryId = `mem_${guildId}_${now.getTime()}_${Math.random().toString(36).substring(2, 9)}`;

        // Tính thời điểm hết hiệu lực
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + DEFAULT_MEMORY_DURATION_DAYS);

        // Tạo memory mới
        const memory: WorldMemory = {
            id: memoryId,
            actionType,
            playerId,
            impactLevel,
            description,
            guildId,
            worldChanges,
            playerConsequences,
            unlockedOpportunities,
            lockedOpportunities,
            occurredAt: now,
            expiresAt,
            status: MemoryStatus.Active,
            referencedCount: 0,
        };

        // Thêm vào state
        state.activeMemories.push(memory);
        state.stats.totalMemories++;
        state.stats.activeMemories++;

        // Cập nhật thống kê
        if (this.isPositiveAction(actionType)) {
            state.stats.positiveImpact++;
        } else {
            state.stats.negativeImpact++;
        }

        // Cập nhật top contributors
        this.updateTopContributors(state, playerId);

        // Áp dụng world changes
        if (worldChanges.length > 0) {
            await this.applyWorldChanges(guildId, worldChanges, memory);
        }

        // Áp dụng player consequences
        if (playerConsequences.length > 0) {
            await this.applyPlayerConsequences(guildId, playerConsequences, memory);
        }

        // Kiểm tra nếu cần integrated
        if (state.activeMemories.length > MAX_ACTIVE_MEMORIES) {
            await this.evolveOldestMemory(guildId, state);
        }

        // Emit events
        this.events.emit(WORLD_MEMORY_EVENTS.MEMORY_CREATED, {
            guildId,
            memory,
            affectedPlayers: this.getAffectedPlayers(playerConsequences),
        } as WorldMemoryCreatedEvent);

        // Sync state
        state.lastMemoryUpdate = now;
        this.cache.set(guildId, state);

        return memory;
    }

    /**
     * Xử lý passage of time - kiểm tra memory hết hiệu lực.
     */
    async processTimePassage(guildId: string): Promise<void> {
        const state = await this.getMemoryState(guildId);
        const now = new Date();

        // Kiểm tra từng memory active
        for (let i = state.activeMemories.length - 1; i >= 0; i--) {
            const memory = state.activeMemories[i];
            if (!memory) continue;

            // Kiểm tra hết hạn
            if (memory.expiresAt && now > memory.expiresAt) {
                memory.status = MemoryStatus.Expired;
                state.activeMemories.splice(i, 1);
                state.stats.activeMemories--;
                state.memoryHistory.push(memory);

                this.events.emit(WORLD_MEMORY_EVENTS.MEMORY_EXPIRED, {
                    guildId,
                    memoryId: memory.id,
                    reason: 'time',
                } as WorldMemoryExpiredEvent);

                // Đảo ngược world changes nếu có thể
                await this.reverseWorldChanges(guildId, memory.worldChanges);
            }

            // Kiểm tra integrated
            if (memory.referencedCount >= INTEGRATION_THRESHOLD) {
                memory.status = MemoryStatus.Integrated;
                state.activeMemories.splice(i, 1);
                state.stats.activeMemories--;
                state.memoryHistory.push(memory);

                this.events.emit(WORLD_MEMORY_EVENTS.MEMORY_INTEGRATED, {
                    guildId,
                    memoryId: memory.id,
                });
            }
        }

        this.cache.set(guildId, state);
    }

    /**
     * Lấy tất cả memories đang active của guild.
     */
    async getActiveMemories(guildId: string): Promise<WorldMemory[]> {
        const state = await this.getMemoryState(guildId);
        return state.activeMemories;
    }

    /**
     * Lấy thống kê world memory.
     */
    async getStats(guildId: string): Promise<WorldMemoryState['stats']> {
        const state = await this.getMemoryState(guildId);
        return state.stats;
    }

    /**
     * Tăng reference count cho memory (khi được hiển thị cho player).
     */
    async referenceMemory(guildId: string, memoryId: string): Promise<void> {
        const state = await this.getMemoryState(guildId);
        const memory = state.activeMemories.find(m => m.id === memoryId);
        if (memory) {
            memory.referencedCount++;
            this.cache.set(guildId, state);
        }
    }

    /**
     * Lấy memories liên quan đến player.
     */
    async getMemoriesForPlayer(guildId: string, playerId: string): Promise<WorldMemory[]> {
        const state = await this.getMemoryState(guildId);
        return state.activeMemories.filter(m => 
            m.playerId === playerId ||
            m.playerConsequences.some(c => 
                c.targetPlayerId === null || c.targetPlayerId === playerId
            )
        );
    }

    // --------------------------------------------------------
    // Private Helpers
    // --------------------------------------------------------

    private isPositiveAction(actionType: WorldActionType): boolean {
        const positiveActions = [
            WorldActionType.ResourceContributed,
            WorldActionType.DiscoveryShared,
            WorldActionType.EventCompleted,
            WorldActionType.NPCRelationshipUp,
            WorldActionType.WorldBossDefeated,
            WorldActionType.FestivalOrganized,
        ];
        return positiveActions.includes(actionType);
    }

    private updateTopContributors(state: WorldMemoryState, playerId: string): void {
        const existing = state.stats.topContributors.find(c => c.playerId === playerId);
        if (existing) {
            existing.count++;
        } else {
            state.stats.topContributors.push({ playerId, count: 1 });
        }
        // Sort và giữ top 10
        state.stats.topContributors.sort((a, b) => b.count - a.count);
        state.stats.topContributors = state.stats.topContributors.slice(0, 10);
    }

    private async applyWorldChanges(
        guildId: string,
        changes: WorldChange[],
        memory: WorldMemory
    ): Promise<void> {
        const world = await this.worldService.getWorld(guildId);
        const updates: Record<string, any> = {};

        for (const change of changes) {
            // Lưu lại thay đổi để có thể đảo ngược
            change.oldValue = (world as any)[change.field];
            (world as any)[change.field] = change.newValue;
            updates[change.field] = change.newValue;
        }

        // Cập nhật world
        await this.worldService.updateWorld(guildId, updates);

        this.events.emit(WORLD_MEMORY_EVENTS.WORLD_CHANGED, {
            guildId,
            memoryId: memory.id,
            changes,
            newWorldState: world,
        } as WorldChangedByMemoryEvent);
    }

    private async reverseWorldChanges(
        guildId: string,
        changes: WorldChange[]
    ): Promise<void> {
        const reversibleChanges = changes.filter(c => c.reversible);
        if (reversibleChanges.length === 0) return;

        const world = await this.worldService.getWorld(guildId);
        const updates: Record<string, any> = {};

        for (const change of reversibleChanges) {
            (world as any)[change.field] = change.oldValue;
            updates[change.field] = change.oldValue;
        }

        await this.worldService.updateWorld(guildId, updates);
    }

    private async applyPlayerConsequences(
        guildId: string,
        consequences: PlayerConsequence[],
        memory: WorldMemory
    ): Promise<void> {
        for (const consequence of consequences) {
            // Nếu là cho tất cả player
            if (consequence.targetPlayerId === null) {
                // TODO: Apply to all online players in guild
                // For now, just emit event
                this.events.emit(WORLD_MEMORY_EVENTS.PLAYER_CONSEQUENCE, {
                    guildId,
                    memoryId: memory.id,
                    consequence,
                });
            } else {
                // Áp dụng cho player cụ thể
                await this.applyConsequenceToPlayer(consequence.targetPlayerId, consequence);
            }
        }
    }

    private async applyConsequenceToPlayer(
        playerId: string,
        consequence: PlayerConsequence
    ): Promise<void> {
        switch (consequence.type) {
            case 'bonus':
                if (consequence.value?.xp) {
                    await this.playerService.addXp(playerId, consequence.value.xp);
                }
                if (consequence.value?.currency) {
                    await this.playerService.modifyCurrency(playerId, consequence.value.currency);
                }
                break;

            case 'penalty':
                if (consequence.value?.xp) {
                    await this.playerService.addXp(playerId, -consequence.value.xp);
                }
                if (consequence.value?.currency) {
                    await this.playerService.modifyCurrency(playerId, -consequence.value.currency);
                }
                break;

            case 'opportunity':
                // TODO: Unlock specific opportunity for player
                break;

            case 'restriction':
                // TODO: Lock specific opportunity for player
                break;
        }
    }

    private getAffectedPlayers(consequences: PlayerConsequence[]): string[] {
        const players = new Set<string>();
        for (const c of consequences) {
            if (c.targetPlayerId) {
                players.add(c.targetPlayerId);
            }
        }
        return Array.from(players);
    }

    private async evolveOldestMemory(
        guildId: string,
        state: WorldMemoryState
    ): Promise<void> {
        // Tìm memory cũ nhất và chuyển vào history
        if (state.activeMemories.length > 0) {
            const oldest = state.activeMemories[0];
            if (oldest) {
                oldest.status = MemoryStatus.Integrated;
                state.activeMemories.shift();
                state.stats.activeMemories--;
                state.memoryHistory.push(oldest);

                // Đảo ngược changes của oldest
                await this.reverseWorldChanges(guildId, oldest.worldChanges);
            }
        }
    }
}
