// ============================================================
// ECHO — Combat Service
// Core logic cho hệ thống Combat.
// ============================================================

import { EventEmitter } from 'events';
import { PlayerService } from '../player/PlayerService';
import {
    PlayerCombatStats,
    CombatEncounter,
    CombatStatus,
    PlayerAction,
    Enemy,
    ActiveStatusEffect,
    DEFAULT_COMBAT_CONFIG,
    CombatConfig,
} from './CombatTypes';
import { getRandomEnemy, getCombatItem, STATUS_EFFECTS } from './EnemyConfig';

export const COMBAT_EVENTS = {
    COMBAT_STARTED: 'combat:started',
    COMBAT_ENDED: 'combat:ended',
} as const;

const activeEncounters: Map<string, CombatEncounter> = new Map();

export class CombatService {
    public readonly events: EventEmitter = new EventEmitter();
    private config: CombatConfig = DEFAULT_COMBAT_CONFIG;

    constructor(private readonly playerService: PlayerService) {}

    async startEncounter(userId: string): Promise<CombatEncounter> {
        const player = await this.playerService.getPlayer(userId);
        if (player.combat.hp <= 0) throw new Error('HP = 0. Hãy hồi phục!');
        const existing = activeEncounters.get(userId);
        if (existing?.status === 'active') throw new Error('Đang trong combat!');
        const enemy = getRandomEnemy(player.level);
        return this.createEncounter(userId, enemy);
    }

    async startEncounterWithEnemy(userId: string, enemy: Enemy): Promise<CombatEncounter> {
        const player = await this.playerService.getPlayer(userId);
        if (player.combat.hp <= 0) throw new Error('HP = 0!');
        const existing = activeEncounters.get(userId);
        if (existing?.status === 'active') throw new Error('Đang trong combat!');
        return this.createEncounter(userId, enemy);
    }

    private createEncounter(userId: string, enemy: Enemy): CombatEncounter {
        const encounter: CombatEncounter = {
            id: `combat_${userId}_${Date.now()}`,
            enemy: { ...enemy },
            enemyOriginal: { ...enemy },
            turn: 1,
            log: [{ turn: 1, actor: 'player', action: 'encounter', description: `Bạn gặp **${enemy.name}**!` }],
            status: 'active',
            playerDefending: false,
            enemyDefending: false,
            playerEffects: [],
            enemyEffects: [],
            startedAt: new Date(),
        };
        activeEncounters.set(userId, encounter);
        this.events.emit(COMBAT_EVENTS.COMBAT_STARTED, { userId, enemyName: enemy.name });
        return encounter;
    }

