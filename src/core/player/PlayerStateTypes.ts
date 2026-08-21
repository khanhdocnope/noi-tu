// ============================================================
// ECHO — Player State Types
// Định nghĩa cấu trúc dữ liệu cho trạng thái của người chơi.
// Spec ref: Section 10 (Personal Progression), 13 (Streak), 16 (Memory),
//           Core Loop (Daily depth - multiple opportunities per day)
// ============================================================

export interface PlayerItem {
    id: string;
    name: string;
    quantity: number;
    type: 'resource' | 'key' | 'usable' | 'equipment';
}

export interface PlayerRelationship {
    npcId: string;
    value: number; // Điểm thân thiết, có thể âm hoặc dương
}

export interface PlayerDiscovery {
    id: string; // ID của khu vực, bí mật hoặc lore đã khám phá
    discoveredAt: Date;
}

export interface PlayerStreak {
    current: number;          // Số ngày liên tục hiện tại
    max: number;              // Kỷ lục streak cao nhất
    lastActiveAt: Date | null;// Ngày cuối cùng thực hiện hành động
    protectionActive: boolean;// Đang kích hoạt bảo vệ streak hay không
}

/**
 * Một cơ hội đang hoạt động hoặc đã hoàn thành trong ngày.
 */
export interface DailyOpportunityRecord {
    opportunityId: string;
    choiceId?: string;        // Lựa chọn đã thực hiện (nếu hoàn thành)
    completedAt?: Date;
    triggeredNew: boolean;    // Có tạo ra opportunity mới không
}

/**
 * Session chơi trong ngày.
 * Track số opportunity đã chơi, còn bao nhiêu, và history.
 * Spec ref: Core Loop (Daily depth - 1-3+ opportunities per day)
 */
export interface DailySession {
    /** Ngày của session (YYYY-MM-DD) */
    date: string;

    /** Số opportunity đã hoàn thành hôm nay */
    completedCount: number;

    /** Số opportunity cơ bản mỗi ngày (1-3, tăng theo level) */
    baseSlots: number;

    /** Số opportunity bonus (từ chain/discovery) */
    bonusSlots: number;

    /** Cơ hội hiện tại đang chờ chọn (null nếu đang ở giữa ngày) */
    currentOpportunityId: string | null;

    /** Tất cả opportunity đã chơi hôm nay */
    history: DailyOpportunityRecord[];

    /** Có đang trong chuỗi chain không */
    inChain: boolean;
}

export interface ActivePlayerOpportunity {
    opportunityId: string;
    rolledAt: Date;
    completed: boolean;
    history: string[];
}

/**
 * Combat stats của Player.
 */
export interface PlayerCombatStats {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
}

/**
 * Trạng thái của Player.
 * Hot State chứa Level, XP, Gold, Streak.
 * Persistent State chứa Inventory, Relationships, Discoveries.
 * Spec ref: Section 16 (Memory)
 */
export interface PlayerState {
    userId: string;
    
    // --- Hot State ---
    level: number;
    xp: number;
    currency: number;
    streak: PlayerStreak;
    currentState: string;
    
    // --- Combat Stats ---
    combat: PlayerCombatStats;
    
    // --- Persistent State ---
    inventory: PlayerItem[];
    relationships: PlayerRelationship[];
    discoveries: PlayerDiscovery[];
    activeOpportunity?: ActivePlayerOpportunity | null;

    // --- Daily Session ---
    /** Session hiện tại (tự reset mỗi ngày) */
    dailySession?: DailySession | null;
    
    // --- Metadata ---
    lastUpdatedAt: Date;
    createdAt: Date;
}

/**
 * Dữ liệu dùng để cập nhật một phần PlayerState.
 */
export type PlayerStateUpdate = Partial<Omit<PlayerState, 'userId' | 'createdAt'>>;
