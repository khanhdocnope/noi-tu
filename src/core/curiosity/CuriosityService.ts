// ============================================================
// ECHO — Curiosity Service
// Quản lý hệ thống Curiosity Hooks: Mysteries, Secrets, Clues, Locked Content.
// Spec ref: doc/Curiosity Hooks.md
//
// Nguyên tắc:
// - Signal, Don't Explain
// - Mystery Must Lead Somewhere
// - No Fake Curiosity
// - Delayed Payoff
// - Persistent Curiosity
// ============================================================

import { EventEmitter } from 'events';
import {
    // Mystery types
    Mystery,
    MysteryType,
    MysteryScale,
    MysteryStatus,
    MysteryReward,
    MysteryCondition,
    DiscoveredMystery,
    
    // Secret types
    Secret,
    SecretType,
    DiscoveryMethod,
    SecretCondition,
    SecretReward,
    FoundSecret,
    
    // Clue types
    Clue,
    ClueSource,
    CollectedClue,
    
    // Locked Content types
    LockedContent,
    LockedContentType,
    UnlockRequirement,
    
    // Discovery Chain types
    DiscoveryChain,
    DiscoveryChainStep,
    ChainStepType,
    
    // Player Curiosity State
    PlayerCuriosityState,
    CuriosityRank,
    
    // Community types
    CommunityMystery,
    CommunityClue,
    
    // Events
    CuriosityEvent,
    CuriosityEventType,
    
    // Constants
    CURIOSITY_SCORES,
    RANK_THRESHOLDS,
    MAX_ACTIVE_MYSTERIES,
    MAX_ACTIVE_CHAINS,
} from './CuriosityHooksTypes';
import { PlayerService } from '../player/PlayerService';
import { WorldStateService } from '../world/WorldStateService';

// Events
export const CURIOSITY_EVENTS = {
    MYSTERY_DISCOVERED:    'curiosity:mystery_discovered',
    CLUE_COLLECTED:        'curiosity:clue_collected',
    MYSTERY_SOLVED:        'curiosity:mystery_solved',
    SECRET_FOUND:          'curiosity:secret_found',
    SECRET_SHARED:         'curiosity:secret_shared',
    CHAIN_STARTED:         'curiosity:chain_started',
    CHAIN_COMPLETED:       'curiosity:chain_completed',
    LOCKED_CONTENT_SEEN:   'curiosity:locked_content_seen',
    CONTENT_UNLOCKED:      'curiosity:content_unlocked',
    SCORE_INCREASED:       'curiosity:score_increased',
    RANK_UP:               'curiosity:rank_up',
} as const;

/**
 * Kết quả khi thực hiện hành động curiosity.
 */
export interface CuriosityResult {
    success: boolean;
    message: string;
    scoreGained: number;
    newRank?: CuriosityRank;
    unlockedContent?: string[];
}

export class CuriosityService {
    // In-memory cache: playerId → PlayerCuriosityState
    private cache: Map<string, PlayerCuriosityState> = new Map();
    
    // Mystery definitions (loaded from config)
    private mysteries: Map<string, Mystery> = new Map();
    
    // Secret definitions (loaded from config)
    private secrets: Map<string, Secret> = new Map();
    
    // Clue definitions (loaded from config)
    private clues: Map<string, Clue> = new Map();
    
    // Locked Content definitions (loaded from config)
    private lockedContent: Map<string, LockedContent> = new Map();
    
    // Discovery Chain definitions (loaded from config)
    private chainDefinitions: Map<string, Omit<DiscoveryChain, 'playerId' | 'currentStepIndex' | 'startedAt' | 'completedAt'>> = new Map();
    
    // Community mysteries
    private communityMysteries: Map<string, CommunityMystery> = new Map();
    
    public readonly events: EventEmitter = new EventEmitter();

    constructor(
        private readonly playerService: PlayerService,
        private readonly worldService: WorldStateService
    ) {}

