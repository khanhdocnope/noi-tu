// ============================================================
// ECHO — Curiosity Hooks Types
// Hệ thống tạo câu hỏi chưa trả lời, thứ chưa tiếp cận, khả năng chưa khám phá.
// Spec ref: doc/Curiosity Hooks.md
//
// Các nguyên tắc thiết kế:
// - Signal, Don't Explain: Đưa tín hiệu, không giải thích
// - Mystery Must Lead Somewhere: Mystery phải tạo gameplay
// - No Fake Curiosity: Không clickbait
// - Delayed Payoff: Mystery có thể kéo dài nhiều ngày
// - Persistent Curiosity: World nhớ những gì player đã làm
// - Curiosity Through Choice: Mỗi lựa chọn mở mystery khác nhau
// - Curiosity Through Failure: Thất bại có thể tạo clue mới
// - Community Curiosity: Mystery có thể là server-wide
// ============================================================

// ============================================================
// 1. MYSTERIES — Những thứ chưa hiểu hoàn toàn
// ============================================================

/**
 * Loại mystery trong thế giới.
 * Spec ref: Section 1 (Mysteries)
 */
export enum MysteryType {
    /** Item không rõ công dụng */
    StrangeItem = 'strange_item',
    
    /** NPC hành vi bất thường */
    UnusualNPC = 'unusual_npc',
    
    /** Địa điểm không xuất hiện trên bản đồ */
    HiddenLocation = 'hidden_location',
    
    /** Sự kiện không có lời giải thích */
    UnexplainedEvent = 'unexplained_event',
    
    /** Symbol xuất hiện ở nhiều nơi */
    RepeatedSymbol = 'repeated_symbol',
    
    /** Đoạn hội thoại bị bỏ dở */
    UnfinishedDialogue = 'unfinished_dialogue',
}

/**
 * Quy mô của mystery.
 * Spec ref: Section 11 (Curiosity Layers)
 */
export enum MysteryScale {
    /** "Cái item này là gì?" */
    Micro = 'micro',
    
    /** "NPC này đang giấu điều gì?" */
    ShortTerm = 'short_term',
    
    /** "Làm sao mở khu vực này?" */
    MediumTerm = 'medium_term',
    
    /** "Chuyện gì thực sự xảy ra với thế giới?" */
    LongTerm = 'long_term',
    
    /** "Server sẽ thay đổi thế nào nếu mystery được giải?" */
    Community = 'community',
}

/**
 * Trạng thái của mystery.
 */
export enum MysteryStatus {
    /** Chưa phát hiện */
    Unknown = 'unknown',
    
    /** Đã phát hiện nhưng chưa có clue */
    Discovered = 'discovered',
    
    /** Đang thu thập clues */
    Investigating = 'investigating',
    
    /** Đủ clue để giải */
    ReadyToSolve = 'ready_to_solve',
    
    /** Đã giải */
    Solved = 'solved',
    
    /** Không bao giờ được giải (intentionally mysterious) */
    Eternal = 'eternal',
}

/**
 * Một bí ẩn trong thế giới.
 * Mystery không cần được giải thích ngay.
 * "Cho user biết có một câu hỏi, nhưng chưa cho họ biết câu trả lời."
 */
export interface Mystery {
    /** ID duy nhất */
    id: string;
    
    /** Loại mystery */
    type: MysteryType;
    
    /** Quy mô */
    scale: MysteryScale;
    
    /** Tên hiển thị */
    name: string;
    
    /** Mô tả tín hiệu (signal, don't explain) */
    signal: string;
    
    /** Manh mối ban đầu (hint) */
    initialHint: string;
    
    /** Các clue cần thiết để giải */
    requiredClues: string[];
    
    /** Phần thưởng khi giải (có thể là discovery, item, unlock) */
    solvingReward: MysteryReward;
    
    /** Mystery liên quan (tạo clue chain) */
    relatedMysteries: string[];
    
    /** Có thể giải được không (false = eternal mystery) */
    solvable: boolean;
    
    /** Điều kiện để mystery xuất hiện */
    appearConditions: MysteryCondition[];
    
