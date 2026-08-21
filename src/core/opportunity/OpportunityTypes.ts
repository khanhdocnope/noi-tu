// ============================================================
// ECHO — Opportunity Types
// Định nghĩa các thực thể cho hệ thống Cơ hội hàng ngày.
// Spec ref: Section 5 (Daily Opportunity), 6 (Non-deterministic), 27 (Content != Engine)
//
// Cải thiện: Thêm xác suất thành công/thất bại, hidden rewards,
// risk/reward balance để tạo trải nghiệm đa dạng hơn.
// ============================================================

export type ConditionType = 'weather' | 'season' | 'level' | 'item' | 'relationship';

export interface OpportunityCondition {
    type: ConditionType;
    targetId?: string;
    operator: 'eq' | 'gte' | 'lte' | 'has';
    value?: any;
}

export interface RewardEffect {
    type: 'xp' | 'currency' | 'item' | 'relationship' | 'discovery';
    targetId?: string;
    amount?: number;
    itemName?: string;
    itemType?: 'resource' | 'key' | 'usable' | 'equipment';
}

/**
 * Curiosity trigger khi outcome xảy ra.
 */
export interface CuriosityTrigger {
    /** Loại trigger */
    type: 'discover_mystery' | 'collect_clue' | 'find_secret' | 'start_chain' | 'advance_chain' | 'see_locked_content';

    /** ID của mystery/secret/clue/chain/content */
    targetId: string;

    /** Xác suất trigger (0-1, mặc định 1 = 100%) */
    chance?: number;
}

/**
 * Một kết quả có thể xảy ra khi người chơi lựa chọn.
 * Mỗi lựa chọn có thể có nhiều OutcomeResult với xác suất khác nhau.
 *
 * Ví dụ:
 * - "Khám phá rừng" → 70% thành công (nhận reward lớn), 30% thất bại (nhận reward nhỏ hoặc mất máu)
 */
export interface OutcomeResult {
    /** Xác suất xảy ra kết quả này (0-100). Tổng tất cả outcomes phải bằng 100. */
    weight: number;

    /** Mô tả kết quả cho player */
    text: string;

    /** Phần thưởng nhận được */
    rewards: RewardEffect[];

    /** Cơ hội tiếp theo (nếu chain) */
    nextOpportunityId?: string;

    /** Thay đổi trạng thái player */
    stateChange?: string;

    /** Thẻ tag để phân loại kết quả (success/failure/partial/critical) */
    tag?: 'success' | 'failure' | 'partial' | 'critical';

    /** Curiosity triggers — xảy ra khi outcome này được chọn */
    curiosityTriggers?: CuriosityTrigger[];
}

/**
 * Kết quả sau khi người chơi đưa ra lựa chọn.
 * Hỗ trợ cả legacy single outcome và multi-outcome với xác suất.
 * Spec ref: Section 9 (Outcome), 12 (Maybe Tomorrow)
 */
export interface ChoiceOutcome {
    /** Kết quả có thể xảy ra. Nếu có >1, hệ thống sẽ random theo weight. */
    results?: OutcomeResult[];

    /**
     * LEGACY: Nếu chỉ có 1 kết quả duy nhất, có thể dùng shortcut này.
     * Kết quả này sẽ luôn xảy ra (weight = 100).
     */
    text?: string;
    rewards?: RewardEffect[];
    nextOpportunityId?: string;
    stateChange?: string;
}

/**
 * Lựa chọn của người chơi đối với cơ hội hiện tại.
 * Spec ref: Section 8 (Action phải có Context)
 */
export interface OpportunityChoice {
    id: string;
    text: string;

    /**
     * Có hiển thị kết quả trước khi chọn không?
     * - true: Hiển thị rewards trước (thông tin công khai)
     * - false: Ẩn rewards (hidden information — player không biết trước)
     */
    revealRewards?: boolean;

    outcome: ChoiceOutcome;
}

/**
 * Cơ hội (Opportunity) xuất hiện ngẫu nhiên dựa trên các quy luật.
 */
export interface Opportunity {
    id: string;
    title: string;
    description: string;

    /**
     * Mức độ rủi ro tổng thể của cơ hội này.
     * Ảnh hưởng đến UI display và có thể dùng cho filtering.
     */
    riskLevel?: 'safe' | 'moderate' | 'risky' | 'dangerous';

    conditions: OpportunityCondition[];
    choices: OpportunityChoice[];
}

/**
 * Kết quả cuối cùng sau khi đã resolve xác suất.
 * Dùng cho UI rendering.
 */
export interface ResolvedOutcome {
    text: string;
    rewards: RewardEffect[];
    nextOpportunityId?: string;
    stateChange?: string;
    tag: 'success' | 'failure' | 'partial' | 'critical';
    curiosityTriggers?: CuriosityTrigger[];
}