    // --------------------------------------------------------
    // Initialization
    // --------------------------------------------------------

    /**
     * Load mystery definitions từ config.
     */
    loadMysteries(mysteries: Mystery[]): void {
        for (const mystery of mysteries) {
            this.mysteries.set(mystery.id, mystery);
        }
        console.log(`[ECHO Curiosity] Loaded ${mysteries.length} mysteries`);
    }

    /**
     * Load secret definitions từ config.
     */
    loadSecrets(secrets: Secret[]): void {
        for (const secret of secrets) {
            this.secrets.set(secret.id, secret);
        }
        console.log(`[ECHO Curiosity] Loaded ${secrets.length} secrets`);
    }

    /**
     * Load clue definitions từ config.
     */
    loadClues(clues: Clue[]): void {
        for (const clue of clues) {
            this.clues.set(clue.id, clue);
        }
        console.log(`[ECHO Curiosity] Loaded ${clues.length} clues`);
    }

    /**
     * Load locked content definitions từ config.
     */
    loadLockedContent(content: LockedContent[]): void {
        for (const item of content) {
            this.lockedContent.set(item.id, item);
        }
        console.log(`[ECHO Curiosity] Loaded ${content.length} locked content`);
    }

    /**
     * Load chain definitions từ config.
     */
    loadChainDefinitions(chains: Omit<DiscoveryChain, 'playerId' | 'currentStepIndex' | 'startedAt' | 'completedAt'>[]): void {
        for (const chain of chains) {
            this.chainDefinitions.set(chain.id, chain);
        }
        console.log(`[ECHO Curiosity] Loaded ${chains.length} chain definitions`);
    }

    // --------------------------------------------------------
    // Player State Management
    // --------------------------------------------------------

    /**
     * Lấy curiosity state của player.
     */
    async getPlayerState(playerId: string): Promise<PlayerCuriosityState> {
        const cached = this.cache.get(playerId);
        if (cached) return cached;

        // TODO: Load từ DB khi có repository
        const newState: PlayerCuriosityState = {
            playerId,
            discoveredMysteries: [],
            foundSecrets: [],
            collectedClues: [],
            activeChains: [],
            seenLockedContent: [],
            curiosityScore: 0,
            curiosityRank: CuriosityRank.Indifferent,
            mysteriesSolved: 0,
            secretsFound: 0,
            cluesCollected: 0,
            chainsCompleted: 0,
            lastCuriosityAction: new Date(),
        };

        this.cache.set(playerId, newState);
        return newState;
    }

    /**
     * Lưu curiosity state của player.
     */
    async savePlayerState(state: PlayerCuriosityState): Promise<void> {
        this.cache.set(state.playerId, state);
        // TODO: Save to DB khi có repository
    }

    // --------------------------------------------------------
    // Mystery Management
    // --------------------------------------------------------

