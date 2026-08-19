// ============================================================
// ECHO — Player State Types
// Định nghĩa cấu trúc dữ liệu cho trạng thái của người chơi.
// Spec ref: Section 10 (Personal Progression), 13 (Streak), 16 (Memory)
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
    protectionActive: boolean;// Đang kích hoạt bảo vệ streak hay không (Spec ref: Section 13)
}

export interface ActivePlayerOpportunity {
    opportunityId: string;
    rolledAt: Date;
    completed: boolean;
    history: string[]; // Lưu lại chuỗi các lựa chọn đã thực hiện
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
    currency: number; // Thường là Gold hoặc đơn vị tiền tệ chính
    streak: PlayerStreak;
    currentState: string; // Trạng thái hiện tại của người chơi (ví dụ: 'idle', 'exploring')
    
    // --- Persistent State ---
    inventory: PlayerItem[];
    relationships: PlayerRelationship[];
    discoveries: PlayerDiscovery[];
    activeOpportunity?: ActivePlayerOpportunity | null; // Cơ hội hiện tại đang làm
    
    // --- Metadata ---
    lastUpdatedAt: Date;
    createdAt: Date;
}

/**
 * Dữ liệu dùng để cập nhật một phần PlayerState.
 */
export type PlayerStateUpdate = Partial<Omit<PlayerState, 'userId' | 'createdAt'>>;
