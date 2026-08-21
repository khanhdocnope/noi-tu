// ============================================================
// ECHO — Region Exploration Configs
// Cấu hình thám hiểm cho từng khu vực.
// ============================================================

import { RegionExplorationConfig, ExplorationEvent } from './ExplorationTypes';

// ── Forest Region ───────────────────────────────────────────

const FOREST_EVENTS: ExplorationEvent[] = [
    {
        type: 'combat',
        name: '⚔️ Gặp Sói',
        description: 'Một con sói rừng chặn đường bạn!',
        weight: 0.25,
        data: { enemyId: 'wolf' },
    },
    {
        type: 'combat',
        name: '⚔️ Gặp Goblin',
        description: 'Goblin đang lục lọi什么东西!',
        weight: 0.2,
        data: { enemyId: 'goblin' },
    },
    {
        type: 'item',
        name: '🌿 Tìm Thảo Dược',
        description: 'Bạn thấy một bụi thảo dược quý.',
        weight: 0.2,
        data: { itemId: 'herb', itemName: 'Thảo Dược', itemType: 'resource', itemAmount: 2 },
    },
    {
        type: 'treasure',
        name: '💰 Tìm Kho Báu Nhỏ',
        description: 'Bạn tìm thấy một túi vàng nhỏ dưới gốc cây.',
        weight: 0.15,
        data: { goldAmount: 15 },
    },
    {
        type: 'rest',
        name: '🏕️ Tìm Chỗ Nghỉ',
        description: 'Bạn tìm một khoảng đất bằng phẳng để nghỉ ngơi.',
        weight: 0.1,
        data: { hpChange: 20 },
    },
    {
        type: 'trap',
        name: '⚠️ Bẫy Đậu',
        description: 'Bạn dẫm phải bẫy đậu!',
        weight: 0.05,
        data: { hpChange: -15 },
    },
    {
        type: 'nothing',
        name: '🌳 Rừng Yên Tĩnh',
        description: 'Không có gì đặc biệt. Rừng chỉ là rừng.',
        weight: 0.05,
    },
];

// ── Cave Region ─────────────────────────────────────────────

const CAVE_EVENTS: ExplorationEvent[] = [
    {
        type: 'combat',
        name: '⚔️ Gặp Bộ Xương',
        description: 'Bộ xương sống dậy từ bóng tối!',
        weight: 0.3,
        data: { enemyId: 'skeleton' },
    },
    {
        type: 'combat',
        name: '⚔️ Gặp Dơi Quỷ',
        description: 'Đàn dơi quUserCode bay ra từ hang!',
        weight: 0.15,
        data: { enemyId: 'rat' },
    },
    {
        type: 'item',
        name: '💎 Tìm Ngọc',
        description: 'Bạn thấy một viên ngọc phát sáng trên vách hang.',
        weight: 0.15,
        data: { itemId: 'cave_gem', itemName: 'Ngọc Hang', itemType: 'resource', itemAmount: 1 },
    },
    {
        type: 'treasure',
        name: '💰 Kho Báu Cổ',
        description: 'Bạn tìm thấy rương kho báu bị bỏ quên!',
        weight: 0.15,
        data: { goldAmount: 30 },
    },
    {
        type: 'trap',
        name: '⚠️ Đá Rơi',
        description: 'Một tảng đá rơi từ trần hang!',
        weight: 0.1,
        data: { hpChange: -25 },
    },
    {
        type: 'rest',
        name: '🏕️ Hang Đá',
        description: 'Bạn tìm một hang nhỏ, an toàn để nghỉ.',
        weight: 0.1,
        data: { hpChange: 25 },
    },
    {
        type: 'discovery',
        name: '🔍壁壁画',
        description: 'Bạn thấy tranh vẽ trên vách hang cổ đại.',
        weight: 0.05,
        data: { discoveryId: 'cave_painting' },
    },
];

// ── Ruins Region ────────────────────────────────────────────