    /**
     * Phát hiện mystery mới.
     * "Cho user biết có một câu hỏi, nhưng chưa cho họ biết câu trả lời."
     */
    async discoverMystery(playerId: string, mysteryId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const mystery = this.mysteries.get(mysteryId);

        if (!mystery) {
            return { success: false, message: 'Mystery not found', scoreGained: 0 };
        }

        // Kiểm tra đã phát hiện chưa
        const existing = state.discoveredMysteries.find(m => m.mysteryId === mysteryId);
        if (existing) {
            return { success: false, message: 'Mystery already discovered', scoreGained: 0 };
        }

        // Kiểm tra giới hạn
        if (state.discoveredMysteries.length >= MAX_ACTIVE_MYSTERIES) {
            return { success: false, message: 'Too many active mysteries', scoreGained: 0 };
        }

        // Thêm mystery
        const discovered: DiscoveredMystery = {
            mysteryId,
            discoveredAt: new Date(),
            cluesFound: 0,
            totalClues: mystery.requiredClues.length,
            solved: false,
        };

        state.discoveredMysteries.push(discovered);
        state.curiosityScore += CURIOSITY_SCORES.MYSTERY_DISCOVERED;
        state.lastCuriosityAction = new Date();

        // Cập nhật rank
        const newRank = this.calculateRank(state.curiosityScore);
        const rankUp = newRank !== state.curiosityRank;
        state.curiosityRank = newRank;

        await this.savePlayerState(state);

        // Emit events
        this.events.emit(CURIOSITY_EVENTS.MYSTERY_DISCOVERED, {
            playerId,
            mysteryId,
            mysteryName: mystery.name,
        });

        this.events.emit(CURIOSITY_EVENTS.SCORE_INCREASED, {
            playerId,
            amount: CURIOSITY_SCORES.MYSTERY_DISCOVERED,
            total: state.curiosityScore,
        });

        if (rankUp) {
            this.events.emit(CURIOSITY_EVENTS.RANK_UP, {
                playerId,
                newRank,
            });
        }

        return {
            success: true,
            message: `Phát hiện bí ẩn: ${mystery.name}`,
            scoreGained: CURIOSITY_SCORES.MYSTERY_DISCOVERED,
            newRank: rankUp ? newRank : undefined,
        };
    }

    /**
     * Thu thập clue cho mystery.
     */
    async collectClue(playerId: string, clueId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const clue = this.clues.get(clueId);

        if (!clue) {
            return { success: false, message: 'Clue not found', scoreGained: 0 };
        }

        // Kiểm tra đã thu thập chưa
        const existing = state.collectedClues.find(c => c.clueId === clueId);
        if (existing) {
            return { success: false, message: 'Clue already collected', scoreGained: 0 };
        }

        // Kiểm tra điều kiện (required clues)
        for (const requiredClueId of clue.requiredClues) {
            const hasRequired = state.collectedClues.some(c => c.clueId === requiredClueId);
            if (!hasRequired) {
                return { success: false, message: 'Missing required clues', scoreGained: 0 };
            }
        }

        // Thu thập clue
        const collected: CollectedClue = {
            clueId,
            collectedAt: new Date(),
            source: clue.source,
            mysteryId: clue.mysteryId,
        };

        state.collectedClues.push(collected);
        state.curiosityScore += CURIOSITY_SCORES.CLUE_COLLECTED;
        state.lastCuriosityAction = new Date();

        // Cập nhật mystery progress
        const mysteryProgress = state.discoveredMysteries.find(m => m.mysteryId === clue.mysteryId);
        if (mysteryProgress) {
            mysteryProgress.cluesFound++;
            
            // Kiểm tra xem đã đủ clue để solve chưa
            const mystery = this.mysteries.get(clue.mysteryId);
            if (mystery && mysteryProgress.cluesFound >= mystery.requiredClues.length) {
                mysteryProgress.solved = true;
                mysteryProgress.solvedAt = new Date();
                state.mysteriesSolved++;
                state.curiosityScore += CURIOSITY_SCORES.MYSTERY_SOLVED;

                this.events.emit(CURIOSITY_EVENTS.MYSTERY_SOLVED, {
                    playerId,
                    mysteryId: clue.mysteryId,
                    mysteryName: mystery.name,
                });
            }
        }

        // Cập nhật rank
        const newRank = this.calculateRank(state.curiosityScore);
        const rankUp = newRank !== state.curiosityRank;
        state.curiosityRank = newRank;

        await this.savePlayerState(state);

        // Emit events
        this.events.emit(CURIOSITY_EVENTS.CLUE_COLLECTED, {
            playerId,
            clueId,
            mysteryId: clue.mysteryId,
        });

        return {
            success: true,
            message: `Thu thập manh mối: ${clue.description}`,
            scoreGained: CURIOSITY_SCORES.CLUE_COLLECTED,
            newRank: rankUp ? newRank : undefined,
        };
    }

