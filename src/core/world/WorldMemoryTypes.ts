// ============================================================
// ECHO — World Memory Types
// Hệ thống ghi nhớ và tạo hệ quả từ hành động của người chơi.
// Spec ref: Section 4 (World Observation), 14 (Server World),
//           Core Loop (World Memory - deeper consequences)
//
// Thiết kế cho Discord bot game:
// - Hành động của player ảnh hưởng world chung
// - Hệ quả hiển thị rõ ràng trong Discord
// - Cân bằng giữa个人贡献 và community impact
// ============================================================

// --- Enums ---

/**
 * Loại hành động của người chơi ảnh hưởng thế giới.
 */
export enum WorldActionType {
    // Hành động tích cực
    ResourceContributed   = 'resource_contributed',
    DiscoveryShared       = 'discovery_shared',
    EventCompleted        = 'event_completed',
    NPCRelationshipUp     = 'npc_relationship_up',
    WorldBossDefeated     = 'world_boss_defeated',
    FestivalOrganized     = 'festival_organized',
    
    // Hành động tiêu cực
    ResourceDepleted      = 'resource_depleted',
    NPCRelationshipDown   = 'npc_relationship_down',
    RegionDamaged         = 'region_damaged',
    CurseInflicted        = 'curse_inflicted',
    
    // Hành động trung tính
    WeatherInfluenced     = 'weather_influenced',
    MarketShift           = 'market_shift',
    SecretRevealed        = 'secret_revealed',
}

/**
 * Mức độ ảnh hưởng của hành động.
 */
export enum ImpactLevel {
    Minor     = 'minor',       // Nhẹ, barely noticeable
    Moderate  = 'moderate',    // Trung bình, noticeable
    Major     = 'major',       // Lớn, significant change
    Critical  = 'critical',    // Quan trọng, world-changing
}

/**
 * Trạng thái của World Memory entry.
 */
export enum MemoryStatus {
    Active     = 'active',     // Đang ảnh hưởng world
    Expired    = 'expired',    // Đã hết hiệu lực
    Countered  = 'countered',  // Đã bị đối trọng bởi hành động khác
    Integrated = 'integrated', // Đã trở thành một phần của world lore
}

// --- Sub-types ---

/**
 * Một sự kiện ghi nhớ trong thế giới.
 * Mỗi lần player thực hiện hành động quan trọng, một WorldMemory được tạo.
 */
export interface WorldMemory {
    /** ID duy nhất */
    id: string;
    
    /** Loại hành động */
    actionType: WorldActionType;
    
    /** Người thực hiện */
    playerId: string;
    
    /** Mức độ ảnh hưởng */
    impactLevel: ImpactLevel;
    
    /** Mô tả hành động (hiển thị cho tất cả player) */
    description: string;
    
    /** ID guild */
    guildId: string;
    
    /** Các thay đổi đối với world state */
    worldChanges: WorldChange[];
    
    /** Các hệ quả đối với player khác */
    playerConsequences: PlayerConsequence[];
    
    /** Các cơ hội mới được mở khóa */
    unlockedOpportunities: string[];
    
    /** Các cơ hội bị khóa */
    lockedOpportunities: string[];
    
    /** Thời điểm xảy ra */
    occurredAt: Date;
    
    /** Thời điểm hết hiệu lực (null = vĩnh viễn) */
    expiresAt: Date | null;
    
    /** Trạng thái hiện tại */
    status: MemoryStatus;
    
    /** Số lần được tham chiếu (cho UI display) */
    referencedCount: number;
}

/**
 * Thay đổi đối với world state.
 */
export interface WorldChange {
    /** Field nào trong ServerWorldState bị ảnh hưởng */
    field: string;
    
    /** Giá trị cũ */
    oldValue: any;
    
    /** Giá trị mới */
    newValue: any;
    
    /** Mô tả thay đổi */
    description: string;
    
    /** Có thể đảo ngược không */
    reversible: boolean;
}

/**
 * Hệ quả đối với player khác.
 */
export interface PlayerConsequence {
    /** Loại hệ quả */
    type: 'bonus' | 'penalty' | 'opportunity' | 'restriction';
    
    /** Mô tả */
    description: string;
    
    /** Đối tượng bị ảnh hưởng (null = tất cả player) */
    targetPlayerId: string | null;
    
    /** Giá trị (XP, gold, item, etc.) */
    value?: any;
    
    /** Thời điểm hết hiệu lực */
    expiresAt?: Date;
}

/**
 * Thống kê world memory cho UI display.
 */
export interface WorldMemoryStats {
    /** Tổng số memory */
    totalMemories: number;
    
    /** Số memory đang active */
    activeMemories: number;
    
    /** Ảnh hưởng tích cực vs tiêu cực */
    positiveImpact: number;
    negativeImpact: number;
    
    /** Top contributors */
    topContributors: { playerId: string; count: number }[];
    
    /** Các thay đổi world hiện tại */
    currentWorldChanges: WorldChange[];
}

// --- Core World State Extension ---

/**
 * Mở rộng ServerWorldState với World Memory.
 */
export interface WorldMemoryState {
    /** Danh sách memories đang active */
    activeMemories: WorldMemory[];
    
    /** Lịch sử memories (đã expired/integrated) */
    memoryHistory: WorldMemory[];
    
    /** Thống kê tổng quan */
    stats: WorldMemoryStats;
    
    /** Các thay đổi world đang chờ áp dụng */
    pendingChanges: WorldChange[];
    
    /** Timestamp của lần update memory cuối */
    lastMemoryUpdate: Date;
}

/**
 * Dữ liệu dùng để cập nhật World Memory.
 */
export type WorldMemoryUpdate = Partial<WorldMemoryState>;

// --- Event Types ---

/**
 * Event data khi tạo memory mới.
 */
export interface WorldMemoryCreatedEvent {
    guildId: string;
    memory: WorldMemory;
    affectedPlayers: string[];
}

/**
 * Event data khi memory hết hiệu lực.
 */
export interface WorldMemoryExpiredEvent {
    guildId: string;
    memoryId: string;
    reason: 'time' | 'countered' | 'integrated';
}

/**
 * Event data khi world thay đổi do memory.
 */
export interface WorldChangedByMemoryEvent {
    guildId: string;
    memoryId: string;
    changes: WorldChange[];
    newWorldState: any; // ServerWorldState
}

// --- Constants ---

/** Thời gian mặc định memory tồn tại (7 ngày) */
export const DEFAULT_MEMORY_DURATION_DAYS = 7;

/** Số memory tối đa active cùng lúc */
export const MAX_ACTIVE_MEMORIES = 20;

/** Threshold để memory tự động integrated (số lần reference) */
export const INTEGRATION_THRESHOLD = 5;
