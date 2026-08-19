// ============================================================
// ECHO — Slash Command: /profile
// Hiển thị thông tin trạng thái nhân vật của người chơi.
// Spec ref: Section 10 (Personal Progression), 13 (Streak), 16 (Memory)
// ============================================================

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Colors,
} from 'discord.js';
import { Command } from '../types';
import { getContainer } from '../../../bootstrap';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Xem thông tin nhân vật của bạn trong thế giới ECHO.'),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        
        // Sử dụng Service Locator pattern để lấy PlayerService từ Container
        const { playerService } = getContainer();
        const player = await playerService.getPlayer(userId);

        // Tính thanh tiến trình kinh nghiệm (XP progress bar)
        const xpNeeded = playerService.getXpNeededForLevel(player.level);
        const xpPercent = Math.min(100, Math.floor((player.xp / xpNeeded) * 100));
        
        // Tạo thanh progress bar thị giác: 10 ô
        const filledBlocks = Math.floor(xpPercent / 10);
        const emptyBlocks = 10 - filledBlocks;
        const progressBar = '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks);

        // Tạo chuỗi streak thị giác
        const streakEmoji = player.streak.current >= 7 ? '🔥' : '✨';
        const protectionStatus = player.streak.protectionActive ? '🛡️ Sẵn sàng' : '❌ Đã dùng';

        // Tóm tắt hành trang
        const totalItems = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
        const uniqueItems = player.inventory.length;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle(`🎭 Nhân Vật: Level ${player.level}`)
            .setDescription(`Trạng thái: **${player.currentState.toUpperCase()}**`)
            .addFields(
                { 
                    name: `📈 Kinh Nghiệm: ${player.xp} / ${xpNeeded} XP (${xpPercent}%)`, 
                    value: `\`${progressBar}\``, 
                    inline: false 
                },
                { 
                    name: '💰 Tài Sản', 
                    value: `🪙 **${player.currency.toLocaleString()}** Gold`, 
                    inline: true 
                },
                { 
                    name: `${streakEmoji} Streak Hiện Tại`, 
                    value: `📅 **${player.streak.current}** ngày\n(Kỷ lục: **${player.streak.max}** ngày)`, 
                    inline: true 
                },
                { 
                    name: '🛡️ Bảo Vệ Streak', 
                    value: protectionStatus, 
                    inline: true 
                },
                { 
                    name: '🎒 Hành Trang', 
                    value: `Tổng số vật phẩm: **${totalItems}** (loại khác nhau: **${uniqueItems}**)\nGõ \`/inventory\` để xem chi tiết.`, 
                    inline: false 
                }
            )
            .setColor(Colors.Green)
            .setTimestamp(player.lastUpdatedAt)
            .setFooter({ text: 'ECHO — The world that remembers.' });

        await interaction.editReply({ embeds: [embed] });
    },
};

export default command;