    /**
     * Giải mystery (khi đã đủ clue).
     */
    async solveMystery(playerId: string, mysteryId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const mystery = this.mysteries.get(mysteryId);

        if (!mystery) {
            return { success: false, message: 'Mystery not found', scoreGained: 0 };
        }

        // Kiểm tra đã phát hiện chưa
        const discovered = state.discoveredMysteries.find(m => m.mysteryId === mysteryId);
        if (!discovered) {
            return { success: false, message: 'Mystery not discovered', scoreGained: 0 };
        }

        // Kiểm tra đã solve chưa
        if (discovered.solved) {
            return { success: false, message: 'Mystery already solved', scoreGained: 0 };
        }

        // Kiểm tra đủ clue
        if (discovered.cluesFound < mystery.requiredClues.length) {
            return { success: false, message: 'Not enough clues', scoreGained: 0 };
        }

        // Giải mystery
        discovered.solved = true;
        discovered.solvedAt = new Date();
        state.mysteriesSolved++;
        state.curiosityScore += CURIOSITY_SCORES.MYSTERY_SOLVED;

        // Áp dụng phần thưởng
        await this.applyMysteryReward(playerId, mystery.solvingReward);

        await this.savePlayerState(state);

        // Emit events
        this.events.emit(CURIOSITY_EVENTS.MYSTERY_SOLVED, {
            playerId,
            mysteryId,
            mysteryName: mystery.name,
            reward: mystery.solvingReward,
        });

        return {
            success: true,
            message: `Giải bí ẩn: ${mystery.name}`,
            scoreGained: CURIOSITY_SCORES.MYSTERY_SOLVED,
            unlockedContent: [mystery.solvingReward.targetId],
        };
    }

    /**
     * Lấy mysteries đang investigate.
     */
    async getActiveMysteries(playerId: string): Promise<DiscoveredMystery[]> {
        const state = await this.getPlayerState(playerId);
        return state.discoveredMysteries.filter(m => !m.solved);
    }

    /**
     * Lấy mysteries đã solve.
     */
    async getSolvedMysteries(playerId: string): Promise<DiscoveredMystery[]> {
        const state = await this.getPlayerState(playerId);
        return state.discoveredMysteries.filter(m => m.solved);
    }

    // --------------------------------------------------------
    // Secret Management
    // --------------------------------------------------------

    /**
     * Tìm thấy secret.
     */
    async findSecret(playerId: string, secretId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const secret = this.secrets.get(secretId);

        if (!secret) {
            return { success: false, message: 'Secret not found', scoreGained: 0 };
        }

        // Kiểm tra đã tìm thấy chưa
        const existing = state.foundSecrets.find(s => s.secretId === secretId);
        if (existing) {
            return { success: false, message: 'Secret already found', scoreGained: 0 };
        }

        // Roll rarity
        if (Math.random() > secret.rarity) {
            return { success: false, message: 'Secret not found this time', scoreGained: 0 };
        }

        // Tìm thấy secret
        const found: FoundSecret = {
            secretId,
            foundAt: new Date(),
            sharedWith: [],
            isCommunityDiscovery: secret.isCommunity,
        };

        state.foundSecrets.push(found);
        state.secretsFound++;
        state.curiosityScore += CURIOSITY_SCORES.SECRET_FOUND;
        state.lastCuriosityAction = new Date();

        // Áp dụng phần thưởng
        await this.applySecretReward(playerId, secret.reward);

        // Cập nhật community progress
        if (secret.isCommunity && secret.communityRequired) {
            secret.communityFound = (secret.communityFound || 0) + 1;
        }

        // Cập nhật rank
        const newRank = this.calculateRank(state.curiosityScore);
        const rankUp = newRank !== state.curiosityRank;
        state.curiosityRank = newRank;

        await this.savePlayerState(state);

        // Emit events
        this.events.emit(CURIOSITY_EVENTS.SECRET_FOUND, {
            playerId,
            secretId,
            secretName: secret.name,
        });

        return {
            success: true,
            message: `Tìm thấy bí mật: ${secret.name}`,
            scoreGained: CURIOSITY_SCORES.SECRET_FOUND,
            newRank: rankUp ? newRank : undefined,
        };
    }

