// ============================================================
// ECHO — Enemy Configuration
// Định nghĩa các loại enemy trong game.
// Spec ref: doc/ECHO — HP & Combat System Prompt.md
// ============================================================

import { Enemy, CombatItem, StatusEffect } from './CombatTypes';

// ── Status Effects ──────────────────────────────────────────

export const STATUS_EFFECTS: Record<string, StatusEffect> = {
    poison: {
        id: 'poison',
        name: 'Độc',
        description: 'Mất HP mỗi turn',
        damagePerTurn: 5,
        duration: 3,
        applyChance: 0.2,
    },
    burn: {
        id: 'burn',
        name: 'Bỏng',
        description: 'Mất HP mỗi turn do lửa',
        damagePerTurn: 8,
        duration: 2,
        applyChance: 0.15,
    },
    bleed: {
        id: 'bleed',
        name: 'Chảy máu',
        description: 'Mất HP mỗi turn',
        damagePerTurn: 4,
        duration: 4,
        applyChance: 0.25,
    },
    stun: {
        id: 'stun',
        name: 'Choáng',
        description: 'Bỏ lỡ turn tiếp theo',
        damagePerTurn: 0,
        duration: 1,
        applyChance: 0.1,
    },
    slow: {
        id: 'slow',
        name: 'Chậm',
        description: 'Giảm tốc độ',
        damagePerTurn: 0,
        statModifier: { speed: -5 },
        duration: 2,
        applyChance: 0.2,
    },
    atk_up: {
        id: 'atk_up',
        name: 'Tăng tấn công',
        description: 'Tăng lực tấn công',
        damagePerTurn: 0,
        statModifier: { attack: 5 },
        duration: 3,
        applyChance: 0,
    },
    def_up: {
        id: 'def_up',
        name: 'Tăng phòng thủ',
        description: 'Tăng lực phòng thủ',
        damagePerTurn: 0,
        statModifier: { defense: 5 },
        duration: 3,
        applyChance: 0,
    },
    regen: {
        id: 'regen',
        name: 'Hồi phục',
        description: 'Hồi HP mỗi turn',
        damagePerTurn: -10,
        duration: 3,
        applyChance: 0,
    },
};

// ── Combat Items ────────────────────────────────────────────

export const COMBAT_ITEMS: CombatItem[] = [
    {
        id: 'health_potion',
        name: 'Bình máu',
        type: 'heal',
        value: 30,
        description: 'Hồi 30 HP',
    },
    {
        id: 'large_health_potion',
        name: 'Bình máu lớn',
        type: 'heal',
        value: 60,
        description: 'Hồi 60 HP',
    },
    {
        id: 'antidote',
        name: 'Thuốc giải độc',
        type: 'heal',
        value: 0,
        appliesEffect: 'poison',
        description: 'Giải độc',
    },
    {
        id: 'attack_scroll',
        name: 'Cuộn tấn công',
        type: 'buff',
        value: 5,
        duration: 3,
        description: '+5 Attack trong 3 turns',
    },
    {
        id: 'defense_scroll',
        name: 'Cuộn phòng thủ',
        type: 'buff',
        value: 5,
        duration: 3,
        description: '+5 Defense trong 3 turns',
    },
    {
        id: 'fire_bomb',
        name: 'Bom lửa',
        type: 'damage',
        value: 25,
        appliesEffect: 'burn',
        description: 'Gây 25 damage + burn',
    },
    {
        id: 'smoke_bomb',
        name: 'Bom khói',
        type: 'escape',
        value: 1,
        description: 'Tăng tỷ lệ escape lên 100%',
    },
];

// ── Enemy Definitions ───────────────────────────────────────

