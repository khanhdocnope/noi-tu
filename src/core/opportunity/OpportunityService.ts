// ============================================================
// ECHO — Opportunity Service
// Game engine chính để xử lý lựa chọn, đánh giá điều kiện, 
// và áp dụng kết quả lên PlayerState và WorldState.
//
// Spec ref: Section 6 (Non-deterministic), 8 (Context), 9 (Outcome),
//           12 (Maybe Tomorrow — Chain Opportunities),
//           Core Loop (Daily depth - 1-3+ opportunities per day)
//
// Cải thiện: Hỗ trợ multiple opportunities per day, xác suất,
// hidden rewards, risk/reward balance.
// ============================================================

import {
    Opportunity,
    OpportunityChoice,
    ChoiceOutcome,
    OpportunityCondition,
    OutcomeResult,
    ResolvedOutcome,
    RewardEffect,
    CuriosityTrigger,
} from './OpportunityTypes';
import { OPPORTUNITIES } from './OpportunityConfig';
import { PlayerService } from '../player/PlayerService';
import { WorldStateService } from '../world/WorldStateService';
import { CuriosityService } from '../curiosity/CuriosityService';
import { PlayerState, DailySession, DailyOpportunityRecord } from '../player/PlayerStateTypes';
import { ServerWorldState } from '../world/WorldStateTypes';

/**
 * Kết quả trả về từ makeChoice().
 */
export interface ChoiceResult {
    choice: OpportunityChoice;
    resolvedOutcome: ResolvedOutcome;
    nextOpportunity: Opportunity | null;
    /** Còn slot nào trong ngày không */
    hasMoreOpportunities: boolean;
    /** Số opportunity còn lại trong ngày */
    remainingSlots: number;
}

/**
 * Kết quả từ getOrRollOpportunity().
 */
export interface OpportunityResult {
    opportunity: Opportunity;
    /** Có phải opportunity đầu tiên trong ngày không */
    isFirstOfTheDay: boolean;
    /** Số opportunity đã hoàn thành hôm nay */
    completedToday: number;
    /** Số slot còn lại */
    remainingSlots: number;
}

// ── Constants ──────────────────────────────────────────────────

/** Số ngày reset daily session */
const DAILY_SESSION_RESET_HOUR = 0; // Midnight

/** XP cần cho level tiếp theo: level * 100 */
const XP_PER_LEVEL = 100;

/** Tỷ lệ spawn opportunity mới sau khi hoàn thành (0-1) */
const SPAWN_CHANCE_BASE = 0.4; // 40%

/** Bonus spawn chance per discovery */
const SPAWN_CHANCE_PER_DISCOVERY = 0.05; // +5% per discovery

/** Max bonus slots per day */
const MAX_BONUS_SLOTS = 5;

export class OpportunityService {
    constructor(
        private readonly playerService: PlayerService,
        private readonly worldService: WorldStateService,
        private readonly curiosityService: CuriosityService
    ) {}

    /**
     * Tính số base slots dựa trên level.
     * Level 1-4: 3 slots
     * Level 5-9: 5 slots
     * Level 10+: 7 slots
     */
    private calculateBaseSlots(level: number): number {
        if (level >= 10) return 7;
        if (level >= 5) return 5;
        return 3;
    }

    /**
     * Lấy hoặc tạo daily session cho player.
     * Nếu là ngày mới → reset session.
     */
    private async getOrCreateDailySession(player: PlayerState): Promise<DailySession> {
        const today = this.getTodayString();

        // Nếu session đã có và là hôm nay → giữ nguyên
        if (player.dailySession && player.dailySession.date === today) {
            return player.dailySession;
        }

        // Tạo session mới cho ngày hôm nay
        const newSession: DailySession = {
            date: today,
            completedCount: 0,
            baseSlots: this.calculateBaseSlots(player.level),
            bonusSlots: 0,
            currentOpportunityId: null,
            history: [],
            inChain: false,
        };

        return newSession;
    }

    /**
     * Lưu daily session vào player state.
     */
    private async saveDailySession(userId: string, session: DailySession): Promise<void> {
        await this.playerService.updatePlayer(userId, { dailySession: session });
    }