    /**
     * Chia sẻ secret với player khác.
     */
    async shareSecret(playerId: string, secretId: string, targetPlayerId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const secret = this.secrets.get(secretId);

        if (!secret) {
            return { success: false, message: 'Secret not found', scoreGained: 0 };
        }

        if (!secret.shareable) {
            return { success: false, message: 'Secret is not shareable', scoreGained: 0 };
        }

        // Kiểm tra đã tìm thấy chưa
        const found = state.foundSecrets.find(s => s.secretId === secretId);
        if (!found) {
            return { success: false, message: 'Secret not found by player', scoreGained: 0 };
        }

        // Kiểm tra đã chia sẻ chưa
        if (found.sharedWith.includes(targetPlayerId)) {
            return { success: false, message: 'Already shared with this player', scoreGained: 0 };
        }

        // Chia sẻ
        found.sharedWith.push(targetPlayerId);
        state.curiosityScore += CURIOSITY_SCORES.SECRET_SHARED;
        state.lastCuriosityAction = new Date();

        await this.savePlayerState(state);

        // Emit events
        this.events.emit(CURIOSITY_EVENTS.SECRET_SHARED, {
            playerId,
            secretId,
            targetPlayerId,
        });

        return {
            success: true,
            message: `Chia sẻ bí mật: ${secret.name}`,
            scoreGained: CURIOSITY_SCORES.SECRET_SHARED,
        };
    }

    /**
     * Lấy secrets đã tìm thấy.
     */
    async getFoundSecrets(playerId: string): Promise<FoundSecret[]> {
        const state = await this.getPlayerState(playerId);
        return state.foundSecrets;
    }

    // --------------------------------------------------------
    // Clue Management
    // --------------------------------------------------------

    /**
     * Lấy clues khả dụng cho player.
     */
    async getAvailableClues(playerId: string, guildId: string): Promise<Clue[]> {
        const state = await this.getPlayerState(playerId);
        const world = await this.worldService.getWorld(guildId);
        const player = await this.playerService.getPlayer(playerId);

        const available: Clue[] = [];

        for (const [clueId, clue] of this.clues) {
            // Bỏ qua nếu đã thu thập
            if (state.collectedClues.some(c => c.clueId === clueId)) {
                continue;
            }

            // Kiểm tra required clues
            const hasAllRequired = clue.requiredClues.every(requiredId =>
                state.collectedClues.some(c => c.clueId === requiredId)
            );
            if (!hasAllRequired) {
                continue;
            }

            // Kiểm tra điều kiện xuất hiện
            const conditionsMet = this.checkConditions(clue.appearConditions, player, world);
            if (!conditionsMet) {
                continue;
            }

            available.push(clue);
        }

        return available;
    }

    /**
     * Lấy clues đã thu thập cho một mystery.
     */
    async getCluesForMystery(playerId: string, mysteryId: string): Promise<CollectedClue[]> {
        const state = await this.getPlayerState(playerId);
        return state.collectedClues.filter(c => c.mysteryId === mysteryId);
    }

    // --------------------------------------------------------
    // Discovery Chain Management
    // --------------------------------------------------------

