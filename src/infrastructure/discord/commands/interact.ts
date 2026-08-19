// ============================================================
// ECHO — Slash Command: /interact
// Kích hoạt Cơ hội hàng ngày cho người chơi.
// Spec ref: Section 5 (Daily Opportunity), 8 (Context), 12 (Maybe Tomorrow)
// ============================================================

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Colors,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import { Command } from '../types';
import { getContainer } from '../../../bootstrap';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('interact')
        .setDescription('Tìm cơ hội tương tác với thế giới ECHO hôm nay.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ dùng được trong server!', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const { opportunityService } = getContainer();

        try {
            const opp = await opportunityService.getOrRollOpportunity(userId, guildId);

            const embed = new EmbedBuilder()
                .setTitle(`✨ Cơ Hội Hôm Nay: ${opp.title}`)
                .setDescription(opp.description)
                .setColor(Colors.Gold)
                .setTimestamp()
                .setFooter({ text: 'ECHO — Hãy đưa ra lựa chọn của bạn.' });

            const row = new ActionRowBuilder<ButtonBuilder>();
            
            for (const choice of opp.choices) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`opp_choice:${userId}:${opp.id}:${choice.id}`)
                        .setLabel(choice.text)
                        .setStyle(ButtonStyle.Primary)
                );
            }

            await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

        } catch (error: any) {
            if (error.message === 'TODAY_COMPLETED') {
                const embed = new EmbedBuilder()
                    .setTitle('⏳ Ngày mai sẽ có cơ hội khác...')
                    .setDescription('Bạn đã hoàn thành cơ hội tương tác của ngày hôm nay rồi.\n\n*Một ngày mới tại thế giới ECHO sẽ mang tới những điều bất ngờ mới! Hãy kiên nhẫn.*')
                    .setColor(Colors.DarkOrange)
                    .setFooter({ text: 'ECHO — The world that remembers.' });

                await interaction.editReply({ embeds: [embed] });
            } else {
                console.error('[ECHO Interact Command] Error:', error);
                await interaction.editReply({
                    content: 'Đã xảy ra lỗi khi tạo cơ hội tương tác. Vui lòng thử lại sau!'
                });
            }
        }
    },
};

export default command;