    /**
     * Kiểm tra còn slot nào trong ngày không.
     */
    private hasRemainingSlots(session: DailySession): boolean {
        const totalSlots = session.baseSlots + session.bonusSlots;
        return session.completedCount < totalSlots;
    }

    /**
     * Tính số slot còn lại.
     */
    private getRemainingSlots(session: DailySession): number {
        const totalSlots = session.baseSlots + session.bonusSlots;
        return Math.max(0, totalSlots - session.completedCount);
    }

    /**
     * Tìm một cơ hội phù hợp cho người chơi hôm nay.
     * Hỗ trợ multiple opportunities per day.
     */
    async getOrRollOpportunity(userId: string, guildId: string): Promise<OpportunityResult> {
        const player = await this.playerService.getPlayer(userId);
        const session = await this.getOrCreateDailySession(player);

        // 1. Kiểm tra nếu đang có chain opportunity
        if (session.inChain && session.currentOpportunityId) {
            const activeOpp = OPPORTUNITIES.find(o => o.id === session.currentOpportunityId);
            if (activeOpp) {
                return {
                    opportunity: activeOpp,
                    isFirstOfTheDay: session.completedCount === 0,
                    completedToday: session.completedCount,
                    remainingSlots: this.getRemainingSlots(session),
                };
            }
        }

        // 2. Kiểm tra còn slot không
        if (!this.hasRemainingSlots(session)) {
            throw new Error('NO_SLOTS');
        }

        // 3. Lấy World State
        const world = await this.worldService.getWorld(guildId);

        // 4. Lọc cơ hội thỏa mãn điều kiện
        // Loại trừ các opportunity đã dùng hôm nay (để tránh lặp)
        const usedOppIds = session.history.map(h => h.opportunityId);
        const available = OPPORTUNITIES.filter(opp =>
            this.checkConditions(opp.conditions, player, world) &&
            !usedOppIds.includes(opp.id)
        );

        // 5. Chọn ngẫu nhiên
        let selected: Opportunity;

        if (available.length === 0) {
            // Nếu không còn cơ hội mới, cho phép lặp lại fallback
            selected = OPPORTUNITIES.find(o => o.id === 'crystal_peddler')!;
        } else {
            selected = available[Math.floor(Math.random() * available.length)]!;
        }

        // 6. Cập nhật session
        session.currentOpportunityId = selected.id;
        await this.saveDailySession(userId, session);

        return {
            opportunity: selected,
            isFirstOfTheDay: session.completedCount === 0,
            completedToday: session.completedCount,
            remainingSlots: this.getRemainingSlots(session),
        };
    }

