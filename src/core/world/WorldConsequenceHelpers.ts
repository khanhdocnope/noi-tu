// ============================================================
// ECHO — World Consequence Helpers
// Các hàm tiện ích để tạo hệ quả cho thế giới từ hành động player.
// Dùng trong OpportunityService để áp dụng consequences.
// Spec ref: Core Loop (World Memory - deeper consequences)
// ============================================================

import {
    WorldActionType,
    ImpactLevel,
    WorldChange,
    PlayerConsequence,
} from './WorldMemoryTypes';
import { Weather } from './WorldStateTypes';

type ConsequenceResult = {
    actionType: WorldActionType;
    impactLevel: ImpactLevel;
    description: string;
    worldChanges: WorldChange[];
    playerConsequences: PlayerConsequence[];
};

// --- Resource Consequences ---

export function contributeResource(
    playerId: string,
    amount: number,
    resourceType: string
): ConsequenceResult {
    const impactLevel = amount >= 100 ? ImpactLevel.Major :
                       amount >= 50 ? ImpactLevel.Moderate :
                       ImpactLevel.Minor;

    return {
        actionType: WorldActionType.ResourceContributed,
        impactLevel,
        description: `${playerId} da dong gop ${amount} ${resourceType} cho thi tran.`,
        worldChanges: [{
            field: 'sharedResourcePool',
            oldValue: null,
            newValue: amount,
            description: `Tang ${amount} ${resourceType} vao quy chung`,
            reversible: true,
        }],
        playerConsequences: [{
            type: 'bonus',
            description: `Ban nhan duoc su biet on cong dong.`,
            targetPlayerId: playerId,
            value: { xp: Math.floor(amount / 2), relationship: 10 },
        }],
    };
}

export function depleteResource(
    playerId: string,
    amount: number,
    resourceType: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.ResourceDepleted,
        impactLevel: ImpactLevel.Moderate,
        description: `${playerId} da su dung ${amount} ${resourceType} tu quy chung.`,
        worldChanges: [{
            field: 'sharedResourcePool',
            oldValue: null,
            newValue: -amount,
            description: `Giam ${amount} ${resourceType} tu quy chung`,
            reversible: true,
        }],
        playerConsequences: [],
    };
}

// --- Weather Consequences ---

export function influenceWeather(
    playerId: string,
    targetWeather: Weather,
    reason: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.WeatherInfluenced,
        impactLevel: ImpactLevel.Major,
        description: `${playerId} da ${reason}, khien thoi tien chuyen sang ${targetWeather}.`,
        worldChanges: [{
            field: 'weather',
            oldValue: null,
            newValue: targetWeather,
            description: `Thoi tien chuyen sang ${targetWeather}`,
            reversible: false,
        }],
        playerConsequences: [],
    };
}

// --- NPC Relationship Consequences ---

export function pleaseNPC(
    playerId: string,
    npcId: string,
    relationshipGain: number,
    unlockText: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.NPCRelationshipUp,
        impactLevel: relationshipGain >= 30 ? ImpactLevel.Major : ImpactLevel.Moderate,
        description: `${playerId} da lam ${npcId} rat hai long. ${unlockText}`,
        worldChanges: [],
        playerConsequences: [{
            type: 'opportunity',
            description: `Ban da mo khoa co hoi moi tu ${npcId}!`,
            targetPlayerId: playerId,
            value: { npcId, relationshipGain },
        }],
    };
}

export function displeaseNPC(
    playerId: string,
    npcId: string,
    relationshipLoss: number,
    penaltyText: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.NPCRelationshipDown,
        impactLevel: relationshipLoss >= 30 ? ImpactLevel.Major : ImpactLevel.Moderate,
        description: `${playerId} da lam ${npcId} phat long. ${penaltyText}`,
        worldChanges: [],
        playerConsequences: [{
            type: 'penalty',
            description: `Ban da mat long ${npcId}.`,
            targetPlayerId: playerId,
            value: { npcId, relationshipLoss },
        }],
    };
}

// --- Discovery Consequences ---

export function shareDiscovery(
    playerId: string,
    discoveryId: string,
    discoveryName: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.DiscoveryShared,
        impactLevel: ImpactLevel.Moderate,
        description: `${playerId} da kham pha va chia se bi mat: ${discoveryName}.`,
        worldChanges: [],
        playerConsequences: [{
            type: 'bonus',
            description: `Kham pha "${discoveryName}" da duoc chia se cho cong dong!`,
            targetPlayerId: null,
            value: { discoveryId },
        }],
    };
}

