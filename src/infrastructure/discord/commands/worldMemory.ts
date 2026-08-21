// ============================================================
// ECHO — Slash Command: /world-memory
// Hiển thị World Memory - các hệ quả từ hành động của người chơi.
// Spec ref: Core Loop (World Memory - deeper consequences)
// ============================================================

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Colors,
    MessageFlags,
} from 'discord.js';
import { Command } from '../types';
import { getContainer } from '../../../bootstrap';
import { ImpactLevel, MemoryStatus } from '../../../core/world/WorldMemoryTypes';

/**
 * Tạo emoji cho impact level.
 */
function getImpactEmoji(impact: ImpactLevel): string {
    switch (impact) {
        case ImpactLevel.Minor:    return '🌿';
        case ImpactLevel.Moderate: return '🌳';
        case ImpactLevel.Major:    return '🌊';
        case ImpactLevel.Critical: return '💥';
        default:                   return '📝';
    }
}

/**
 * Tạo màu cho embed dựa trên impact level.
 */
function getImpactColor(impact: ImpactLevel): number {
    switch (impact) {
        case ImpactLevel.Minor:    return Colors.Green;
        case ImpactLevel.Moderate: return Colors.Blue;
        case ImpactLevel.Major:    return Colors.Purple;
        case ImpactLevel.Critical: return Colors.Red;
        default:                   return Colors.Grey;
    }
}

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('world-memory')
        .setDescription('Xem các sự kiện đã ảnh hưởng đến thế giới ECHO.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lenh nay chi duoc dung trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const { worldMemoryService } = getContainer();

        try {
            const state = await worldMemoryService.getMemoryState(interaction.guildId);
            const stats = await worldMemoryService.getStats(interaction.guildId);
            const activeMemories = await worldMemoryService.getActiveMemories(interaction.guildId);

            // Tạo embed chính
            const embed = new EmbedBuilder()
                .setTitle('🌍 World Memory — Ky Niem Cua The Gioi')
                .setDescription('The gioi ECHO nho moi hanh dong cua ban. Day la nhung su vua da xay ra...')
                .setColor(Colors.Gold)
                .setTimestamp()
                .setFooter({ text: 'ECHO — The world that remembers.' });

            // Thong ke
            embed.addFields(
                {
                    name: '📊 Thong Ke',
                    value: [
                        `**Tong so ky niem:** ${stats.totalMemories}`,
                        `**Dang hoat dong:** ${stats.activeMemories}`,
                        `**Anh huong tich cuc:** ${stats.positiveImpact}`,
                        `**Anh huong tieu cuc:** ${stats.negativeImpact}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '👥 Top Contributors',
                    value: stats.topContributors.length > 0
                        ? stats.topContributors.slice(0, 5).map((c, i) => 
                            `${i + 1}. <@${c.playerId}> — ${c.count} hanh dong`
                        ).join('\n')
                        : 'Chua co ai dong gop.',
                    inline: true,
                }
            );

            // Hien thi active memories
            if (activeMemories.length > 0) {
                const memoryList = activeMemories
                    .sort((a, b) => {
                        const impactOrder = {
                            [ImpactLevel.Critical]: 0,
                            [ImpactLevel.Major]: 1,
                            [ImpactLevel.Moderate]: 2,
                            [ImpactLevel.Minor]: 3,
                        };
                        return (impactOrder[a.impactLevel] || 4) - (impactOrder[b.impactLevel] || 4);
                    })
                    .slice(0, 10)
                    .map(m => {
                        const emoji = getImpactEmoji(m.impactLevel);
                        const timeAgo = getTimeAgo(m.occurredAt);
                        return `${emoji} **${m.description}**\n   _${timeAgo}_`;
                    })
                    .join('\n\n');

                embed.addFields({
                    name: `✨ Su Kien Gan Day (${activeMemories.length})`,
                    value: memoryList,
                    inline: false,
                });
            } else {
                embed.addFields({
                    name: '✨ Su Kien Gan Day',
                    value: 'Chua co su kien nao. Hay bat dau tuong tac voi the gioi!',
                    inline: false,
                });
            }

            await interaction.editReply({
                embeds: [embed],
            });

        } catch (error) {
            console.error('[ECHO World Memory Command] Error:', error);
            await interaction.editReply({
                content: 'Da xay ra loi khi lay thong tin World Memory!'
            });
        }
    },
};

/**
 * Tinh thoi gian truoc day.
 */
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} ngay truoc`;
    if (diffHours > 0) return `${diffHours} gio truoc`;
    if (diffMins > 0) return `${diffMins} phut truoc`;
    return 'Vua moi';
}

export default command;
