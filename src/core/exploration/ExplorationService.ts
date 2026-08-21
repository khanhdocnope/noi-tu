// ============================================================
// ECHO — Exploration Service
// Core logic cho hệ thống thám hiểm.
// ============================================================

import { EventEmitter } from 'events';
import { PlayerService } from '../player/PlayerService';
import { WorldStateService } from '../world/WorldStateService';
import { CombatService } from '../combat/CombatService';
import { Enemy } from '../combat/CombatTypes';
import { ENEMIES } from '../combat/EnemyConfig';
import {
    ExplorationResult,
    ExplorationSession,
    ExplorationEvent,
    EXPLORATION_CONSTANTS,
} from './ExplorationTypes';
import { getRegionConfig, getAvailableRegions } from './RegionConfigs';

export const EXPLORATION_EVENTS = {
    EXPLORATION_COMPLETED: 'exploration:completed',
    COMBAT_TRIGGERED: 'exploration:combat_triggered',
    DISCOVERY_FOUND: 'exploration:discovery_found',
} as const;

const activeSessions: Map<string, ExplorationSession> = new Map();

export class ExplorationService {
    public readonly events: EventEmitter = new EventEmitter();

    constructor(
        private readonly playerService: PlayerService,
        private readonly worldService: WorldStateService,
        private readonly combatService: CombatService
    ) {}

    /**
     * Bắt đầu exploration session.
     */
    async startExploration(userId: string, regionId: string): Promise<ExplorationResult> {
        const player = await this.playerService.getPlayer(userId);
        const regionConfig = getRegionConfig(regionId);

        if (!regionConfig) throw new Error(`Region "${regionId}" không tồn tại.`);
        if (player.level < regionConfig.minLevel) throw new Error(`Cần level ${regionConfig.minLevel} để thám hiểm ${regionConfig.name}.`);

        const hpPercent = player.combat.hp / player.combat.maxHp;
        if (hpPercent < regionConfig.minHpPercent) throw new Error(`HP quá thấp! Cần ít nhất ${Math.ceil(regionConfig.minHpPercent * 100)}% HP.`);

        // Kiểm tra session hiện tại
        const existing = activeSessions.get(userId);
        if (existing?.isActive) throw new Error('Đang thám hiểm! Hoàn thành trước.');

        const result = await this.doExploration(userId, player, regionConfig, regionConfig.modifiers);

        // Cập nhật session
        const session: ExplorationSession = {
            userId,
            regionId,
            explorationCount: 1,
            startHp: player.combat.hp,
            totalGold: result.goldGained,
            totalItems: [...result.itemsGained],
            discoveries: result.discovery ? [result.discovery] : [],
            startedAt: new Date(),
            isActive: result.canContinue,
        };
        activeSessions.set(userId, session);

        return result;
    }

    /**
     * Tiếp tục exploration (sau lần đầu).
     */
    async continueExploration(userId: string): Promise<ExplorationResult> {
        const session = activeSessions.get(userId);
        if (!session?.isActive) throw new Error('Không có exploration session nào đang active.');

        const player = await this.playerService.getPlayer(userId);
        const regionConfig = getRegionConfig(session.regionId);
        if (!regionConfig) throw new Error('Region không tồn tại.');

        const hpPercent = player.combat.hp / player.combat.maxHp;
        if (hpPercent < EXPLORATION_CONSTANTS.MIN_HP_PERCENT) {
            session.isActive = false;
            throw new Error('HP quá thấp! Hãy hồi phục trước.');
        }

        if (session.explorationCount >= EXPLORATION_CONSTANTS.MAX_EXPLORATIONS_PER_SESSION) {
            session.isActive = false;
            throw new Error('Đã thám hiểm tối đa lần trong session.');
        }

        const result = await this.doExploration(userId, player, regionConfig, regionConfig.modifiers);

        // Cập nhật session
        session.explorationCount++;
        session.totalGold += result.goldGained;
        session.totalItems.push(...result.itemsGained);
        if (result.discovery) session.discoveries.push(result.discovery);
        session.isActive = result.canContinue;

        if (!result.canContinue) activeSessions.delete(userId);

        return result;
    }

    /**
     * Kết thúc exploration session.
     */
    endExploration(userId: string): ExplorationSession | null {
        const session = activeSessions.get(userId);
        if (session) {
            session.isActive = false;
            activeSessions.delete(userId);
            return session;
        }
        return null;
    }

    /**
     * Lấy regions khả dụng.
     */
    async getAvailableRegions(userId: string): Promise<Array<{ regionId: string; name: string; description: string; minLevel: number; locked: boolean }>> {
        const player = await this.playerService.getPlayer(userId);
        return getAvailableRegions(player.level).map(r => ({
            regionId: r.regionId,
            name: r.name,
            description: r.description,
            minLevel: r.minLevel,
            locked: false,
        }));
    }