    /**
     * Bắt đầu discovery chain mới.
     */
    async startChain(playerId: string, chainId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const chainDef = this.chainDefinitions.get(chainId);

        if (!chainDef) {
            return { success: false, message: 'Chain definition not found', scoreGained: 0 };
        }

        // Kiểm tra đã có chain này chưa
        const existing = state.activeChains.find(c => c.id === chainId);
        if (existing) {
            return { success: false, message: 'Chain already active', scoreGained: 0 };
        }

        // Kiểm tra giới hạn
        if (state.activeChains.length >= MAX_ACTIVE_CHAINS) {
            return { success: false, message: 'Too many active chains', scoreGained: 0 };
        }

        // Tạo chain mới
        const chain: DiscoveryChain = {
            ...chainDef,
            playerId,
            currentStepIndex: 0,
            startedAt: new Date(),
        };

        state.activeChains.push(chain);
        state.lastCuriosityAction = new Date();

        await this.savePlayerState(state);

        // Emit events
        this.events.emit(CURIOSITY_EVENTS.CHAIN_STARTED, {
            playerId,
            chainId,
            chainName: chain.name,
        });

        return {
            success: true,
            message: `Bắt đầu chuỗi khám phá: ${chain.name}`,
            scoreGained: 0,
        };
    }

    /**
     * Tiến hành discovery chain.
     */
    async advanceChain(playerId: string, chainId: string, stepId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const chain = state.activeChains.find(c => c.id === chainId);

        if (!chain) {
            return { success: false, message: 'Chain not found', scoreGained: 0 };
        }

        // Kiểm tra bước hiện tại
        const currentStep = chain.steps[chain.currentStepIndex];
        if (!currentStep || currentStep.id !== stepId) {
            return { success: false, message: 'Invalid step', scoreGained: 0 };
        }

        // Hoàn thành bước
        currentStep.completed = true;
        currentStep.completedAt = new Date();
        chain.currentStepIndex++;

        // Kiểm tra hoàn thành chain
        const completed = chain.currentStepIndex >= chain.steps.length;
        if (completed) {
            chain.completedAt = new Date();
            state.chainsCompleted++;
            state.curiosityScore += CURIOSITY_SCORES.CHAIN_COMPLETED;

            // Áp dụng phần thưởng
            await this.applyMysteryReward(playerId, chain.completionReward);

            // Xóa khỏi active chains
            state.activeChains = state.activeChains.filter(c => c.id !== chainId);

            this.events.emit(CURIOSITY_EVENTS.CHAIN_COMPLETED, {
                playerId,
                chainId,
                chainName: chain.name,
                reward: chain.completionReward,
            });
        }

        state.lastCuriosityAction = new Date();
        await this.savePlayerState(state);

        return {
            success: true,
            message: completed ? `Hoàn thành chuỗi: ${chain.name}` : `Tiến bộ trong chuỗi: ${chain.name}`,
            scoreGained: completed ? CURIOSITY_SCORES.CHAIN_COMPLETED : 0,
        };
    }

    /**
     * Lấy active chains của player.
     */
    async getActiveChains(playerId: string): Promise<DiscoveryChain[]> {
        const state = await this.getPlayerState(playerId);
        return state.activeChains;
    }

    // --------------------------------------------------------
    // Locked Content Management
    // --------------------------------------------------------

    /**
     * Thấy locked content (biết là tồn tại).
     */
    async seeLockedContent(playerId: string, contentId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);

        if (state.seenLockedContent.includes(contentId)) {
            return { success: false, message: 'Already seen', scoreGained: 0 };
        }

        state.seenLockedContent.push(contentId);
        state.curiosityScore += CURIOSITY_SCORES.LOCKED_CONTENT_SEEN;
        state.lastCuriosityAction = new Date();

        await this.savePlayerState(state);

        this.events.emit(CURIOSITY_EVENTS.LOCKED_CONTENT_SEEN, {
            playerId,
            contentId,
        });