    /** Metadata */
    createdAt: Date;
}

/**
 * Phần thưởng khi giải mystery.
 */
export interface MysteryReward {
    type: 'discovery' | 'item' | 'unlock' | 'relationship' | 'xp' | 'lore';
    targetId: string;
    amount?: number;
    description: string;
}

/**
 * Điều kiện để mystery xuất hiện.
 */
export type MysteryCondition = 
    | { type: 'weather' | 'season' | 'level' | 'item' | 'discovery' | 'clue' | 'relationship'; targetId: string; operator: 'eq' | 'gte' | 'lte' | 'has'; value?: any }
    | { type: 'random'; probability: number };

// ============================================================
// 2. SECRETS — Content ẩn không hiển thị trực tiếp
// ============================================================

/**
 * Loại secret.
 * Spec ref: Section 2 (Secrets)
 */
export enum SecretType {
    /** NPC ẩn */
    SecretNPC = 'secret_npc',
    
    /** Địa điểm ẩn */
    SecretLocation = 'secret_location',
    
    /** Nhiệm vụ ẩn */
    SecretQuest = 'secret_quest',
    
    /** Item ẩn */
    SecretItem = 'secret_item',
    
    /** Sự kiện ẩn */
    SecretEvent = 'secret_event',
    
    /** Kết quả ẩn trong choice */
    SecretOutcome = 'secret_outcome',
}

/**
 * Cách thức phát hiện secret.
 * Spec ref: Section 2 (Secrets - How to discover)
 */
export enum DiscoveryMethod {
    /** Từ clue */
    Clue = 'clue',
    
    /** Từ khám phá */
    Exploration = 'exploration',
    
    /** Từ NPC */
    NPC = 'npc',
    
    /** Từ lựa chọn trước */
    PreviousChoice = 'previous_choice',
    
    /** Từ encounter hiếm */
    RareEncounter = 'rare_encounter',
    
    /** Từ discovery cộng đồng */
    CommunityDiscovery = 'community_discovery',
}

/**
 * Một secret trong thế giới.
 * Secret không hiển thị trực tiếp trong UI thông thường.
 */
export interface Secret {
    /** ID duy nhất */
    id: string;
    
    /** Loại secret */
    type: SecretType;
    
    /** Tên (ẩn, chỉ hiện khi tìm thấy) */
    name: string;
    
    /** Mô tả (ẩn) */
    description: string;
    
    /** Cách thức phát hiện */
    discoveryMethod: DiscoveryMethod;
    
    /** Điều kiện để có thể phát hiện */
    conditions: SecretCondition[];
    
    /** Rarity (0-1, càng thấp càng hiếm) */
    rarity: number;
    
    /** Phần thưởng khi tìm thấy */
    reward: SecretReward;
    
    /** Secret liên quan (tạo chain) */
    relatedSecrets: string[];
    
    /** Có thể chia sẻ với người khác không */
    shareable: boolean;
    
    /** Có phải community secret không (nhiều người cùng tìm) */
    isCommunity: boolean;
    
    /** Số người cần tìm để unlock (nếu là community) */
    communityRequired?: number;
    
    /** Số người đã tìm */
    communityFound?: number;
}

/**
 * Điều kiện để secret có thể xuất hiện.
 */
export interface SecretCondition {
    type: 'weather' | 'season' | 'level' | 'item' | 'discovery' | 'clue' | 'relationship' | 'time' | 'random';
    targetId?: string;
    operator?: 'eq' | 'gte' | 'lte' | 'has';
    value?: any;
    probability?: number; // Xác suất xuất hiện (0-1)
}

/**
 * Phần thưởng khi tìm thấy secret.
 */
export interface SecretReward {
    type: 'discovery' | 'item' | 'unlock' | 'relationship' | 'xp' | 'currency' | 'lore' | 'opportunity' | 'clue';
    targetId: string;
    amount?: number;
    description: string;
}

// ============================================================
// 3. LOCKED CONTENT — Nội dung bị khóa
// ============================================================

/**
 * Loại nội dung bị khóa.
 * Spec ref: Section 3 (Locked Content)
 */
