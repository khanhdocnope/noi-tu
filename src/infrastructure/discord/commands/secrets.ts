// ============================================================
// ECHO — Slash Command: /secrets
// Hiển thị Curiosity State: Mysteries, Secrets, Clues, Score/Rank.
// Spec ref: Curiosity Hooks
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
import { CuriosityRank, MysteryStatus } from '../../../core/curiosity/CuriosityHooksTypes';
import { getMysteryById, getSecretById } from '../../../core/curiosity/CuriosityContentConfig';

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

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('secrets')
        .setDescription('Xem các bí ẩn, manh mối, và bí mật bạn đã khám phá.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ được dùng trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const { curiosityService } = getContainer();

        try {
            const stats = await curiosityService.getCuriosityStats(interaction.user.id);
            const activeMysteries = await curiosityService.getActiveMysteries(interaction.user.id);
            const solvedMysteries = await curiosityService.getSolvedMysteries(interaction.user.id);
            const foundSecrets = await curiosityService.getFoundSecrets(interaction.user.id);
            const collectedClues = await curiosityService.getCluesForMystery(interaction.user.id, '');

            // Tạo embed chính
            const embed = new EmbedBuilder()
                .setTitle('🔮 Curiosity — Những Bí Ẩn Đã Khám Phá')
                .setDescription('Thế giới ECHO ẩn chứa nhiều bí ẩn. Bạn đã khám phá được bao nhiêu?')
                .setColor(Colors.Purple)
                .setTimestamp()
                .setFooter({ text: 'ECHO — Curiosity never sleeps.' });

            // Thống kê & Rank
            const rankEmoji = getRankEmoji(stats.rank);
            const rankName = getRankName(stats.rank);

            embed.addFields(
                {
                    name: `${rankEmoji} Thứ Hạng`,
                    value: [
                        `**Rank:** ${rankName}`,
                        `**Điểm curiosity:** ${stats.score}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '📊 Thống Kê',
                    value: [
                        `**Mystery đã phát hiện:** ${stats.mysteriesDiscovered}`,
                        `**Mystery đã giải:** ${stats.mysteriesSolved}`,
                        `**Secret đã tìm:** ${stats.secretsFound}`,
                        `**Clue đã thu thập:** ${stats.cluesCollected}`,
                        `**Chain hoàn thành:** ${stats.chainsCompleted}`,
                    ].join('\n'),
                    inline: true,
                }
            );

            // Mystery đang active
            if (activeMysteries.length > 0) {
                const mysteryList = activeMysteries
                    .slice(0, 5)
                    .map(m => {
                        const mysteryData = getMysteryById(m.mysteryId);
                        const scaleEmoji = mysteryData?.scale === 'micro' ? '🔸' : 
                                          mysteryData?.scale === 'short_term' ? '🔶' : 
                                          mysteryData?.scale === 'medium_term' ? '🔷' : '⭐';
                        return `${scaleEmoji} **${mysteryData?.name || m.mysteryId}**\n   _${mysteryData?.signal || 'Chưa rõ'}_`;
                    })
                    .join('\n\n');

                embed.addFields({
                    name: `🔍 Mystery Đang Active (${activeMysteries.length})`,
                    value: mysteryList,
                    inline: false,
                });
            }

            // Secret đã tìm
            if (foundSecrets.length > 0) {
                const secretList = foundSecrets
                    .slice(0, 5)
                    .map(s => {
                        const secretData = getSecretById(s.secretId);
                        return `🗝️ **${secretData?.name || s.secretId}**`;
                    })
                    .join('\n');

                embed.addFields({
                    name: `🔐 Bí Mật Đã Tìm Thấy (${foundSecrets.length})`,
                    value: secretList,
                    inline: false,
                });
            }

            // Mystery đã giải
            if (solvedMysteries.length > 0) {
                const solvedList = solvedMysteries
                    .slice(0, 5)
                    .map(m => {
                        const mysteryData = getMysteryById(m.mysteryId);
                        return `✅ **${mysteryData?.name || m.mysteryId}**`;
                    })
                    .join('\n');

                embed.addFields({
                    name: `🏆 Mystery Đã Giải (${solvedMysteries.length})`,
                    value: solvedList,
                    inline: false,
                });
            }

            await interaction.editReply({
                embeds: [embed],
            });

        } catch (error) {
            console.error('[ECHO Secrets Command] Error:', error);
            await interaction.editReply({
                content: 'Đã xảy ra lỗi khi lấy thông tin Curiosity!'
            });
        }
    },
};

export default command;