    /**
     * Lấy session hiện tại.
     */
    getSession(userId: string): ExplorationSession | null {
        const session = activeSessions.get(userId);
        return session && session.isActive ? session : null;
    }

    // ── Private Helpers ─────────────────────────────────────

    private async doExploration(
        userId: string,
        player: any,
        regionConfig: any,
        modifiers: any
    ): Promise<ExplorationResult> {
        // Roll event
        const event = this.rollEvent(regionConfig.events, modifiers, player);

        let result: ExplorationResult = {
            regionId: regionConfig.regionId,
            event,
            description: event.description,
            hpBefore: player.combat.hp,
            hpAfter: player.combat.hp,
            goldGained: 0,
            itemsGained: [],
            xpGained: EXPLORATION_CONSTANTS.XP_PER_EXPLORATION,
            canContinue: true,
        };

        switch (event.type) {
            case 'combat': {
                // Spawn enemy từ config hoặc random
                const enemy = event.data?.enemyId
                    ? ENEMIES.find(e => e.id === event.data!.enemyId)
                    : ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

                if (enemy) {
                    const encounter = await this.combatService.startEncounterWithEnemy(userId, { ...enemy } as Enemy);
                    result.description = `Bạn gặp **${enemy.name}**! Đã bắt đầu combat.`;
                    result.canContinue = false; // Phải hoàn thành combat trước

                    this.events.emit(EXPLORATION_EVENTS.COMBAT_TRIGGERED, {
                        userId,
                        enemyName: enemy.name,
                        regionId: regionConfig.regionId,
                    });
                }
                break;
            }

            case 'item': {
                if (event.data) {
                    const amount = event.data.itemAmount || 1;
                    // Thêm item vào inventory (giả sử playerService có method)
                    result.itemsGained.push({
                        itemId: event.data.itemId || 'unknown',
                        itemName: event.data.itemName || 'Unknown Item',
                        amount,
                    });
                    result.description += ` (+${amount} ${event.data.itemName})`;
                }
                break;
            }

            case 'treasure': {
                const gold = event.data?.goldAmount || 10;
                await this.playerService.modifyCurrency(userId, gold);
                result.goldGained = gold;
                result.description += ` (+${gold} Gold)`;
                break;
            }

            case 'trap': {
                const damage = Math.abs(event.data?.hpChange || 10);
                const newHp = Math.max(1, player.combat.hp - damage);
                await this.playerService.updatePlayer(userId, {
                    combat: { ...player.combat, hp: newHp },
                });
                result.hpAfter = newHp;
                result.description += ` (-${damage} HP)`;
                break;
            }

            case 'rest': {
                const heal = event.data?.hpChange || EXPLORATION_CONSTANTS.REST_HEAL_AMOUNT;
                const newHp = Math.min(player.combat.maxHp, player.combat.hp + heal);
                await this.playerService.updatePlayer(userId, {
                    combat: { ...player.combat, hp: newHp },
                });
                result.hpAfter = newHp;
                result.description += ` (+${heal} HP)`;
                break;
            }

            case 'discovery': {
                const discoveryId = event.data?.discoveryId || 'unknown';
                result.discovery = discoveryId;
                result.description += ` (Discovery: ${discoveryId})`;

                this.events.emit(EXPLORATION_EVENTS.DISCOVERY_FOUND, {
                    userId,
                    discoveryId,
                    regionId: regionConfig.regionId,
                });
                break;
            }

            case 'nothing': {
                // Không làm gì
                break;
            }
        }

        // Thêm XP
        await this.playerService.addXp(userId, result.xpGained);

        this.events.emit(EXPLORATION_EVENTS.EXPLORATION_COMPLETED, {
            userId,
            regionId: regionConfig.regionId,
            eventType: event.type,
        });

        return result;
    }

    private rollEvent(events: ExplorationEvent[], modifiers: any, player: any): ExplorationEvent {
        // Tính weight với modifiers
        const weightedEvents = events.map(e => {
            let weight = e.weight;

            // Apply modifiers
            if (e.type === 'combat') weight += modifiers.combatChanceMod;
            if (e.type === 'item') weight += modifiers.itemDropMod;
            if (e.type === 'treasure') weight += modifiers.goldMod;
            if (e.type === 'trap') weight += modifiers.damageMod;

            // Level-based modifiers
            if (player.level >= 10) {
                if (e.type === 'combat') weight *= 1.2;
                if (e.type === 'treasure') weight *= 1.3;
            }

            return { event: e, weight: Math.max(0.01, weight) };
        });

        // Weighted random
        const totalWeight = weightedEvents.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const { event, weight } of weightedEvents) {
            roll -= weight;
            if (roll <= 0) return event;
        }

        return events[events.length - 1];
    }
}