export enum LockedContentType {
    Region = 'region',
    Item = 'item',
    Quest = 'quest',
    NPC = 'npc',
    Event = 'event',
}

/**
 * Loại yêu cầu mở khóa.
 */
export enum RequirementType {
    /** Cần item cụ thể */
    Item = 'item',
    
    /** Cần đã khám phá discovery */
    Discovery = 'discovery',
    
    /** Cần relationship với NPC */
    Relationship = 'relationship',
    
    /** Cần level tối thiểu */
    Level = 'level',
    
    /** Cần đã thu thập clue */
    Clue = 'clue',
    
    /** Cần hoàn thành mystery */
    MysterySolved = 'mystery_solved',
    
    /** Cần tìm secret */
    SecretFound = 'secret_found',
}

/**
 * Yêu cầu để mở khóa content.
 */
export interface UnlockRequirement {
    type: RequirementType;
    targetId: string;
    amount?: number;
    description: string; // Mô tả yêu cầu (có thể ẩn)
}

/**
 * Nội dung bị khóa.
 * "Mình muốn biết phía sau đó có gì."
 */
export interface LockedContent {
    /** ID duy nhất */
    id: string;
    
    /** Loại nội dung */
    type: LockedContentType;
    
    /** Tên hiển thị */
    name: string;
    
    /** Mô tả (có thể ẩn) */
    description: string;
    
    /** Yêu cầu mở khóa */
    requirements: UnlockRequirement[];
    
    /** Manh mối để mở khóa (hints) */
    hints: string[];
    
    /** Player đã mở khóa */
    unlockedBy: string[];
    
    /** Player đã thấy (biết là tồn tại) */
    seenBy: string[];
    
    /** Có hiển thị trên bản đồ không */
    visibleOnMap: boolean;
    
    /** Vị trí trên bản đồ (nếu có) */
    mapPosition?: { x: number; y: number };
    
    /** Region cha (nếu là sub-region) */
    parentId?: string;
}

// ============================================================
// 4. CLUES — Manh mối
// ============================================================

/**
 * Nguồn gốc của clue.
 */
export enum ClueSource {
    /** Từ NPC */
    NPC = 'npc',
    
    /** Từ item */
    Item = 'item',
    
    /** Từ location */
    Location = 'location',
    
    /** Từ sự kiện */
    Event = 'event',
    
    /** Từ lựa chọn */
    Choice = 'choice',
    
    /** Từ discovery */
    Discovery = 'discovery',
    
    /** Từ world state */
    WorldState = 'world_state',
}

/**
 * Một manh mối trong thế giới.
 * Spec ref: Section 4 (Clue Chain)
 */
export interface Clue {
    /** ID duy nhất */
    id: string;
    
    /** Mystery mà clue này liên quan */
    mysteryId: string;
    
    /** Mô tả manh mối */
    description: string;
    
    /** Nguồn gốc */
    source: ClueSource;
    
    /** ID của nguồn (npcId, itemId, locationId, etc.) */
    sourceId: string;
    
    /** Các clue cần thiết trước khi thấy clue này */
    requiredClues: string[];
    
    /** Điều kiện để thấy clue */
    appearConditions: MysteryCondition[];
    
    /** Có hiển thị trong UI không */
    visible: boolean;
    
    /** Thứ tự trong mystery (để sắp xếp) */
    order: number;
    
    /** Có phải clue cuối không (unlock mystery) */
    isFinalClue: boolean;
}

// ============================================================
// 5. DISCOVERY CHAINS — Chuỗi khám phá
// ============================================================

/**
 * Loại bước trong discovery chain.
 */
export enum ChainStepType {
    /** Thu thập clue */
    Clue = 'clue',
    
    /** Khám phá discovery */
    Discovery = 'discovery',
    
    /** Mở khóa content */
    Unlock = 'unlock',
    
    /** Giải mystery */
    Mystery = 'mystery',
    
    /** Tìm secret */
    Secret = 'secret',
}

/**
 * Một bước trong discovery chain.
 */
