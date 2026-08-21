// ============================================================
// ECHO — Slash Command: /interact
// Kích hoạt Cơ hội hàng ngày cho người chơi.
// Spec ref: Section 5 (Daily Opportunity), 8 (Context), 12 (Maybe Tomorrow)
// Cải thiện: Hiển thị tiến độ daily (slot X/Y), hỗ trợ chain.
// ============================================================

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    MessageFlags,
} from 'discord.js';
import { Command } from '../types';
import { getContainer } from '../../../bootstrap';
import { OpportunityResult } from '../../../core/opportunity/OpportunityService';
import { Opportunity } from '../../../core/opportunity/OpportunityTypes';
import { errorEmbed, UI_COLORS } from '../ui-helpers';

// ── Helpers ────────────────────────────────────────────────────

/**
 * Tạo ActionRow buttons cho một opportunity.
 */
function buildOpportunityButtons(userId: string, opportunity: Opportunity): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (const choice of opportunity.choices) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`opp_choice:${userId}:${opportunity.id}:${choice.id}`)
                .setLabel(choice.text)
                .setStyle(ButtonStyle.Primary)
        );
    }

    return row;
}

/**
 * Tạo embed hiển thị opportunity.
 */
function buildEmbed(result: OpportunityResult): EmbedBuilder {
    const { opportunity, isFirstOfTheDay, completedToday, remainingSlots } = result;

    // Progress indicator: "Slot 1/3"
    const totalSlots = completedToday + remainingSlots;
    const currentSlot = completedToday + 1;
    const slotText = `${currentSlot}/${totalSlots}`;

    const embed = new EmbedBuilder()
        .setTitle(`✨ ${opportunity.title}`)
        .setDescription(opportunity.description)
        .setColor(Colors.Gold)
        .setTimestamp()
        .setFooter({ text: `ECHO — Slot ${slotText} hôm nay` });

    // Thêm hint nếu là first of day
    if (isFirstOfTheDay) {
        embed.addFields({
            name: '🌅 Ngày mới bắt đầu',
            value: `Bạn còn **${remainingSlots}** cơ hội hôm nay.`,
            inline: true,
        });
    } else if (remainingSlots > 0) {
        embed.addFields({
            name: '💡 Tiếp tục',
            value: `Còn **${remainingSlots}** slot.`,
            inline: true,
        });
    }

    return embed;
}

/**
 * Tạo footer text hiển thị số slot còn lại.
 */
function getFooterText(hasMore: boolean, remaining: number): string {
    if (hasMore && remaining > 0) {
        return `ECHO — Còn ${remaining} slot hôm nay. Gõ /interact để tiếp tục!`;
    }
    return 'ECHO — The world that remembers.';
}

// ── Command ────────────────────────────────────────────────────

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('interact')
        .setDescription('Tìm cơ hội tương tác với thế giới ECHO.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ dùng được trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const userId = interaction.user.id;
        const { opportunityService } = getContainer();

        try {
            const result = await opportunityService.getOrRollOpportunity(userId, interaction.guildId);

            const embed = buildEmbed(result);
            const row = buildOpportunityButtons(userId, result.opportunity);

            await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

        } catch (error: any) {
            if (error.message === 'NO_SLOTS') {
                const embed = new EmbedBuilder()
                    .setTitle('⏳ Hết slot hôm nay!')
                    .setDescription('Bạn đã hoàn thành tất cả cơ hội tương tác của ngày hôm nay.\n\n*Một ngày mới tại thế giới ECHO sẽ mang tới những điều bất ngờ mới! Hãy kiên nhẫn.*')
                    .setColor(Colors.DarkOrange)
                    .setTimestamp()
                    .setFooter({ text: 'ECHO — The world that remembers.' });

                await interaction.editReply({ embeds: [embed] });
            } else {
                console.error('[ECHO Interact Command] Error:', error);
                await interaction.editReply({
                    embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi tạo cơ hội tương tác. Vui lòng thử lại sau!')],
                });
            }
        }
    },
};

export default command;