export const ENEMIES: Enemy[] = [
    // ── Level 1-3: Dễ ──────────────────────────────────────
    {
        id: 'slime',
        name: '🟢 Slime',
        description: 'Một cục slime nhỏ, yếu nhưng đông.',
        hp: 30,
        maxHp: 30,
        attack: 5,
        defense: 2,
        speed: 5,
        xpReward: 10,
        goldReward: 5,
        loot: [
            { itemId: 'slime_gel', itemName: 'Nhớt Slime', itemType: 'resource', dropRate: 0.8, minAmount: 1, maxAmount: 3 },
        ],
        canHeal: false,
        healThreshold: 0,
        occurConditions: [],
    },
    {
        id: 'rat',
        name: '🐀 Chuột Cống',
        description: 'Chuột lớn bằng mèo, răng sắc.',
        hp: 20,
        maxHp: 20,
        attack: 8,
        defense: 1,
        speed: 12,
        xpReward: 8,
        goldReward: 3,
        loot: [
            { itemId: 'rat_tail', itemName: 'Đuôi Chuột', itemType: 'resource', dropRate: 0.5, minAmount: 1, maxAmount: 1 },
        ],
        canHeal: false,
        healThreshold: 0,
        occurConditions: [],
    },
    {
        id: 'goblin',
        name: '👺 Goblin',
        description: 'Goblin nhỏ, hay trộm cắp.',
        hp: 40,
        maxHp: 40,
        attack: 8,
        defense: 3,
        speed: 10,
        xpReward: 15,
        goldReward: 12,
        loot: [
            { itemId: 'goblin_dagger', itemName: 'Dao Goblin', itemType: 'equipment', dropRate: 0.2, minAmount: 1, maxAmount: 1 },
            { itemId: 'gold_coin', itemName: 'Vàng', itemType: 'resource', dropRate: 0.9, minAmount: 5, maxAmount: 15 },
        ],
        canHeal: false,
        healThreshold: 0,
        occurConditions: [],
    },

    // ── Level 3-6: Trung bình ───────────────────────────────
    {
        id: 'wolf',
        name: '🐺 Sói',
        description: 'Sói rừng, tấn công theo bầy.',
        hp: 60,
        maxHp: 60,
        attack: 12,
        defense: 5,
        speed: 14,
        xpReward: 25,
        goldReward: 10,
        loot: [
            { itemId: 'wolf_fang', itemName: 'Răng Sói', itemType: 'resource', dropRate: 0.6, minAmount: 1, maxAmount: 2 },
            { itemId: 'wolf_pelt', itemName: 'Lông Sói', itemType: 'resource', dropRate: 0.4, minAmount: 1, maxAmount: 1 },
        ],
        canHeal: false,
        healThreshold: 0,
        occurConditions: [{ type: 'season', value: 'winter' }],
    },
    {
        id: 'skeleton',
        name: '💀 Bộ Xương',
        description: 'Xương sống dậy từ nghĩa trang.',
        hp: 50,
        maxHp: 50,
        attack: 10,
        defense: 8,
        speed: 6,
        xpReward: 20,
        goldReward: 8,
        loot: [
            { itemId: 'bone', itemName: 'Xương', itemType: 'resource', dropRate: 0.7, minAmount: 1, maxAmount: 3 },
            { itemId: 'rusty_sword', itemName: 'Kiếm Gỉ', itemType: 'equipment', dropRate: 0.15, minAmount: 1, maxAmount: 1 },
        ],
        canHeal: false,
        healThreshold: 0,
        occurConditions: [{ type: 'weather', value: 'fog' }],
    },
    {
        id: 'bandit',
        name: '🗡️ibandit',
        description: 'Tên cướp đường, hung dữ.',
        hp: 70,
        maxHp: 70,
        attack: 14,
        defense: 6,
        speed: 11,
        xpReward: 30,
        goldReward: 25,
        loot: [
            { itemId: 'bandit_mask', itemName: 'Mặt Nạ Cướp', itemType: 'equipment', dropRate: 0.2, minAmount: 1, maxAmount: 1 },
            { itemId: 'gold_coin', itemName: 'Vàng', itemType: 'resource', dropRate: 0.9, minAmount: 10, maxAmount: 30 },
        ],
        canHeal: true,
        healThreshold: 0.3,
        occurConditions: [],
    },

    // ── Level 6-9: Khó ──────────────────────────────────────
    {
        id: 'troll',
        name: '👹 Troll',
        description: 'Troll lớn, hp cao, tấn công mạnh.',
        hp: 120,
        maxHp: 120,
        attack: 18,
        defense: 10,
        speed: 5,
        xpReward: 50,
        goldReward: 30,
        loot: [
            { itemId: 'troll_club', itemName: 'Gậy Troll', itemType: 'equipment', dropRate: 0.25, minAmount: 1, maxAmount: 1 },
            { itemId: 'troll_blood', itemName: 'Máu Troll', itemType: 'resource', dropRate: 0.5, minAmount: 1, maxAmount: 2 },
        ],
        canHeal: true,
        healThreshold: 0.4,
        occurConditions: [],
    },
    {
        id: 'dark_mage',
        name: '🧙 Pháp Sư Bóng Tối',
        description: 'Pháp sư dùng phép thuật hắc ám.',
        hp: 80,
        maxHp: 80,
        attack: 22,
        defense: 4,
        speed: 13,
        xpReward: 55,
        goldReward: 40,
        loot: [
            { itemId: 'dark_staff', itemName: 'Gậy Bóng Tối', itemType: 'equipment', dropRate: 0.2, minAmount: 1, maxAmount: 1 },
            { itemId: 'magic_essence', itemName: 'Tinh Hoa Phép Thuật', itemType: 'resource', dropRate: 0.6, minAmount: 1, maxAmount: 3 },
        ],
        canHeal: true,
        healThreshold: 0.3,
        occurConditions: [{ type: 'weather', value: 'eclipse' }],
    },

    // ── Level 10+: Boss/Nâng cao ────────────────────────────
    {
        id: 'dragon_whelp',
        name: '🐲 Rồng Con',
        description: 'Rồng con, yếu hơn rồng lớn nhưng vẫn nguy hiểm.',
        hp: 180,
        maxHp: 180,
        attack: 25,
        defense: 15,
        speed: 12,
        xpReward: 100,
        goldReward: 80,
        loot: [
            { itemId: 'dragon_scale', itemName: 'Vảy Rồng', itemType: 'resource', dropRate: 0.7, minAmount: 1, maxAmount: 3 },
            { itemId: 'dragon_fang', itemName: 'Răng Rồng', itemType: 'resource', dropRate: 0.4, minAmount: 1, maxAmount: 1 },
            { itemId: 'fire_crystal', itemName: 'Tinh Lửa', itemType: 'key', dropRate: 0.15, minAmount: 1, maxAmount: 1 },
        ],
        canHeal: true,
        healThreshold: 0.35,
        occurConditions: [{ type: 'season', value: 'summer' }],
    },
    {
        id: 'lich',
        name: '☠️ Lich',
        description: 'Vuong tundead, control army undead.',
        hp: 150,
        maxHp: 150,
        attack: 28,
        defense: 12,
        speed: 10,
        xpReward: 120,
        goldReward: 100,
        loot: [
            { itemId: 'phylactery', itemName: 'Phylactery', itemType: 'key', dropRate: 0.1, minAmount: 1, maxAmount: 1 },
            { itemId: 'soul_shard', itemName: 'Mảnh Linh Hồn', itemType: 'resource', dropRate: 0.5, minAmount: 1, maxAmount: 2 },
        ],
        canHeal: true,
        healThreshold: 0.4,
        occurConditions: [{ type: 'weather', value: 'eclipse' }],
    },
];