    async performAction(userId: string, action: PlayerAction): Promise<CombatEncounter> {
        const encounter = activeEncounters.get(userId);
        if (!encounter || encounter.status !== 'active') throw new Error('Không có combat!');
        const player = await this.playerService.getPlayer(userId);
        const pStats = this.getEffectiveStats(player.combat, encounter.playerEffects);

        encounter.playerDefending = false;
        encounter.enemyDefending = false;

        await this.processStatusEffects(userId, encounter, 'player');

        if (this.hasEffect(encounter.playerEffects, 'stun')) {
            encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'stunned', description: 'Bạn bị choáng, bỏ lượt!' });
        } else {
            await this.processPlayerAction(userId, encounter, action, pStats);
        }

        if (encounter.enemy.hp <= 0) return this.endCombat(userId, encounter, 'victory');
        await this.processEnemyAction(encounter, pStats);
        const updatedPlayer = await this.playerService.getPlayer(userId);
        if (updatedPlayer.combat.hp <= 0) return this.endCombat(userId, encounter, 'defeat');

        await this.processStatusEffects(userId, encounter, 'enemy');
        if (encounter.enemy.hp <= 0) return this.endCombat(userId, encounter, 'victory');

        encounter.turn++;
        if (encounter.turn > this.config.maxTurns) return this.endCombat(userId, encounter, 'escaped');
        return encounter;
    }

    async escape(userId: string): Promise<CombatEncounter> {
        const encounter = activeEncounters.get(userId);
        if (!encounter || encounter.status !== 'active') throw new Error('Không có combat!');
        const player = await this.playerService.getPlayer(userId);
        const pStats = this.getEffectiveStats(player.combat, encounter.playerEffects);
        const speedDiff = pStats.speed - encounter.enemy.speed;
        const chance = Math.min(0.9, this.config.escapeBaseChance + speedDiff * 0.03);

        if (Math.random() < chance) {
            encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'escape', description: 'Thoát thành công!' });
            return this.endCombat(userId, encounter, 'escaped');
        }
        encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'escape_fail', description: 'Không thể thoát!' });
        await this.processEnemyAction(encounter, pStats);
        const p = await this.playerService.getPlayer(userId);
        if (p.combat.hp <= 0) return this.endCombat(userId, encounter, 'defeat');
        encounter.turn++;
        return encounter;
    }

    getEncounter(userId: string): CombatEncounter | null {
        const e = activeEncounters.get(userId);
        return e?.status === 'active' ? e : null;
    }

    async getPlayerStats(userId: string): Promise<PlayerCombatStats> {
        const p = await this.playerService.getPlayer(userId);
        return { ...p.combat };
    }

    async healPlayer(userId: string, amount: number): Promise<void> {
        const p = await this.playerService.getPlayer(userId);
        const hp = Math.min(p.combat.maxHp, p.combat.hp + amount);
        await this.playerService.updatePlayer(userId, { combat: { ...p.combat, hp } });
    }

    async fullHeal(userId: string): Promise<void> {
        const p = await this.playerService.getPlayer(userId);
        await this.playerService.updatePlayer(userId, { combat: { ...p.combat, hp: p.combat.maxHp } });
    }

    // ── Private Helpers ─────────────────────────────────────

    private getEffectiveStats(base: PlayerCombatStats, effects: ActiveStatusEffect[]): PlayerCombatStats {
        const s = { ...base };
        for (const a of effects) {
            if (a.effect.statModifier) {
                const m = a.effect.statModifier;
                if (m.attack) s.attack += m.attack;
                if (m.defense) s.defense += m.defense;
                if (m.speed) s.speed += m.speed;
            }
        }
        s.attack = Math.max(0, s.attack);
        s.defense = Math.max(0, s.defense);
        s.speed = Math.max(0, s.speed);
        return s;
    }

    private hasEffect(effects: ActiveStatusEffect[], type: string): boolean {
        return effects.some(e => e.effect.id === type);
    }

    private addEffect(effects: ActiveStatusEffect[], effectId: string): void {
        const effect = STATUS_EFFECTS[effectId];
        if (!effect) return;
        const existing = effects.find(e => e.effect.id === effectId);
        if (existing) { existing.turnsRemaining = effect.duration; }
        else { effects.push({ effect, turnsRemaining: effect.duration }); }
    }

    private calculateDamage(attack: number, defense: number, defending: boolean): number {
        let base = Math.max(1, attack - defense);
        const variance = Math.floor(Math.random() * 5) - 2;
        base += variance;
        if (defending) base = Math.floor(base * this.config.defendReduction);
        return Math.max(1, base);
    }

    private tryApplyEnemyStatusEffect(encounter: CombatEncounter): void {
        if (Math.random() < 0.15) {
            const effects = ['poison', 'bleed', 'slow'];
            const id = effects[Math.floor(Math.random() * effects.length)];
            this.addEffect(encounter.enemyEffects, id);
            const effect = STATUS_EFFECTS[id];
            encounter.log.push({ turn: encounter.turn, actor: 'enemy', action: 'status', description: `${encounter.enemy.name} bị **${effect.name}**!` });
        }
    }

    private async processStatusEffects(userId: string, encounter: CombatEncounter, target: 'player' | 'enemy'): Promise<void> {
        const effects = target === 'player' ? encounter.playerEffects : encounter.enemyEffects;
        const toRemove: number[] = [];
        for (let i = 0; i < effects.length; i++) {
            const a = effects[i];
            if (a.effect.damagePerTurn !== 0) {
                if (target === 'player') {
                    const p = await this.playerService.getPlayer(userId);
                    const hp = Math.max(0, Math.min(p.combat.maxHp, p.combat.hp - a.effect.damagePerTurn));
                    await this.playerService.updatePlayer(userId, { combat: { ...p.combat, hp } });
                    encounter.log.push({ turn: encounter.turn, actor: 'player', action: a.effect.id, description: `${a.effect.name}: ${a.effect.damagePerTurn > 0 ? '-' : '+'}${Math.abs(a.effect.damagePerTurn)} HP`, hpRemaining: hp });
                } else {
                    encounter.enemy.hp = Math.max(0, encounter.enemy.hp - a.effect.damagePerTurn);
                    encounter.log.push({ turn: encounter.turn, actor: 'enemy', action: a.effect.id, description: `${encounter.enemy.name} - ${a.effect.name}: ${a.effect.damagePerTurn > 0 ? '-' : '+'}${Math.abs(a.effect.damagePerTurn)} HP`, hpRemaining: encounter.enemy.hp });
                }
            }
            a.turnsRemaining--;
            if (a.turnsRemaining <= 0) toRemove.push(i);
        }
        for (let i = toRemove.length - 1; i >= 0; i--) effects.splice(toRemove[i], 1);
    }

    private async processPlayerAction(userId: string, encounter: CombatEncounter, action: PlayerAction, pStats: PlayerCombatStats): Promise<void> {
        const player = await this.playerService.getPlayer(userId);
        switch (action.type) {
            case 'attack': {
                const dmg = this.calculateDamage(pStats.attack, encounter.enemy.defense, encounter.enemyDefending);
                const crit = Math.random() < this.config.criticalChance;
                const final = crit ? Math.floor(dmg * this.config.criticalMultiplier) : dmg;
                encounter.enemy.hp = Math.max(0, encounter.enemy.hp - final);
                encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'attack', description: `Tấn công **${encounter.enemy.name}**${crit ? ' **CRITICAL!**' : ''} gây ${final} damage!`, damage: final, hpRemaining: encounter.enemy.hp, isCritical: crit });
                break;
            }
            case 'defend': {
                encounter.playerDefending = true;
                encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'defend', description: 'Phòng thủ! Giảm 50% damage.' });
                break;
            }
            case 'use_item': {
                if (!action.itemId) break;
                const item = getCombatItem(action.itemId);
                if (!item) { encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'use_item', description: 'Item không hợp lệ!' }); break; }
                if (item.type === 'heal') {
                    if (item.appliesEffect) {
                        encounter.playerEffects = encounter.playerEffects.filter(e => e.effect.id !== item.appliesEffect);
                        encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'use_item', description: `Dùng **${item.name}**: ${item.description}` });
                    } else {
                        const hp = Math.min(player.combat.maxHp, player.combat.hp + item.value);
                        await this.playerService.updatePlayer(userId, { combat: { ...player.combat, hp } });
                        encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'use_item', description: `Dùng **${item.name}**: Hồi ${item.value} HP`, hpRemaining: hp });
                    }
                } else if (item.type === 'buff') {
                    this.addEffect(encounter.playerEffects, item.appliesEffect || 'atk_up');
                    encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'use_item', description: `Dùng **${item.name}**: ${item.description}` });
                } else if (item.type === 'damage') {
                    const dmg = item.value;
                    encounter.enemy.hp = Math.max(0, encounter.enemy.hp - dmg);
                    if (item.appliesEffect) this.addEffect(encounter.enemyEffects, item.appliesEffect);
                    encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'use_item', description: `Dùng **${item.name}**: Gây ${dmg} damage!`, damage: dmg, hpRemaining: encounter.enemy.hp });
                } else if (item.type === 'escape') {
                    encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'use_item', description: `Dùng **${item.name}**: Thoát ngay lập tức!` });
                    encounter.status = 'escaped';
                }
                break;
            }
        }
    }

    private async processEnemyAction(encounter: CombatEncounter, pStats: PlayerCombatStats): Promise<void> {
        const enemy = encounter.enemy;
        if (this.hasEffect(encounter.enemyEffects, 'stun')) {
            encounter.log.push({ turn: encounter.turn, actor: 'enemy', action: 'stunned', description: `${enemy.name} bị choáng, bỏ lượt!` });
            return;
        }
        const dmg = this.calculateDamage(enemy.attack, pStats.defense, encounter.playerDefending);
        const player = await this.playerService.getPlayer(encounter.id.split('_')[1]);
        const hp = Math.max(0, player.combat.hp - dmg);
        await this.playerService.updatePlayer(encounter.id.split('_')[1], { combat: { ...player.combat, hp } });
        encounter.log.push({ turn: encounter.turn, actor: 'enemy', action: 'attack', description: `${enemy.name} tấn công! Gây ${dmg} damage.`, damage: dmg, hpRemaining: hp });
    }

    private async endCombat(userId: string, encounter: CombatEncounter, status: CombatStatus): Promise<CombatEncounter> {
        encounter.status = status;
        encounter.endedAt = new Date();
        let xpGained = 0, goldGained = 0;

        if (status === 'victory') {
            xpGained = encounter.enemyOriginal.xpReward;
            goldGained = encounter.enemyOriginal.goldReward;
            await this.playerService.addXp(userId, xpGained);
            await this.playerService.modifyCurrency(userId, goldGained);
            encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'victory', description: `Thắng! +${xpGained} XP, +${goldGained} Gold` });
        } else if (status === 'defeat') {
            const p = await this.playerService.getPlayer(userId);
            await this.playerService.updatePlayer(userId, { combat: { ...p.combat, hp: Math.max(1, Math.floor(p.combat.maxHp * 0.1)) } });
            encounter.log.push({ turn: encounter.turn, actor: 'player', action: 'defeat', description: 'Thua! Bạn tỉnh dậy với 10% HP.' });
        }

        this.events.emit(COMBAT_EVENTS.COMBAT_ENDED, { userId, status, xpGained, goldGained });
        activeEncounters.delete(userId);
        return encounter;
    }
}
