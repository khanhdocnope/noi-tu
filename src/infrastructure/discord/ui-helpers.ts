// ============================================================
// ECHO — UI Helpers
// Centralized UI utilities cho Discord embeds.
// ============================================================

import { EmbedBuilder, Colors, ButtonBuilder, ButtonStyle } from 'discord.js';

// ── Color System ────────────────────────────────────────────

export const UI_COLORS = {
    /** Success, positive outcomes */
    Success: Colors.Green,
    /** Danger, combat, damage */
    Danger: Colors.Red,
    /** Warning, caution */
    Warning: Colors.Orange,
    /** Info, neutral */
    Info: Colors.Blurple,
    /** Reward, loot, gold */
    Reward: Colors.Gold,
    /** Inactive, empty, disabled */
    Muted: Colors.Grey,
    /** Magic, mystery, curiosity */
    Magic: Colors.Purple,
} as const;

// ── HP Bar ──────────────────────────────────────────────────

/**
 * Tạo HP bar text.
 * @param current - HP hiện tại
 * @param max - HP tối đa
 * @param length - Độ dài bar (default 10)
 * @returns Ví dụ: "█████░░░░░"
 */
export function hpBar(current: number, max: number, length: number = 10): string {
    const filled = Math.max(0, Math.min(length, Math.floor((current / max) * length)));
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Tạo HP text format: "100/200" với color hint.
 */
export function hpText(current: number, max: number): string {
    const percent = current / max;
    const emoji = percent > 0.5 ? '🟢' : percent > 0.25 ? '🟡' : '🔴';
    return `${emoji} **${current}/${max}**`;
}

/**
 * Tạo stat text: "15 (+5)" với modifier.
 */
export function statText(base: number, modifier: number = 0): string {
    if (modifier === 0) return `**${base}**`;
    const sign = modifier > 0 ? '+' : '';
    return `**${base}** (${sign}${modifier})`;
}

// ── Progress Bar ────────────────────────────────────────────

/**
 * Tạo progress bar generic.
 * @param current - Giá trị hiện tại
 * @param max - Giá trị tối đa
 * @param length - Độ dài bar
 * @param filledChar - Ký tự đã điền
 * @param emptyChar - Ký tự trống
 */
export function progressBar(
    current: number,
    max: number,
    length: number = 10,
    filledChar: string = '█',
    emptyChar: string = '░'
): string {
    const filled = Math.max(0, Math.min(length, Math.floor((current / max) * length)));
    const empty = length - filled;
    return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

// ── Embed Builders ──────────────────────────────────────────

/**
 * Tạo error embed chuẩn.
 */
export function errorEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setColor(UI_COLORS.Danger)
        .setTimestamp();
}

/**
 * Tạo success embed chuẩn.
 */
export function successEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setColor(UI_COLORS.Success)
        .setTimestamp();
}

/**
 * Tạo info embed chuẩn.
 */
export function infoEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(UI_COLORS.Info)
        .setTimestamp();
}

/**
 * Thêm footer với player info.
 */
export function withFooter(embed: EmbedBuilder, player: { level: number; combat?: { hp: number; maxHp: number } }): EmbedBuilder {
    const parts = [`Level ${player.level}`];
    if (player.combat) {
        parts.push(`HP ${player.combat.hp}/${player.combat.maxHp}`);
    }
    return embed.setFooter({ text: parts.join(' • ') });
}

// ── Emoji Mapping ───────────────────────────────────────────

export const STAT_EMOJI = {
    hp: '❤️',
    maxHp: '💚',
    attack: '⚔️',
    defense: '🛡️',
    speed: '💨',
    level: '📊',
    xp: '📈',
    gold: '💰',
} as const;

export const EVENT_EMOJI = {
    combat: '⚔️',
    item: '🎁',
    treasure: '💰',
    discovery: '🔍',
    trap: '⚠️',
    rest: '🏕️',
    nothing: '📭',
    npc: '👤',
    success: '✅',
    failure: '❌',
    warning: '⚠️',
} as const;

// ── Button Builder ──────────────────────────────────────────

export type ButtonAction = 'primary' | 'secondary' | 'danger' | 'success';

/**
 * Tạo button consistent.
 * @param customId - Custom ID cho button
 * @param label - Text hiển thị
 * @param action - Loại button (primary, secondary, danger, success)
 */
export function buildButton(
    customId: string,
    label: string,
    action: ButtonAction = 'primary'
): ButtonBuilder {
    const styleMap: Record<ButtonAction, ButtonStyle> = {
        primary: ButtonStyle.Primary,
        secondary: ButtonStyle.Secondary,
        danger: ButtonStyle.Danger,
        success: ButtonStyle.Success,
    };

    return new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(styleMap[action]);
}