const RUINS_EVENTS: ExplorationEvent[] = [
    {
        type: 'combat',
        name: '⚔️ Gặp Bandit',
        description: 'Tên cướp chặn đường!',
        weight: 0.25,
        data: { enemyId: 'bandit' },
    },
    {
        type: 'combat',
        name: '⚔️ Gặp Pháp Sư',
        description: 'Pháp sư bóng tối xuất hiện!',
        weight: 0.15,
        data: { enemyId: 'dark_mage' },
    },
    {
        type: 'item',
        name: '📜 Tìm Cuộn Phép',
        description: 'Bạn tìm thấy cuộn phép thuật trong đống đổ nát.',
        weight: 0.15,
        data: { itemId: 'attack_scroll', itemName: 'Cuộn Tấn Công', itemType: 'usable', itemAmount: 1 },
    },
    {
        type: 'treasure',
        name: '💰 Kho Báu Vương Quốc',
        description: 'Bạn tìm thấy kho báu của vương quốc cổ!',
        weight: 0.15,
        data: { goldAmount: 50 },
    },
    {
        type: 'trap',
        name: '⚠️ Bẫy Ma Thuật',
        description: 'Bạn chạm vào bẫy ma thuật!',
        weight: 0.1,
        data: { hpChange: -30 },
    },
    {
        type: 'discovery',
        name: '🔍 Bí Mật Vương Quốc',
        description: 'Bạn tìm thấy thư ký bí mật của nhà vua.',
        weight: 0.1,
        data: { discoveryId: 'kingdom_secret' },
    },
    {
        type: 'rest',
        name: '🏕️ Điện Đường',
        description: 'Bạn tìm một góc điện đường an toàn.',
        weight: 0.1,
        data: { hpChange: 30 },
    },
];

// ── Swamp Region ────────────────────────────────────────────

const SWAMP_EVENTS: ExplorationEvent[] = [
    {
        type: 'combat',
        name: '⚔️ Gặp Slime',
        description: 'Một cục slime khổng lồ!',
        weight: 0.3,
        data: { enemyId: 'slime' },
    },
    {
        type: 'combat',
        name: '⚔️ Gặp Goblin',
        description: 'Goblin swamp!',
        weight: 0.2,
        data: { enemyId: 'goblin' },
    },
    {
        type: 'item',
        name: '🍄 Tìm Nấm Độc',
        description: 'Bạn thấy nấm phát sáng.',
        weight: 0.15,
        data: { itemId: 'mushroom', itemName: 'Nấm Độc', itemType: 'resource', itemAmount: 2 },
    },
    {
        type: 'trap',
        name: '⚠️ Vũng Bùn',
        description: 'Bạn bị sa vào vũng bùn!',
        weight: 0.2,
        data: { hpChange: -10 },
    },
    {
        type: 'treasure',
        name: '💰 Đồ Cổ',
        description: 'Bạn tìm thấy đồ cổ dưới bùn.',
        weight: 0.1,
        data: { goldAmount: 20 },
    },
    {
        type: 'nothing',
        name: '🌫️ Sương Mù',
        description: 'Sương mù dày đặc, không thấy gì.',
        weight: 0.05,
    },
];

// ── All Region Configs ──────────────────────────────────────

export const REGION_CONFIGS: RegionExplorationConfig[] = [
    {
        regionId: 'forest',
        name: '🌲 Rừng Rậm',
        description: 'Rừng cổ đại, nơi ẩn chứa nhiều bí ẩn.',
        minLevel: 1,
        minHpPercent: 0.1,
        events: FOREST_EVENTS,
        modifiers: {
            combatChanceMod: 0,
            itemDropMod: 0,
            goldMod: 0,
            damageMod: 0,
        },
    },
    {
        regionId: 'cave',
        name: '🕳️ Hang Đá',
        description: 'Hang tối, nơi sinh sống của undead.',
        minLevel: 3,
        minHpPercent: 0.2,
        events: CAVE_EVENTS,
        modifiers: {
            combatChanceMod: 0.05,
            itemDropMod: 0.1,
            goldMod: 0.2,
            damageMod: 0.1,
        },
    },
    {
        regionId: 'ruins',
        name: '🏚️ Tàn Tích',
        description: 'Tàn tích của vương quốc cổ.',
        minLevel: 5,
        minHpPercent: 0.25,
        events: RUINS_EVENTS,
        modifiers: {
            combatChanceMod: 0.1,
            itemDropMod: 0.15,
            goldMod: 0.3,
            damageMod: 0.15,
        },
    },
    {
        regionId: 'swamp',
        name: '🌫️ Đầm Lầy',
        description: 'Đầm lầy độc hại, nơi ở của slime.',
        minLevel: 2,
        minHpPercent: 0.15,
        events: SWAMP_EVENTS,
        modifiers: {
            combatChanceMod: 0.05,
            itemDropMod: -0.05,
            goldMod: -0.1,
            damageMod: 0.05,
        },
    },
];

// ── Helper Functions ────────────────────────────────────────

export function getRegionConfig(regionId: string): RegionExplorationConfig | undefined {
    return REGION_CONFIGS.find(r => r.regionId === regionId);
}

export function getAvailableRegions(level: number): RegionExplorationConfig[] {
    return REGION_CONFIGS.filter(r => r.minLevel <= level);
}
