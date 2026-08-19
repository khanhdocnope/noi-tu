// ============================================================
// ECHO — Opportunity Service
// Game engine chính để xử lý lựa chọn, đánh giá điều kiện, 
// và áp dụng kết quả lên PlayerState và WorldState.
// Spec ref: Section 6 (Non-deterministic), 8 (Context), 9 (Outcome)
// ============================================================

import { Opportunity, OpportunityChoice, ChoiceOutcome, OpportunityCondition } from './OpportunityTypes';
import { OPPORTUNITIES } from './OpportunityConfig';
import { PlayerService } from '../player/PlayerService';
import { WorldStateService } from '../world/WorldStateService';
import { PlayerState } from '../player/PlayerStateTypes';
import { ServerWorldState } from '../world/WorldStateTypes';

export class OpportunityService {
    constructor(
        private readonly playerService: PlayerService,
        private readonly worldService: WorldStateService
    ) {}

    /**
     * Tìm một cơ hội phù hợp cho người chơi hôm nay dựa trên Context (Weather, Level, v.v.).
     * Nếu người chơi đang có cơ hội dang dở hoặc đã hoàn thành cơ hội hôm nay, xử lý phù hợp.
     */
    async getOrRollOpportunity(userId: string, guildId: string): Promise<Opportunity> {
        const player = await this.playerService.getPlayer(userId);
        
        // 1. Kiểm tra cơ hội hoạt động của ngày hôm nay
        if (player.activeOpportunity) {
            const rolledDate = new Date(player.activeOpportunity.rolledAt);
            const isToday = this.isSameDay(rolledDate, new Date());

            if (isToday) {
                if (player.activeOpportunity.completed) {
                    throw new Error('TODAY_COMPLETED');
                }
                const activeOpp = OPPORTUNITIES.find(o => o.id === player.activeOpportunity?.opportunityId);
                if (activeOpp) return activeOpp;
            }
        }

        // 2. Lấy World State hiện tại
        const world = await this.worldService.getWorld(guildId);

        // 3. Lọc ra các cơ hội thỏa mãn điều kiện
        const available = OPPORTUNITIES.filter(opp => this.checkConditions(opp.conditions, player, world));

        // 4. Chọn ngẫu nhiên một cơ hội từ danh sách hợp lệ
        if (available.length === 0) {
            // Fallback nếu không tìm thấy cơ hội nào (luôn có crystal_peddler làm fallback)
            const fallbackOpp = OPPORTUNITIES.find(o => o.id === 'crystal_peddler')!;
            
            await this.playerService.updatePlayer(userId, {
                activeOpportunity: {
                    opportunityId: fallbackOpp.id,
                    rolledAt: new Date(),
                    completed: false,
                    history: []
                }
            });
            return fallbackOpp;
        }

        const selected = available[Math.floor(Math.random() * available.length)]!;

        // 5. Cập nhật trạng thái người chơi: gán cơ hội đang hoạt động mới
        await this.playerService.updatePlayer(userId, {
            activeOpportunity: {
                opportunityId: selected.id,
                rolledAt: new Date(),
                completed: false,
                history: []
            }
        });

        return selected;
    }

    /**
     * Người chơi thực hiện lựa chọn.
     * Áp dụng tất cả phần thưởng/hậu quả và trả về kết quả.
     */
    async makeChoice(userId: string, choiceId: string): Promise<{ choice: OpportunityChoice; outcome: ChoiceOutcome }> {
        const player = await this.playerService.getPlayer(userId);
        
        if (!player.activeOpportunity || player.activeOpportunity.completed) {
            throw new Error('Bạn không có cơ hội nào đang hoạt động hoặc cơ hội đã hoàn thành hôm nay.');
        }

        const opportunity = OPPORTUNITIES.find(o => o.id === player.activeOpportunity?.opportunityId);
        if (!opportunity) {
            throw new Error('Không tìm thấy dữ liệu cơ hội đang hoạt động.');
        }

        const choice = opportunity.choices.find(c => c.id === choiceId);
        if (!choice) {
            throw new Error('Lựa chọn không hợp lệ.');
        }

        const outcome = choice.outcome;

        // --- Áp dụng phần thưởng lên Player State ---
        for (const reward of outcome.rewards) {
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

        // Cập nhật trạng thái của cơ hội thành đã hoàn thành
        const history = [...(player.activeOpportunity.history || []), choiceId];
        await this.playerService.updatePlayer(userId, {
            currentState: outcome.stateChange || player.currentState,
            activeOpportunity: {
                ...player.activeOpportunity,
                completed: true,
                history
            }
        });

        return { choice, outcome };
    }

    // --------------------------------------------------------
    // Private Helpers
    // --------------------------------------------------------

    /**
     * Hàm đánh giá điều kiện (Conditions Engine).
     * Spec ref: Section 6 (Context) & 28 (Flexible Conditions)
     */
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
}
