// ============================================================
// ECHO — Opportunity Types
// Định nghĩa các thực thể cho hệ thống Cơ hội hàng ngày.
// Spec ref: Section 5 (Daily Opportunity), 6 (Non-deterministic), 27 (Content != Engine)
// ============================================================

export type ConditionType = 'weather' | 'season' | 'level' | 'item' | 'relationship';

export interface OpportunityCondition {
    type: ConditionType;
    targetId?: string; // Ví dụ: itemId nếu là 'item', npcId nếu là 'relationship'
    operator: 'eq' | 'gte' | 'lte' | 'has';
    value: any; // Giá trị để so sánh (ví dụ: 'fog', 5, 'strange_key')
}

export interface RewardEffect {
    type: 'xp' | 'currency' | 'item' | 'relationship' | 'discovery';
    targetId?: string;       // NPC id hoặc Item id hoặc Discovery id
    amount?: number;         // Lượng XP/Gold/thân thiết cộng thêm
    itemName?: string;       // Cho vật phẩm mới
    itemType?: 'resource' | 'key' | 'usable' | 'equipment';
}

/**
 * Kết quả sau khi người chơi đưa ra lựa chọn.
 * Có thể dẫn tới phần thưởng, thay đổi World State hoặc kích hoạt Cơ hội con tiếp theo.
 * Spec ref: Section 9 (Outcome), 12 (Maybe Tomorrow)
 */
export interface ChoiceOutcome {
    text: string;                  // Nội dung mô tả kết quả trả về cho Player
    rewards: RewardEffect[];       // Phần thưởng nhận được
    nextOpportunityId?: string;    // Dẫn tới cơ hội tiếp theo (chuỗi nhiệm vụ)
    stateChange?: string;          // Thay đổi currentState của người chơi
}

/**
 * Lựa chọn của người chơi đối với cơ hội hiện tại.
 * Spec ref: Section 8 (Action phải có Context)
 */
export interface OpportunityChoice {
    id: string;
    text: string;
    outcome: ChoiceOutcome;
}

/**
 * Cơ hội (Opportunity) xuất hiện ngẫu nhiên dựa trên các quy luật.
 */
export interface Opportunity {
    id: string;
    title: string;
    description: string;
    conditions: OpportunityCondition[]; // Các điều kiện cần có để cơ hội này xuất hiện
    choices: OpportunityChoice[];
}
