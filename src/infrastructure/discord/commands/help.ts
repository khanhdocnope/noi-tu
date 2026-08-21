// ============================================================
// ECHO — Slash Command: /help
// Hướng dẫn người chơi mới cách tương tác với thế giới ECHO.
// Spec ref: Section 5 (Daily Opportunity), 33 (Daily Budget),
//           Curiosity Hooks
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

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hướng dẫn cách chơi ECHO'),

    async execute(interaction: ChatInputCommandInteraction) {
        const { playerService } = getContainer();
        const player = await playerService.getPlayer(interaction.user.id);

        const embed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle('📖 Hướng Dẫn ECHO')
            .setDescription('Chào mừng bạn đến với **ECHO** — Thế giới luôn ghi nhớ.\n\n*Each day brings a new opportunity. Every choice leaves a trace.*')
            .addFields(
                {
                    name: '🎮 Bắt Đầu',
                    value: [
                        '`/interact` — Nhận cơ hội hàng ngày',
                        '`/profile` — Xem thông tin nhân vật',
                        '`/inventory` — Xem hành trang',
                        '`/world` — Xem trạng thái thế giới',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '🔮 Curiosity',
                    value: [
                        '`/secrets` — Xem mysteries và secrets đã phát hiện',
                        '`/clues` — Xem manh mối đã thu thập',
                        '`/curiosity` — Thống kê tò mò & rank',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '⚙️ Quản Lý',
                    value: [
                        '`/help` — Xem hướng dẫn này',
                        '`/skip-day` — Bỏ qua ngày (Admin only)',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '🌍 Cách Chơi',
                    value: [
                        '**Mỗi ngày** bạn có **1-3 cơ hội** (tùy level) để tương tác với thế giới.',
                        '',
                        '• Gõ `/interact` để nhận cơ hội',
                        '• Chọn 1 trong các lựa chọn được đưa ra',
                        '• Nhận phần thưởng (XP, Gold, Items, Discoveries)',
                        '• Hành động của bạn **ảnh hưởng** đến thế giới',
                        '',
                        '**Chain Opportunities** — Một số lựa chọn mở ra cơ hội tiếp theo',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '📊 Thống Kê Của Bạn',
                    value: [
                        `**Level:** ${player.level}`,
                        `**Gold:** ${player.currency.toLocaleString()}`,
                        `**Streak:** ${player.streak.current} ngày`,
                        `**Items:** ${player.inventory.length} loại`,
                        `**Discoveries:** ${player.discoveries.length}`,
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '💡 Mẹo',
                    value: [
                        '• **Streak** — Đăng nhập mỗi ngày để nhận bonus',
                        '• **Hidden rewards** — Một số lựa chọn ẩn phần thưởng',
                        '• **Risk vs Reward** — Lựa chọn rủi ro thường có reward cao hơn',
                        '• **Curiosity** — Khám phá mysteries để nhận rank mới',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '🔗 Hệ Thống',
                    value: [
                        '**Weather** — Thời tiết thay đổi mỗi ngày',
                        '**Season** — Bốn mùa luân phiên (30 ngày/mùa)',
                        '**World Events** — Sự kiện toàn cầu (cùng nhau đóng góp)',
                        '**Discoveries** — Khám phá bí ẩn của thế giới',
                        '**World Memory** — Thế giới ghi nhớ hành động của bạn',
                    ].join('\n'),
                    inline: false,
                }
            )
            .setColor(Colors.Blurple)
            .setTimestamp()
            .setFooter({ text: 'ECHO — The world that remembers.' });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};

export default command;