// --- Event Consequences ---

export function completeEvent(
    playerId: string,
    eventId: string,
    eventName: string,
    worldReward: WorldChange[]
): ConsequenceResult {
    return {
        actionType: WorldActionType.EventCompleted,
        impactLevel: ImpactLevel.Critical,
        description: `${playerId} da hoan thanh su kien "${eventName}"!`,
        worldChanges: worldReward,
        playerConsequences: [{
            type: 'bonus',
            description: `Su kien "${eventName}" da hoan thanh! Nhan thuong.`,
            targetPlayerId: playerId,
            value: { xp: 200, currency: 100 },
        }],
    };
}

// --- Combat Consequences ---

export function defeatWorldBoss(
    playerId: string,
    bossName: string,
    regionId: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.WorldBossDefeated,
        impactLevel: ImpactLevel.Critical,
        description: `${playerId} da danh bai ${bossName}! Khu vuc ${regionId} da an toan.`,
        worldChanges: [{
            field: 'regions',
            oldValue: null,
            newValue: { id: regionId, status: 'active' },
            description: `Khu vuc ${regionId} da duoc giai phong`,
            reversible: false,
        }],
        playerConsequences: [{
            type: 'bonus',
            description: `Ban la anh hung da giai phong ${regionId}!`,
            targetPlayerId: playerId,
            value: { xp: 500, currency: 300 },
        }],
    };
}

// --- Curse Consequences ---

export function inflictCurse(
    playerId: string,
    curseName: string,
    duration: number
): ConsequenceResult {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    return {
        actionType: WorldActionType.CurseInflicted,
        impactLevel: ImpactLevel.Major,
        description: `${playerId} da bi nguyen rua boi ${curseName}!`,
        worldChanges: [],
        playerConsequences: [{
            type: 'penalty',
            description: `Ban bi nguyen rua boi ${curseName} trong ${duration} ngay.`,
            targetPlayerId: playerId,
            value: { curseName, duration },
            expiresAt,
        }],
    };
}

// --- Market Consequences ---

export function shiftMarket(
    playerId: string,
    itemId: string,
    trend: 'rising' | 'falling',
    percent: number
): ConsequenceResult {
    const trendText = trend === 'rising' ? 'tang' : 'giam';
    return {
        actionType: WorldActionType.MarketShift,
        impactLevel: percent >= 20 ? ImpactLevel.Major : ImpactLevel.Moderate,
        description: `${playerId} da khien gia ${itemId} ${trendText} ${percent}%.`,
        worldChanges: [{
            field: 'marketTrends',
            oldValue: null,
            newValue: { itemId, trend, changePercent: percent },
            description: `Gia ${itemId} ${trendText} ${percent}%`,
            reversible: true,
        }],
        playerConsequences: [],
    };
}

// --- Secret Consequences ---

export function revealSecret(
    playerId: string,
    secretId: string,
    secretName: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.SecretRevealed,
        impactLevel: ImpactLevel.Major,
        description: `${playerId} da tieu diet bi mat: ${secretName}.`,
        worldChanges: [],
        playerConsequences: [{
            type: 'opportunity',
            description: `Bi mat "${secretName}" da duoc tieu diet!`,
            targetPlayerId: null,
            value: { secretId },
        }],
    };
}

// --- Festival Consequences ---

export function organizeFestival(
    playerId: string,
    festivalName: string,
    durationDays: number
): ConsequenceResult {
    return {
        actionType: WorldActionType.FestivalOrganized,
        impactLevel: ImpactLevel.Major,
        description: `${playerId} da to chuc le hoi "${festivalName}" trong ${durationDays} ngay!`,
        worldChanges: [],
        playerConsequences: [{
            type: 'bonus',
            description: `Le hoi "${festivalName}" dang dien ra! Nhan bonus.`,
            targetPlayerId: null,
            value: { xp: 100, currency: 50 },
        }],
    };
}

// --- Region Damage Consequences ---

export function damageRegion(
    playerId: string,
    regionId: string,
    reason: string
): ConsequenceResult {
    return {
        actionType: WorldActionType.RegionDamaged,
        impactLevel: ImpactLevel.Major,
        description: `${playerId} da lam ton thuong khu vuc ${regionId}: ${reason}`,
        worldChanges: [{
            field: 'regions',
            oldValue: null,
            newValue: { id: regionId, status: 'closed' },
            description: `Khu vuc ${regionId} da bi dong cua`,
            reversible: true,
        }],
        playerConsequences: [],
    };
}
