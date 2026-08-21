// ============================================================
// ECHO — Exploration Types
// Hệ thống thám hiểm, kết hợp combat, items, discoveries.
// ============================================================

// ── Exploration Event ───────────────────────────────────────

export type ExplorationEventType =
    | 'combat'       // Gặp enemy
    | 'item'         // Tìm item
    | 'treasure'     // Tìm gold/treasure
    | 'discovery'    // Khám phá bí ẩn
    | 'trap'         // Bẫy, mất HP
    | 'rest'         // Tìm chỗ nghỉ, hồi HP
    | 'nothing'      // Không có gì
    | 'npc';         // Gặp NPC

export interface ExplorationEvent {
    type: ExplorationEventType;
    /** Tên hiển thị */
    name: string;
    /** Mô tả */
    description: string;
    /** Xác suất xảy ra (0-1) */
    weight: number;
    /** Điều kiện xuất hiện */
    conditions?: ExplorationCondition[];
    /** Data cụ thể tùy type */
    data?: ExplorationEventData;
}

export interface ExplorationCondition {
    type: 'weather' | 'season' | 'time_of_day' | 'level' | 'region' | 'hp_percent';
    value?: string | number;
    operator?: 'eq' | 'gte' | 'lte' | 'has';
}

export interface ExplorationEventData {
    /** Enemy ID (nếu type = combat) */
    enemyId?: string;
    /** Item data (nếu type = item) */
    itemId?: string;
    itemName?: string;
    itemType?: 'resource' | 'key' | 'usable' | 'equipment';
    itemAmount?: number;
    /** Gold amount (nếu type = treasure) */
    goldAmount?: number;
    /** HP change (nếu type = trap/rest) */
    hpChange?: number;
    /** Discovery ID (nếu type = discovery) */
    discoveryId?: string;
    /** NPC ID (nếu type = npc) */
    npcId?: string;
}

// ── Region Exploration Config ───────────────────────────────

export interface RegionExplorationConfig {
    /** Region ID */
    regionId: string;
    /** Tên hiển thị */
    name: string;
    /** Mô tả */
    description: string;
    /** Level yêu cầu */
    minLevel: number;
    /** HP tối thiểu để thám hiểm */
    minHpPercent: number;
    /** Events có thể xảy ra */
    events: ExplorationEvent[];
    /** Modifiers cho region này */
    modifiers: ExplorationModifiers;
}

export interface ExplorationModifiers {
    /** Modifier cho combat chance (+/- từ base) */
    combatChanceMod: number;
    /** Modifier cho item drop rate */
    itemDropMod: number;
    /** Modifier cho gold found */
    goldMod: number;
    /** Modifier cho damage taken */
    damageMod: number;
}

// ── Exploration Result ──────────────────────────────────────

export interface ExplorationResult {
    /** Region đã thám hiểm */
    regionId: string;
    /** Event xảy ra */
    event: ExplorationEvent;
    /** Mô tả kết quả */
    description: string;
    /** HP trước */
    hpBefore: number;
    /** HP sau */
    hpAfter: number;
    /** Gold nhận được */
    goldGained: number;
    /** Items nhận được */
    itemsGained: Array<{ itemId: string; itemName: string; amount: number }>;
    /** XP nhận được */
    xpGained: number;
    /** Discovery mới (nếu có) */
    discovery?: string;
    /** Có tiếp tục thám hiểm không */
    canContinue: boolean;
    /** Lý do không tiếp tục */
    stopReason?: string;
}

// ── Exploration Session ─────────────────────────────────────

export interface ExplorationSession {
    /** User ID */
    userId: string;
    /** Region đang thám hiểm */
    regionId: string;
    /** Số lần đã thám hiểm */
    explorationCount: number;
    /** HP ban đầu */
    startHp: number;
    /** Tổng gold tìm được */
    totalGold: number;
    /** Tổng items tìm được */
    totalItems: Array<{ itemId: string; itemName: string; amount: number }>;
    /** Các discovery mới */
    discoveries: string[];
    /** Thời gian bắt đầu */
    startedAt: Date;
    /** Đang active không */
    isActive: boolean;
}

// ── Constants ───────────────────────────────────────────────

export const EXPLORATION_CONSTANTS = {
    /** HP tối thiểu để tiếp tục探索 */
    MIN_HP_PERCENT: 0.15,
    /** Số lần探索 tối đa mỗi session */
    MAX_EXPLORATIONS_PER_SESSION: 10,
    /** Base chance tìm item */
    BASE_ITEM_CHANCE: 0.3,
    /** Base chance gặp combat */
    BASE_COMBAT_CHANCE: 0.35,
    /** Base chance tìm treasure */
    BASE_TREASURE_CHANCE: 0.2,
    /** Base chance bị trap */
    BASE_TRAP_CHANCE: 0.1,
    /** Base chance tìm chỗ rest */
    BASE_REST_CHANCE: 0.15,
    /** HP recovery từ rest */
    REST_HEAL_AMOUNT: 20,
    /** XP mỗi lần探索 */
    XP_PER_EXPLORATION: 5,
} as const;
