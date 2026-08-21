// ============================================================
// ECHO — Slash Command: /clues
// Hiển thị các manh mối (clues) đã thu thập và khả dụng.
// Spec ref: Curiosity Hooks — Clue System
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
import { CuriosityRank, CollectedClue } from '../../../core/curiosity/CuriosityHooksTypes';
import { getMysteryById, getClueById } from '../../../core/curiosity/CuriosityContentConfig';

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

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('clues')
        .setDescription('Xem các manh mối đã thu thập và tìm kiếm manh mối mới.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ được dùng trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const { curiosityService } = getContainer();

        try {
            const stats = await curiosityService.getCuriosityStats(interaction.user.id);
            const collectedClues = await curiosityService.getCluesForMystery(interaction.user.id, '');
            const availableClues = await curiosityService.getAvailableClues(interaction.user.id, interaction.guildId);

            // Tạo embed chính
            const embed = new EmbedBuilder()
                .setTitle('🔍 Clues — Manh Mối Đã Thu Thập')
                .setDescription('Thế giới ECHO ẩn chứa nhiều manh mối. Bạn đã tìm được bao nhiêu?')
                .setColor(Colors.Blue)
                .setTimestamp()
                .setFooter({ text: 'ECHO — Every clue tells a story.' });

            // Thống kê
            const rankEmoji = getRankEmoji(stats.rank);
            embed.addFields({
                name: `${rankEmoji} Thống Kê`,
                value: [
                    `**Clue đã thu thập:** ${stats.cluesCollected}`,
                    `**Mystery đang investigate:** ${stats.mysteriesDiscovered - stats.mysteriesSolved}`,
                ].join('\n'),
                inline: true,
            });

            // Clue khả dụng (mới)
            if (availableClues.length > 0) {
                const availableList = availableClues
                    .slice(0, 5)
                    .map(clue => {
                        const mysteryData = getMysteryById(clue.mysteryId);
                        return `🆕 **${clue.description.slice(0, 80)}...**\n   _Mystery: ${mysteryData?.name || clue.mysteryId}_`;
                    })
                    .join('\n\n');

                embed.addFields({
                    name: `✨ Manh Mới Available (${availableClues.length})`,
                    value: availableList,
                    inline: false,
                });
            }

            // Clue đã thu thập theo mystery
            if (collectedClues.length > 0) {
                // Group by mysteryId
                const grouped = new Map<string, CollectedClue[]>();
                for (const clue of collectedClues) {
                    const existing = grouped.get(clue.mysteryId) || [];
                    existing.push(clue);
                    grouped.set(clue.mysteryId, existing);
                }

                let clueIndex = 0;
                for (const [mysteryId, clues] of grouped) {
                    if (clueIndex >= 3) break; // Giới hạn 3 mystery sections

                    const mysteryData = getMysteryById(mysteryId);
                    const clueList = clues
                        .map(c => {
                            const clueData = getClueById(c.clueId);
                            return `• **${clueData?.description?.slice(0, 60) || c.clueId}**`;
                        })
                        .join('\n');

                    embed.addFields({
                        name: `📚 ${mysteryData?.name || mysteryId} (${clues.length} clues)`,
                        value: clueList,
                        inline: false,
                    });

                    clueIndex++;
                }
            }

            // Nếu không có clue nào
            if (collectedClues.length === 0 && availableClues.length === 0) {
                embed.addFields({
                    name: '📭 Chưa Có Manh Mối',
                    value: 'Bạn chưa thu thập manh mối nào. Hãy khám phá thế giới để tìm clues!',
                    inline: false,
                });
            }

            await interaction.editReply({
                embeds: [embed],
            });

        } catch (error) {
            console.error('[ECHO Clues Command] Error:', error);
            await interaction.editReply({
                content: 'Đã xảy ra lỗi khi lấy thông tin Clues!'
            });
        }
    },
};

export default command;