    /**
     * Người chơi thực hiện lựa chọn.
     * Resolve xác suất, áp dụng rewards, và kiểm tra spawn机会 mới.
     */
    async makeChoice(userId: string, choiceId: string): Promise<ChoiceResult> {
        const player = await this.playerService.getPlayer(userId);
        const session = await this.getOrCreateDailySession(player);

        // Kiểm tra có opportunity đang active không
        if (!session.currentOpportunityId) {
            throw new Error('Không có cơ hội nào đang hoạt động.');
        }

        const opportunity = OPPORTUNITIES.find(o => o.id === session.currentOpportunityId);
        if (!opportunity) {
            throw new Error('Không tìm thấy dữ liệu cơ hội.');
        }

        const choice = opportunity.choices.find(c => c.id === choiceId);
        if (!choice) {
            throw new Error('Lựa chọn không hợp lệ.');
        }

        // --- Resolve outcome ---
        const resolvedOutcome = this.resolveOutcome(choice.outcome);

        // --- Áp dụng rewards ---
        await this.applyRewards(userId, resolvedOutcome.rewards, player);

        // --- Xử lý Curiosity Triggers ---
        await this.processCuriosityTriggers(userId, resolvedOutcome.curiosityTriggers);

        // --- Ghi nhận history ---
        const record: DailyOpportunityRecord = {
            opportunityId: opportunity.id,
            choiceId,
            completedAt: new Date(),
            triggeredNew: false,
        };

        // --- Xử lý Chain Opportunity ---
        let nextOpportunity: Opportunity | null = null;
        let triggeredNew = false;

        if (resolvedOutcome.nextOpportunityId) {
            const nextOpp = OPPORTUNITIES.find(o => o.id === resolvedOutcome.nextOpportunityId);

            if (nextOpp) {
                nextOpportunity = nextOpp;
                triggeredNew = true;
                record.triggeredNew = true;

                // Chain không tính vào completed count
                session.inChain = true;
                session.currentOpportunityId = nextOpp.id;
            }
        }

        // --- Nếu không có chain, kiểm tra spawn机会 mới ---
        if (!nextOpportunity) {
            session.completedCount++;
            session.inChain = false;

            // Kiểm tra spawn opportunity mới
            const spawnChance = this.calculateSpawnChance(player);
            const shouldSpawn = Math.random() < spawnChance;

            if (shouldSpawn && this.hasRemainingSlots(session)) {
                // Spawn opportunity mới
                const world = await this.worldService.getWorld('');
                const usedOppIds = [...session.history.map(h => h.opportunityId), opportunity.id];
                const available = OPPORTUNITIES.filter(opp =>
                    this.checkConditions(opp.conditions, player, world) &&
                    !usedOppIds.includes(opp.id)
                );

                if (available.length > 0) {
                    const newOpp = available[Math.floor(Math.random() * available.length)]!;
                    nextOpportunity = newOpp;
                    triggeredNew = true;
                    record.triggeredNew = true;
                    session.currentOpportunityId = newOpp.id;
                } else {
                    session.currentOpportunityId = null;
                }
            } else {
                session.currentOpportunityId = null;
            }
        }

        // --- Lưu session ---
        session.history.push(record);
        await this.saveDailySession(userId, session);

        // --- Cập nhật player state ---
        await this.playerService.updatePlayer(userId, {
            currentState: resolvedOutcome.stateChange || player.currentState,
        });

        return {
            choice,
            resolvedOutcome,
            nextOpportunity,
            hasMoreOpportunities: this.hasRemainingSlots(session),
            remainingSlots: this.getRemainingSlots(session),
        };
    }

    /**
     * Lấy thông tin daily session hiện tại.
     */
    async getDailySession(userId: string): Promise<DailySession> {
        const player = await this.playerService.getPlayer(userId);
        return this.getOrCreateDailySession(player);
    }

    // --------------------------------------------------------
    // Spawn Chance
    // --------------------------------------------------------

    /**
     * Tính tỷ lệ spawn opportunity mới sau khi hoàn thành.
     * Base: 40%
     * Bonus: +5% mỗi discovery
     * Cap: 80%
     */
    private calculateSpawnChance(player: PlayerState): number {
        const discoveryBonus = player.discoveries.length * SPAWN_CHANCE_PER_DISCOVERY;
        return Math.min(0.8, SPAWN_CHANCE_BASE + discoveryBonus);
    }

    // --------------------------------------------------------
    // Outcome Resolution
    // --------------------------------------------------------

    private resolveOutcome(outcome: ChoiceOutcome): ResolvedOutcome {
        if (outcome.text && outcome.rewards && !outcome.results) {
            return {
                text: outcome.text,
                rewards: outcome.rewards,
                nextOpportunityId: outcome.nextOpportunityId,
                stateChange: outcome.stateChange,
                tag: 'success',
            };
        }

        if (outcome.results && outcome.results.length > 0) {
            return this.rollOutcomeByWeight(outcome.results);
        }

        return {
            text: 'Không có gì xảy ra.',
            rewards: [],
            tag: 'partial',
        };
    }

    private rollOutcomeByWeight(results: OutcomeResult[]): ResolvedOutcome {
        const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);

        if (totalWeight <= 0) {
            return this.mapToResolved(results[0]);
        }

        let roll = Math.random() * totalWeight;

        for (const result of results) {
            roll -= result.weight;
            if (roll <= 0) {
                return this.mapToResolved(result);
            }
        }

