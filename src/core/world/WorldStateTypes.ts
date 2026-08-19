// ============================================================
// ECHO — World State Types
// Định nghĩa tất cả kiểu dữ liệu cho trạng thái thế giới.
// Spec ref: Section 4 (World Observation), 14 (Server World)
// ============================================================

// --- Enums ---

export enum Weather {
    Clear      = 'clear',
    Rain       = 'rain',
    Storm      = 'storm',
    Fog        = 'fog',
    Snow       = 'snow',
    Eclipse    = 'eclipse',
    Heatwave   = 'heatwave',
}

export enum Season {
    Spring = 'spring',
    Summer = 'summer',
    Autumn = 'autumn',
    Winter = 'winter',
}

export enum RegionStatus {
    Locked     = 'locked',
    Active     = 'active',
    Anomaly    = 'anomaly',
    Closed     = 'closed',
}

export enum GlobalEventStatus {
    Upcoming   = 'upcoming',
    Active     = 'active',
    Completed  = 'completed',
    Failed     = 'failed',
}

// --- Sub-types ---

/**
 * Một khu vực/vùng trong thế giới của server.
 * Spec ref: Section 4 (Active Anomaly: Forest)
 */
export interface Region {
    id: string;
    name: string;
    status: RegionStatus;
    unlockedAt?: Date;  // Null nếu vẫn còn bị khoá
}

/**
 * Sự kiện toàn cầu — có progress bar, nhiều user cùng đóng góp.
 * Spec ref: Section 15 (Global Event - "The Moon is Falling")
 */
export interface GlobalEvent {
    id: string;
    name: string;
    description: string;
    status: GlobalEventStatus;
    currentProgress: number;
    requiredProgress: number;
    startsAt: Date;
    endsAt: Date;
}

/**
 * Trạng thái của thị trường / kinh tế trong world.
 * Spec ref: Section 4 (Market: Crystal ↑)
 */
export interface MarketTrend {
    itemId: string;
    trend: 'rising' | 'falling' | 'stable';
    changePercent: number;
}

// --- Core World State ---

/**
 * Trạng thái thế giới của một Discord Server.
 * Đây là "Hot State" — được cache trong RAM, nguồn gốc từ DB.
 * Spec ref: Section 14 (Server World), 16 (Hot State / Persistent State)
 */
export interface ServerWorldState {
    // Định danh
    guildId: string;

    // Trạng thái môi trường — thay đổi mỗi ngày
    weather: Weather;
    season: Season;
    dayNumber: number;      // Ngày thứ N kể từ khi world được tạo

    // Khu vực
    regions: Region[];

    // Sự kiện toàn cầu (nếu có đang chạy)
    activeGlobalEvent: GlobalEvent | null;

    // Xu hướng thị trường
    marketTrends: MarketTrend[];

    // Thống kê server
    worldLevel: number;
    sharedResourcePool: number;     // Tài nguyên tích lũy chung

    // Metadata
    lastUpdatedAt: Date;
    createdAt: Date;
}

/**
 * Dữ liệu dùng để cập nhật một phần WorldState.
 */
export type WorldStateUpdate = Partial<Omit<ServerWorldState, 'guildId' | 'createdAt'>>;
