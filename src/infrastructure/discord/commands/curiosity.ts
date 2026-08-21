// ============================================================
// ECHO — Slash Command: /curiosity
// Thống kê tò mò: Curiosity Score, Rank, Mysteries, Secrets.
// Spec ref: Curiosity Hooks — Score & Rank System
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
import { CuriosityRank } from '../../../core/curiosity/CuriosityHooksTypes';
import { RANK_THRESHOLDS } from '../../../core/curiosity/CuriosityHooksTypes';

/**
 * Tạo emoji cho rank.
 */
function getRankEmoji(rank: CuriosityRank): string {
    switch (rank) {
        case CuriosityRank.Indifferent:    return '😐';
        case CuriosityRank.Curious:        return '🤔';
        case CuriosityRank.Inquisitive:    return '🔍';
        case CuriosityRank.Explorer:       return '🧭';
        case CuriosityRank.SecretHunter:   return '🗝️';
        case CuriosityRank.Codebreaker:    return '🔓';
        case CuriosityRank.CuriosityMaster:return '👁️';
        default:                           return '❓';
    }
}

/**
 * Tạo tên hiển thị cho rank.
 */
function getRankName(rank: CuriosityRank): string {
    switch (rank) {
        case CuriosityRank.Indifferent:    return 'Chưa Quan Tâm';
        case CuriosityRank.Curious:        return 'Tò Mò Nhẹ';
        case CuriosityRank.Inquisitive:    return 'Hay Tò Mò';
        case CuriosityRank.Explorer:       return 'Nhà Thám Hiểm';
        case CuriosityRank.SecretHunter:   return 'Thợ Săn Bí Mật';
        case CuriosityRank.Codebreaker:    return 'Giải Mã Viên';
        case CuriosityRank.CuriosityMaster:return 'Bậc Thầy Tò Mò';
        default:                           return 'Không Xác Định';
    }
}

/**
 * Tính progress bar.
 */
function getProgressBar(current: number, max: number, length: number = 10): string {
    const filled = Math.min(Math.floor((current / max) * length), length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('curiosity')
        .setDescription('Xem thống kê tò mò: score, rank, và tiến trình khám phá.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ được dùng trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const { curiosityService } = getContainer();

        try {
            const stats = await curiosityService.getCuriosityStats(interaction.user.id);
            const rankEmoji = getRankEmoji(stats.rank);
            const rankName = getRankName(stats.rank);

            // Tính rank tiếp theo
            const rankOrder = [
                CuriosityRank.Indifferent,
                CuriosityRank.Curious,
                CuriosityRank.Inquisitive,
                CuriosityRank.Explorer,
                CuriosityRank.SecretHunter,
                CuriosityRank.Codebreaker,
                CuriosityRank.CuriosityMaster,
            ];
            const currentRankIndex = rankOrder.indexOf(stats.rank);
            const nextRank = currentRankIndex < rankOrder.length - 1 
                ? rankOrder[currentRankIndex + 1] 
                : null;
            const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : null;

            // Tạo embed chính
            const embed = new EmbedBuilder()
                .setTitle(`${rankEmoji} Curiosity — Thống Kê Tò Mò`)
                .setDescription(`Bạn đang ở rank **${rankName}** với **${stats.score}** điểm curiosity.`)
                .setColor(Colors.Purple)
                .setTimestamp()
                .setFooter({ text: 'ECHO — Curiosity never sleeps.' });

            // Rank & Progress
            if (nextThreshold !== null) {
                const progress = getProgressBar(stats.score, nextThreshold, 15);
                const nextRankName = getRankName(nextRank!);
                embed.addFields({
                    name: '📊 Tiến Trình Rank',
                    value: [
                        `${rankEmoji} **${rankName}** — ${stats.score} điểm`,
                        `\`${progress}\``,
                        `🎯 **${nextRankName}** — ${nextThreshold} điểm`,
                    ].join('\n'),
                    inline: false,
                });
            } else {
                embed.addFields({
                    name: '👑 Rank Cao Nhất',
                    value: `${rankEmoji} **${rankName}** — Bạn đã đạt rank tối đa!`,
                    inline: false,
                });
            }

            // Thống kê chi tiết
            embed.addFields(
                {
                    name: '🔍 Mysteries',
                    value: [
                        `**Phát hiện:** ${stats.mysteriesDiscovered}`,
                        `**Đã giải:** ${stats.mysteriesSolved}`,
                        `**Đang investigate:** ${stats.mysteriesDiscovered - stats.mysteriesSolved}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '🗝️ Secrets',
                    value: [
                        `**Đã tìm:** ${stats.secretsFound}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '🧩 Clues',
                    value: [
                        `**Đã thu thập:** ${stats.cluesCollected}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '⛓️ Chains',
                    value: [
                        `**Hoàn thành:** ${stats.chainsCompleted}`,
                        `**Đang thực hiện:** ${stats.activeChains}`,
                    ].join('\n'),
                    inline: true,
                }
            );

            // Bảng rank tham khảo
            embed.addFields({
                name: '📋 Bảng Rank',
                value: [
                    `😐 Chưa Quan Tâm — 0+`,
                    `🤔 Tò Mò Nhẹ — ${RANK_THRESHOLDS[CuriosityRank.Curious]}+`,
                    `🔍 Hay Tò Mò — ${RANK_THRESHOLDS[CuriosityRank.Inquisitive]}+`,
                    `🧭 Nhà Thám Hiểm — ${RANK_THRESHOLDS[CuriosityRank.Explorer]}+`,
                    `🗝️ Thợ Săn Bí Mật — ${RANK_THRESHOLDS[CuriosityRank.SecretHunter]}+`,
                    `🔓 Giải Mã Viên — ${RANK_THRESHOLDS[CuriosityRank.Codebreaker]}+`,
                    `👁️ Bậc Thầy Tò Mò — ${RANK_THRESHOLDS[CuriosityRank.CuriosityMaster]}+`,
                ].join('\n'),
                inline: false,
            });

            await interaction.editReply({
                embeds: [embed],
            });

        } catch (error) {
            console.error('[ECHO Curiosity Command] Error:', error);
            await interaction.editReply({
                content: 'Đã xảy ra lỗi khi lấy thông tin Curiosity!'
            });
        }
    },
};

export default command;
