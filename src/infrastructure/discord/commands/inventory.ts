// ============================================================
// ECHO — Slash Command: /inventory
// Hiển thị chi tiết hành trang của người chơi.
// Spec ref: Section 10 (Personal Progression), 16 (Memory)
// ============================================================

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Colors,
} from 'discord.js';
import { Command } from '../types';
import { getContainer } from '../../../bootstrap';
import { PlayerItem } from '../../../core/player/PlayerStateTypes';

// Nhóm items theo type để hiển thị
const ITEM_TYPE_CONFIG: Record<PlayerItem['type'], { label: string; emoji: string }> = {
    resource:   { label: 'Tài Nguyên',   emoji: '🪨' },
    key:        { label: 'Chìa Khóa',    emoji: '🔑' },
    usable:     { label: 'Có Thể Dùng',  emoji: '🧪' },
    equipment:  { label: 'Trang Bị',     emoji: '⚔️' },
};

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Xem chi tiết hành trang của bạn.'),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const { playerService } = getContainer();
        const player = await playerService.getPlayer(userId);

        // Nếu inventory trống
        if (player.inventory.length === 0) {
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTitle('🎒 Hành Trang')
                .setDescription('Hành trang trống.\nHãy tham gia các **Opportunity** để nhận vật phẩm!')
                .setColor(Colors.Grey)
                .setTimestamp()
                .setFooter({ text: 'ECHO — The world that remembers.' });

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Nhóm items theo type
        const grouped: Record<string, PlayerItem[]> = {};
        for (const item of player.inventory) {
            if (!grouped[item.type]) {
                grouped[item.type] = [];
            }
            grouped[item.type].push(item);
        }

        // Tính tổng
        const totalItems = player.inventory.reduce((sum, item) => sum + item.quantity, 0);

        // Tạo embed chính
        const embed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle('🎒 Hành Trang Chi Tiết')
            .setDescription(`Tổng cộng: **${totalItems}** vật phẩm (${player.inventory.length} loại)`)
            .setColor(Colors.Gold)
            .setTimestamp()
            .setFooter({ text: 'ECHO — The world that remembers.' });

        // Thêm field cho mỗi nhóm
        for (const [type, config] of Object.entries(ITEM_TYPE_CONFIG)) {
            const items = grouped[type];
            if (!items || items.length === 0) continue;

            const itemList = items
                .map(item => `${config.emoji} **${item.name}** × ${item.quantity}`)
                .join('\n');

            embed.addFields({
                name: `${config.label} (${items.length})`,
                value: itemList,
                inline: false,
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};

export default command;