        return this.mapToResolved(results[results.length - 1]);
    }

    private mapToResolved(result: OutcomeResult): ResolvedOutcome {
        return {
            text: result.text,
            rewards: result.rewards,
            nextOpportunityId: result.nextOpportunityId,
            stateChange: result.stateChange,
            tag: result.tag || 'success',
            curiosityTriggers: result.curiosityTriggers,
        };
    }

    // --------------------------------------------------------
    // Apply Rewards
    // --------------------------------------------------------

    private async applyRewards(
        userId: string,
        rewards: RewardEffect[],
        player: PlayerState
    ): Promise<void> {
        for (const reward of rewards) {
            switch (reward.type) {
                case 'xp':
                    if (reward.amount) {
                        await this.playerService.addXp(userId, reward.amount);
                    }
                    break;

                case 'currency':
                    if (reward.amount) {
                        await this.playerService.modifyCurrency(userId, reward.amount);
                    }
                    break;

                case 'item':
                    if (reward.targetId && reward.itemName && reward.itemType && reward.amount) {
                        await this.playerService.addItem(userId, {
                            id: reward.targetId,
                            name: reward.itemName,
                            type: reward.itemType
                        }, reward.amount);
                    }
                    break;

                case 'relationship':
                    if (reward.targetId && reward.amount) {
                        await this.playerService.modifyRelationship(userId, reward.targetId, reward.amount);
                    }
                    break;

                case 'discovery':
                    if (reward.targetId) {
                        const discoveries = [...player.discoveries];
                        if (!discoveries.some(d => d.id === reward.targetId)) {
                            discoveries.push({ id: reward.targetId, discoveredAt: new Date() });
                            await this.playerService.updatePlayer(userId, { discoveries });
                        }
                    }
                    break;
            }
        }
    }

    // --------------------------------------------------------
    // Curiosity Triggers
    // --------------------------------------------------------

    /**
     * Xử lý curiosity triggers từ outcome.
     */
    private async processCuriosityTriggers(
        userId: string,
        triggers?: CuriosityTrigger[]
    ): Promise<void> {
        if (!triggers || triggers.length === 0) return;

        for (const trigger of triggers) {
            // Kiểm tra chance
            const chance = trigger.chance ?? 1;
            if (Math.random() > chance) continue;

            try {
                switch (trigger.type) {
                    case 'discover_mystery':
                        await this.curiosityService.discoverMystery(userId, trigger.targetId);
                        break;
                    case 'collect_clue':
                        await this.curiosityService.collectClue(userId, trigger.targetId);
                        break;
                    case 'find_secret':
                        await this.curiosityService.findSecret(userId, trigger.targetId);
                        break;
                    case 'start_chain':
                        await this.curiosityService.startChain(userId, trigger.targetId);
                        break;
                    case 'advance_chain':
                        await this.curiosityService.advanceChain(userId, trigger.targetId, trigger.targetId);
                        break;
                    case 'see_locked_content':
                        await this.curiosityService.seeLockedContent(userId, trigger.targetId);
                        break;
                }
            } catch (error) {
                console.error(`[ECHO Opportunity] Curiosity trigger error:`, error);
            }
        }
    }

    // --------------------------------------------------------
    // Private Helpers
    // --------------------------------------------------------

    private checkConditions(conditions: OpportunityCondition[], player: PlayerState, world: ServerWorldState): boolean {
        for (const cond of conditions) {
            switch (cond.type) {
                case 'weather':
                    if (cond.operator === 'eq' && world.weather !== cond.value) return false;
                    break;
                    
                case 'season':
                    if (cond.operator === 'eq' && world.season !== cond.value) return false;
                    break;
                    
                case 'level':
                    if (cond.operator === 'gte' && player.level < cond.value) return false;
                    if (cond.operator === 'lte' && player.level > cond.value) return false;
                    break;
                    
                case 'item':
                    const item = player.inventory.find(i => i.id === cond.targetId);
                    if (cond.operator === 'has' && (!item || item.quantity <= 0)) return false;
                    break;
                    
                case 'relationship':
                    const rel = player.relationships.find(r => r.npcId === cond.targetId);
                    const relValue = rel ? rel.value : 0;
                    if (cond.operator === 'gte' && relValue < cond.value) return false;
                    if (cond.operator === 'lte' && relValue > cond.value) return false;
                    break;
            }
        }
        return true;
    }

    private isSameDay(d1: Date, d2: Date): boolean {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    private getTodayString(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
}