// ── Helper Functions ────────────────────────────────────────

/**
 * Lấy enemy theo level.
 */
export function getEnemiesByLevel(level: number): Enemy[] {
    if (level <= 3) {
        return ENEMIES.filter(e => ['slime', 'rat', 'goblin'].includes(e.id));
    }
    if (level <= 6) {
        return ENEMIES.filter(e => ['wolf', 'skeleton', 'bandit'].includes(e.id));
    }
    if (level <= 9) {
        return ENEMIES.filter(e => ['troll', 'dark_mage'].includes(e.id));
    }
    return ENEMIES.filter(e => ['dragon_whelp', 'lich'].includes(e.id));
}

/**
 * Random enemy theo level.
 */
export function getRandomEnemy(level: number): Enemy {
    const enemies = getEnemiesByLevel(level);
    const template = enemies[Math.floor(Math.random() * enemies.length)];
    // Clone để không mutate original
    return { ...template, hp: template.maxHp };
}

/**
 * Lấy combat item theo ID.
 */
export function getCombatItem(id: string): CombatItem | undefined {
    return COMBAT_ITEMS.find(item => item.id === id);
}

/**
 * Lấy status effect theo ID.
 */
export function getStatusEffect(id: string): StatusEffect | undefined {
    return STATUS_EFFECTS[id];
}