export interface DiscoveryChainStep {
    /** ID duy nhất */
    id: string;
    
    /** Loại bước */
    type: ChainStepType;
    
    /** ID của target (clueId, discoveryId, etc.) */
    targetId: string;
    
    /** Mô tả bước */
    description: string;
    
    /** Đã hoàn thành chưa */
    completed: boolean;
    
    /** Thời điểm hoàn thành */
    completedAt?: Date;
}

/**
 * Chuỗi khám phá nhiều bước.
 * Spec ref: Section 4 (Clue Chain), Section 5 (Delayed Payoff)
 */
export interface DiscoveryChain {
    /** ID duy nhất */
    id: string;
    
    /** Tên chuỗi */
    name: string;
    
    /** Mô tả */
    description: string;
    
    /** Các bước */
    steps: DiscoveryChainStep[];
    
    /** Bước hiện tại */
    currentStepIndex: number;
    
    /** Player thực hiện */
    playerId: string;
    
    /** Thời điểm bắt đầu */
    startedAt: Date;
    
    /** Thời điểm hoàn thành */
    completedAt?: Date;
    
    /** Phần thưởng hoàn thành */
    completionReward: MysteryReward;
    
    /** Có thể hủy không */
    cancellable: boolean;
}

// ============================================================
// 6. PLAYER CURIOSITY STATE — Trạng thái tò mò của player
// ============================================================

/**
 * Mystery đã phát hiện.
 */
export interface DiscoveredMystery {
    /** ID mystery */
    mysteryId: string;
    
    /** Thời điểm phát hiện */
    discoveredAt: Date;
    
    /** Số clue đã tìm */
    cluesFound: number;
    
    /** Tổng số clue cần */
    totalClues: number;
    
    /** Đã giải chưa */
    solved: boolean;
    
    /** Thời điểm giải */
    solvedAt?: Date;
}

/**
 * Secret đã tìm thấy.
 */
export interface FoundSecret {
    /** ID secret */
    secretId: string;
    
    /** Thời điểm tìm thấy */
    foundAt: Date;
    
    /** Đã chia sẻ với ai */
    sharedWith: string[];
    
    /** Có phải community discovery không */
    isCommunityDiscovery: boolean;
}

/**
 * Clue đã thu thập.
 */
export interface CollectedClue {
    /** ID clue */
    clueId: string;
    
    /** Thời điểm thu thập */
    collectedAt: Date;
    
    /** Từ đâu có được */
    source: string;
    
    /** Mystery liên quan */
    mysteryId: string;
}

/**
 * Curiosity rank dựa trên điểm tò mò.
 */
export enum CuriosityRank {
    /** Chưa quan tâm */
    Indifferent = 'indifferent',
    
    /** tò mò nhẹ */
    Curious = 'curious',
    
    /** Hay tò mò */
    Inquisitive = 'inquisitive',
    
    /** Nhà thám hiểm */
    Explorer = 'explorer',
    
    /** Thợ săn bí mật */
    SecretHunter = 'secret_hunter',
    
    /** Giải mã viên */
    Codebreaker = 'codebreaker',
    
    /** Bậc thầy tò mò */
    CuriosityMaster = 'curiosity_master',
}

/**
 * Trạng thái tò mò của player.
 * Spec ref: Section 11 (Curiosity Layers), Section 15 (The Curiosity Chain)
 */
export interface PlayerCuriosityState {
    /** Player ID */
    playerId: string;
    
    /** Mysteries đã phát hiện */
    discoveredMysteries: DiscoveredMystery[];
    
    /** Secrets đã tìm thấy */
    foundSecrets: FoundSecret[];
    
    /** Clues đã thu thập */
    collectedClues: CollectedClue[];
    
    /** Discovery chains đang thực hiện */
    activeChains: DiscoveryChain[];
    
    /** Locked content đã thấy (biết là tồn tại) */
    seenLockedContent: string[];
    
    /** Curiosity score (đo lường tò mò) */
    curiosityScore: number;
    
    /** Curiosity rank */
    curiosityRank: CuriosityRank;
    
    /** Số mysteries đã solve */
    mysteriesSolved: number;
    
