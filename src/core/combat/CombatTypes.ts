// ============================================================
// ECHO — Combat Types
// Định nghĩa types cho hệ thống Combat.
// Spec ref: doc/ECHO — HP & Combat System Prompt.md
// ============================================================

// ── Player Combat Stats ─────────────────────────────────────

export interface PlayerCombatStats {
    /** HP hiện tại */
    hp: number;
    /** HP tối đa */
    maxHp: number;
    /** Lực tấn công */
    attack: number;
    /** Lực phòng thủ */
    defense: number;
    /** Tốc độ (ai đi trước) */
    speed: number;
}

/**
 * Combat stats mặc định cho player mới.
 */
export const DEFAULT_PLAYER_COMBAT_STATS: PlayerCombatStats = {
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 10,
};

// ── Enemy ───────────────────────────────────────────────────

export interface Enemy {
    /** ID duy nhất */
    id: string;
    /** Tên hiển thị */
    name: string;
    /** Mô tả */
    description: string;
    /** HP hiện tại (runtime) */
    hp: number;
    /** HP tối đa */
    maxHp: number;
    /** Lực tấn công */
    attack: number;
    /** Lực phòng thủ */
    defense: number;
    /** Tốc độ */
    speed: number;
    /** XP thưởng khi thắng */
    xpReward: number;
    /** Gold thưởng */
    goldReward: number;
    /** Loot table */
    loot: LootEntry[];
    /** Enemy có thể dùng item không */
    canHeal: boolean;
    /** HP ngưỡng để dùng healing (0-1) */
    healThreshold: number;
    /** occur Conditions */
    occurConditions: EnemyCondition[];
}

export interface LootEntry {
    /** Item ID */
    itemId: string;
    /** Tên item */
    itemName: string;
    /** Type */
    itemType: 'resource' | 'key' | 'usable' | 'equipment';
    /** Xác suất drop (0-1) */
    dropRate: number;
    /** Số lượng tối thiểu */
    minAmount: number;
    /** Số lượng tối đa */
    maxAmount: number;
}

export interface EnemyCondition {
    type: 'weather' | 'season' | 'level' | 'region' | 'discovery';
    value?: string | number;
}

// ── Combat Encounter ────────────────────────────────────────

export interface CombatEncounter {
    /** ID encounter (unique per fight) */
    id: string;
    /** Enemy đang fight */
    enemy: Enemy;
    /** Enemy stats ban đầu (để restore) */
    enemyOriginal: Enemy;
    /** Turn hiện tại */
    turn: number;
    /** Combat log */
    log: CombatLog[];
    /** Trạng thái */
    status: CombatStatus;
    /** Player đang defend không */
    playerDefending: boolean;
    /** Enemy đang defend không */
    enemyDefending: boolean;
    /** Status effects đang active */
    playerEffects: ActiveStatusEffect[];
    enemyEffects: ActiveStatusEffect[];
    /** Thời gian bắt đầu */
    startedAt: Date;
    /** Thời gian kết thúc */
    endedAt?: Date;
}

export type CombatStatus = 'active' | 'victory' | 'defeat' | 'escaped';

// ── Combat Actions ──────────────────────────────────────────

export type PlayerActionType = 'attack' | 'defend' | 'use_item' | 'escape';

export interface PlayerAction {
    type: PlayerActionType;
    /** Item ID nếu dùng item */
    itemId?: string;
}

// ── Combat Log ──────────────────────────────────────────────

export interface CombatLog {
    /** Turn */
    turn: number;
    /** Ai thực hiện */
    actor: 'player' | 'enemy';
    /** Action */
    action: string;
    /** Mô tả */
    description: string;
    /** Damage dealt (nếu có) */
    damage?: number;
    /** HP còn lại */
    hpRemaining?: number;
    /** Critical hit? */
    isCritical?: boolean;
}

// ── Combat Result ───────────────────────────────────────────

export interface CombatResult {
    /** Trạng thái cuối */
    status: CombatStatus;
    /** XP nhận được */
    xpGained: number;
    /** Gold nhận được */
    goldGained: number;
    /** Items nhận được */
    itemsGained: LootEntry[];
    /** HP còn lại */
    hpRemaining: number;
    /** HP mất */
    hpLost: number;
    /** Combat log đầy đủ */
    log: CombatLog[];
    /** Tổng số turns */
    totalTurns: number;
}

// ── Status Effects ──────────────────────────────────────────

export type StatusEffectType = 'poison' | 'burn' | 'bleed' | 'stun' | 'slow' | 'atk_up' | 'def_up' | 'regen';

export interface StatusEffect {
    id: StatusEffectType;
    name: string;
    description: string;
    /** Damage/heal per turn (0 nếu là buff) */
    damagePerTurn: number;
    /** Giảm stat? */
    statModifier?: Partial<PlayerCombatStats>;
    /** Số turns còn lại (-1 = vĩnh viễn cho đến khi hết combat) */
    duration: number;
    /** Xác suất aplicar khi bị attack (0-1) */
    applyChance: number;
}

export interface ActiveStatusEffect {
    effect: StatusEffect;
    turnsRemaining: number;
}

// ── Combat Config ───────────────────────────────────────────

export interface CombatConfig {
    /** Base critical hit chance (0-1) */
    criticalChance: number;
    /** Critical damage multiplier */
    criticalMultiplier: number;
    /** Escape base chance (0-1) */
    escapeBaseChance: number;
    /** Defend damage reduction (0-1) */
    defendReduction: number;
    /** Max turns trước khi auto-escape */
    maxTurns: number;
}

export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
    criticalChance: 0.1,
    criticalMultiplier: 1.5,
    escapeBaseChance: 0.5,
    defendReduction: 0.5,
    maxTurns: 20,
};

// ── Item trong combat ───────────────────────────────────────

export interface CombatItem {
    id: string;
    name: string;
    type: 'heal' | 'buff' | 'damage' | 'escape';
    /** Giá trị healing/buff/damage */
    value: number;
    /** Duration cho buff (turns) */
    duration?: number;
    /** Status effect gây ra */
    appliesEffect?: StatusEffectType;
    /** Description */
    description: string;
}