        return {
            success: true,
            message: 'Phát hiện nội dung bị khóa',
            scoreGained: CURIOSITY_SCORES.LOCKED_CONTENT_SEEN,
        };
    }

    /**
     * Kiểm tra điều kiện mở khóa content.
     */
    async checkUnlockRequirements(playerId: string, contentId: string): Promise<{
        canUnlock: boolean;
        metRequirements: UnlockRequirement[];
        unmetRequirements: UnlockRequirement[];
    }> {
        const state = await this.getPlayerState(playerId);
        const content = this.lockedContent.get(contentId);

        if (!content) {
            return { canUnlock: false, metRequirements: [], unmetRequirements: [] };
        }

        const metRequirements: UnlockRequirement[] = [];
        const unmetRequirements: UnlockRequirement[] = [];

        for (const req of content.requirements) {
            const met = await this.checkRequirement(playerId, req);
            if (met) {
                metRequirements.push(req);
            } else {
                unmetRequirements.push(req);
            }
        }

        return {
            canUnlock: unmetRequirements.length === 0,
            metRequirements,
            unmetRequirements,
        };
    }

    /**
     * Mở khóa content.
     */
    async unlockContent(playerId: string, contentId: string): Promise<CuriosityResult> {
        const state = await this.getPlayerState(playerId);
        const content = this.lockedContent.get(contentId);

        if (!content) {
            return { success: false, message: 'Content not found', scoreGained: 0 };
        }

        // Kiểm tra đã mở khóa chưa
        if (content.unlockedBy.includes(playerId)) {
            return { success: false, message: 'Already unlocked', scoreGained: 0 };
        }

        // Kiểm tra điều kiện
        const { canUnlock } = await this.checkUnlockRequirements(playerId, contentId);
        if (!canUnlock) {
            return { success: false, message: 'Requirements not met', scoreGained: 0 };
        }

        // Mở khóa
        content.unlockedBy.push(playerId);
        state.curiosityScore += CURIOSITY_SCORES.CONTENT_UNLOCKED;
        state.lastCuriosityAction = new Date();

        await this.savePlayerState(state);

        this.events.emit(CURIOSITY_EVENTS.CONTENT_UNLOCKED, {
            playerId,
            contentId,
            contentName: content.name,
        });

        return {
            success: true,
            message: `Mở khóa: ${content.name}`,
            scoreGained: CURIOSITY_SCORES.CONTENT_UNLOCKED,
            unlockedContent: [contentId],
        };
    }

    /**
     * Lấy hints cho locked content.
     */
    getHints(contentId: string): string[] {
        const content = this.lockedContent.get(contentId);
        return content?.hints || [];
    }

    // --------------------------------------------------------
    // Curiosity Score & Rank
    // --------------------------------------------------------

    /**
     * Lấy curiosity score.
     */
    async getCuriosityScore(playerId: string): Promise<number> {
        const state = await this.getPlayerState(playerId);
        return state.curiosityScore;
    }

    /**
     * Lấy curiosity rank.
     */
    async getCuriosityRank(playerId: string): Promise<CuriosityRank> {
        const state = await this.getPlayerState(playerId);
        return state.curiosityRank;
    }

    /**
     * Lấy thống kê curiosity.
     */
    async getCuriosityStats(playerId: string): Promise<{
        score: number;
        rank: CuriosityRank;
        mysteriesDiscovered: number;
        mysteriesSolved: number;
        secretsFound: number;
        cluesCollected: number;
        chainsCompleted: number;
        activeChains: number;
    }> {
        const state = await this.getPlayerState(playerId);
        return {
            score: state.curiosityScore,
            rank: state.curiosityRank,
            mysteriesDiscovered: state.discoveredMysteries.length,
            mysteriesSolved: state.mysteriesSolved,
            secretsFound: state.secretsFound,
            cluesCollected: state.collectedClues.length,
            chainsCompleted: state.chainsCompleted,
            activeChains: state.activeChains.length,
        };
    }

    // --------------------------------------------------------
    // Private Helpers
    // --------------------------------------------------------

    /**
     * Tính rank từ score.
     */
    private calculateRank(score: number): CuriosityRank {
        let rank = CuriosityRank.Indifferent;
        
        for (const [rankName, threshold] of Object.entries(RANK_THRESHOLDS)) {
            if (score >= threshold) {
                rank = rankName as CuriosityRank;
            }
        }

        return rank;
    }

    /**
     * Kiểm tra điều kiện.
     */
    private checkConditions(
        conditions: MysteryCondition[],
        player: any,
        world: any
    ): boolean {
        for (const cond of conditions) {
            switch (cond.type) {
                case 'weather':
                    if (cond.operator === 'eq' && world.weather !== cond.value) return false;
                    break;
                case 'season':
                    if (cond.operator === 'eq' && world.season !== cond.value) return false;
                    break;
                case 'level':
                    if (cond.operator === 'gte' && player.level < cond.value) return false;
                    if (cond.operator === 'lte' && player.level > cond.value) return false;
                    break;
                case 'item':
                    const item = player.inventory.find((i: any) => i.id === cond.targetId);
                    if (cond.operator === 'has' && (!item || item.quantity <= 0)) return false;
                    break;
                case 'discovery':
                    const discovery = player.discoveries.find((d: any) => d.id === cond.targetId);
                    if (cond.operator === 'has' && !discovery) return false;
                    break;
                case 'clue':
                    // TODO: Check clue from curiosity state
                    break;
                case 'relationship':
                    const rel = player.relationships.find((r: any) => r.npcId === cond.targetId);
                    const relValue = rel ? rel.value : 0;
                    if (cond.operator === 'gte' && relValue < cond.value) return false;
                    if (cond.operator === 'lte' && relValue > cond.value) return false;
                    break;
            }
        }
        return true;
    }

    /**
     * Kiểm tra requirement.
     */
    private async checkRequirement(playerId: string, req: UnlockRequirement): Promise<boolean> {
        const state = await this.getPlayerState(playerId);
        const player = await this.playerService.getPlayer(playerId);

        switch (req.type) {
            case 'item':
                const item = player.inventory.find(i => i.id === req.targetId);
                return !!item && item.quantity >= (req.amount || 1);

            case 'discovery':
                return player.discoveries.some(d => d.id === req.targetId);

            case 'relationship':
                const rel = player.relationships.find(r => r.npcId === req.targetId);
                return rel ? rel.value >= (req.amount || 0) : false;

            case 'level':
                return player.level >= (req.amount || 1);

            case 'clue':
                return state.collectedClues.some(c => c.clueId === req.targetId);

            case 'mystery_solved':
                return state.discoveredMysteries.some(m => m.mysteryId === req.targetId && m.solved);

            case 'secret_found':
                return state.foundSecrets.some(s => s.secretId === req.targetId);

            default:
                return false;
        }
    }

    /**
     * Áp dụng mystery reward.
     */
    private async applyMysteryReward(playerId: string, reward: MysteryReward): Promise<void> {
        switch (reward.type) {
            case 'xp':
                await this.playerService.addXp(playerId, reward.amount || 0);
                break;
            case 'item':
                // TODO: Add item to player
                break;
            case 'discovery':
                // TODO: Add discovery to player
                break;
            case 'relationship':
                // TODO: Modify relationship
                break;
            case 'unlock':
                // TODO: Unlock content
                break;
            case 'lore':
                // Lore is informational, no action needed
                break;
        }
    }

    /**
     * Áp dụng secret reward.
     */
    private async applySecretReward(playerId: string, reward: SecretReward): Promise<void> {
        switch (reward.type) {
            case 'xp':
                await this.playerService.addXp(playerId, reward.amount || 0);
                break;
            case 'currency':
                await this.playerService.modifyCurrency(playerId, reward.amount || 0);
                break;
            case 'item':
                // TODO: Add item to player
                break;
            case 'discovery':
                // TODO: Add discovery to player
                break;
            case 'relationship':
                // TODO: Modify relationship
                break;
            case 'unlock':
                // TODO: Unlock content
                break;
            case 'opportunity':
                // TODO: Unlock opportunity
                break;
            case 'lore':
                // Lore is informational, no action needed
                break;
        }
    }
}