    /** Số secrets đã find */
    secretsFound: number;
    
    /** Số clues đã collect */
    cluesCollected: number;
    
    /** Số chains đã complete */
    chainsCompleted: number;
    
    /** Last curiosity action */
    lastCuriosityAction: Date;
}

// ============================================================
// 7. COMMUNITY CURIOSITY — Tò mò cộng đồng
// ============================================================

/**
 * Mystery của cả server.
 * Spec ref: Section 10 (Community Curiosity)
 */
export interface CommunityMystery {
    /** ID mystery */
    mysteryId: string;
    
    /** Số người cần tham gia */
    requiredParticipants: number;
    
    /** Số người đã tham gia */
    currentParticipants: number;
    
    /** Các clue đã được tìm bởi cộng đồng */
    communityClues: CommunityClue[];
    
    /** Đã giải chưa */
    solved: boolean;
    
    /** Thời điểm giải */
    solvedAt?: Date;
}

/**
 * Clue được tìm bởi cộng đồng.
 */
export interface CommunityClue {
    /** ID clue */
    clueId: string;
    
    /** Người tìm thấy */
    foundBy: string;
    
    /** Thời điểm tìm thấy */
    foundAt: Date;
    
    /** Đã chia sẻ chưa */
    shared: boolean;
}

// ============================================================
// 8. CURIOSITY EVENTS — Sự kiện tò mò
// ============================================================

/**
 * Loại sự kiện curiosity.
 */
export enum CuriosityEventType {
    /** Phát hiện mystery */
    MysteryDiscovered = 'mystery_discovered',
    
    /** Thu thập clue */
    ClueCollected = 'clue_collected',
    
    /** Giải mystery */
    MysterySolved = 'mystery_solved',
    
    /** Tìm thấy secret */
    SecretFound = 'secret_found',
    
    /** Chia sẻ secret */
    SecretShared = 'secret_shared',
    
    /** Bắt đầu chain */
    ChainStarted = 'chain_started',
    
    /** Hoàn thành chain */
    ChainCompleted = 'chain_completed',
    
    /** Thấy locked content */
    LockedContentSeen = 'locked_content_seen',
    
    /** Mở khóa content */
    ContentUnlocked = 'content_unlocked',
    
    /** Curiosity score tăng */
    ScoreIncreased = 'score_increased',
}

/**
 * Dữ liệu sự kiện curiosity.
 */
export interface CuriosityEvent {
    /** Loại sự kiện */
    type: CuriosityEventType;
    
    /** Player thực hiện */
    playerId: string;
    
    /** Guild ID */
    guildId: string;
    
    /** Dữ liệu sự kiện */
    data: Record<string, any>;
    
    /** Thời điểm */
    timestamp: Date;
}

// ============================================================
// 9. CURIOSITY CONSTANTS
// ============================================================

/** Curiosity score cho mỗi hành động */
export const CURIOSITY_SCORES = {
    MYSTERY_DISCOVERED: 10,
    CLUE_COLLECTED: 5,
    MYSTERY_SOLVED: 50,
    SECRET_FOUND: 25,
    SECRET_SHARED: 10,
    CHAIN_COMPLETED: 100,
    LOCKED_CONTENT_SEEN: 3,
    CONTENT_UNLOCKED: 30,
} as const;

/** Curiosity rank thresholds */
export const RANK_THRESHOLDS = {
    [CuriosityRank.Indifferent]: 0,
    [CuriosityRank.Curious]: 50,
    [CuriosityRank.Inquisitive]: 150,
    [CuriosityRank.Explorer]: 350,
    [CuriosityRank.SecretHunter]: 700,
    [CuriosityRank.Codebreaker]: 1200,
    [CuriosityRank.CuriosityMaster]: 2000,
} as const;

/** Số lượng clues tối đa hiển thị */
export const MAX_VISIBLE_CLUES = 10;

/** Số lượng mysteries tối đa active */
export const MAX_ACTIVE_MYSTERIES = 20;

/** Số lượng chains tối đa active */
export const MAX_ACTIVE_CHAINS = 5;
