import { Events, Interaction, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { DiscordEvent } from '../types';
import { getContainer } from '../../../bootstrap';
import { ChoiceResult } from '../../../core/opportunity/OpportunityService';
import { Opportunity } from '../../../core/opportunity/OpportunityTypes';

/**
 * Tạo icon cho tag kết quả.
 */
function getTagEmoji(tag: string): string {
    switch (tag) {
        case 'success':  return '✅';
        case 'failure':  return '❌';
        case 'partial':  return '⚠️';
        case 'critical': return '💥';
        default:         return '🎲';
    }
}

/**
 * Tạo màu cho embed dựa trên tag.
 */
function getTagColor(tag: string): number {
    switch (tag) {
        case 'success':  return Colors.Green;
        case 'failure':  return Colors.Red;
        case 'partial':  return Colors.Yellow;
        case 'critical': return Colors.Purple;
        default:         return Colors.Grey;
    }
}

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
 * Tạo footer text hiển thị số slot còn lại.
 */
function getFooterText(hasMore: boolean, remaining: number): string {
    if (hasMore && remaining > 0) {
        return `ECHO — Còn ${remaining} slot hôm nay. Gõ /interact để tiếp tục!`;
    }
    return 'ECHO — The world that remembers.';
}

const event: DiscordEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        // 1. Xử lý Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`[ECHO Handler] No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('[ECHO Handler] Command execution error:', error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Có lỗi xảy ra khi thực hiện lệnh!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'Có lỗi xảy ra khi thực hiện lệnh!', flags: MessageFlags.Ephemeral });
                }
            }
            return;
        }

        // 2. Xử lý click Button (Lựa chọn Cơ hội Hàng ngày)
        if (interaction.isButton()) {
            const customId = interaction.customId;
            if (customId.startsWith('opp_choice:')) {
                const [, targetUserId, oppId, choiceId] = customId.split(':');

                // Chỉ cho phép người sở hữu cơ hội thực hiện lựa chọn
                if (interaction.user.id !== targetUserId) {
                    await interaction.reply({
                        content: '⚠️ Lựa chọn này không dành cho bạn! Hãy gõ `/interact` để tìm cơ hội của riêng mình.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                await interaction.deferUpdate();

                const { opportunityService } = getContainer();

                try {
                    const result: ChoiceResult = await opportunityService.makeChoice(targetUserId!, choiceId!);
                    const { choice, resolvedOutcome, nextOpportunity, hasMoreOpportunities, remainingSlots } = result;

                    // Xây dựng danh sách phần thưởng trực quan
                    const rewardList: string[] = [];
                    for (const r of resolvedOutcome.rewards) {
                        if (r.type === 'xp') {
                            rewardList.push(`📈 **+${r.amount}** XP`);
                        } else if (r.type === 'currency') {
                            const sign = r.amount && r.amount > 0 ? '+' : '';
                            rewardList.push(`🪙 **${sign}${r.amount}** Gold`);
                        } else if (r.type === 'item') {
                            rewardList.push(`🎒 **+${r.amount}** ${r.itemName}`);
                        } else if (r.type === 'relationship') {
                            const sign = r.amount && r.amount > 0 ? '+' : '';
                            rewardList.push(`🤝 Thân thiết với **${r.targetId}**: **${sign}${r.amount}**`);
                        } else if (r.type === 'discovery') {
                            rewardList.push(`🔑 Khám phá bí ẩn: **${r.targetId}**`);
                        }
                    }

                    const rewardText = rewardList.length > 0 
                        ? rewardList.join('\n') 
                        : '*Không có phần thưởng đặc biệt.*';

                    // Tạo tag display
                    const tagEmoji = getTagEmoji(resolvedOutcome.tag);
                    const tagColor = getTagColor(resolvedOutcome.tag);
                    const footerText = getFooterText(hasMoreOpportunities, remainingSlots);

                    // Nếu có chain opportunity → hiển thị opportunity tiếp theo
                    if (nextOpportunity) {
                        const chainEmbed = new EmbedBuilder()
                            .setTitle(`${tagEmoji} Kết Quả: ${choice.text}`)
                            .setDescription(resolvedOutcome.text)
                            .addFields({ name: '🎁 Phần Thưởng Nhận Được', value: rewardText, inline: false })
                            .setColor(Colors.Gold)
                            .setTimestamp()
                            .setFooter({ text: '⚡ Cơ hội mới đã mở ra...' });

                        // Thêm thông tin về cơ hội tiếp theo
                        chainEmbed.addFields({
                            name: `🔮 ${nextOpportunity.title}`,
                            value: nextOpportunity.description,
                            inline: false,
                        });

                        if (hasMoreOpportunities && remainingSlots > 0) {
                            chainEmbed.addFields({
                                name: '💡 Slot còn lại',
                                value: `**${remainingSlots}** slot`,
                                inline: true,
                            });
                        }

                        const components = [buildOpportunityButtons(targetUserId!, nextOpportunity)];

                        await interaction.editReply({
                            embeds: [chainEmbed],
                            components,
                        });
                    } else {
                        // Không có chain → hiển thị kết quả cuối cùng
                        const embed = new EmbedBuilder()
                            .setTitle(`${tagEmoji} Kết Quả: ${choice.text}`)
                            .setDescription(resolvedOutcome.text)
                            .addFields({ name: '🎁 Phần Thưởng Nhận Được', value: rewardText, inline: false })
                            .setColor(tagColor)
                            .setTimestamp()
                            .setFooter({ text: footerText });

                        // Thêm hint nếu còn slot
                        if (hasMoreOpportunities && remainingSlots > 0) {
                            embed.addFields({
                                name: '💡 Tiếp tục?',
                                value: `Bạn còn **${remainingSlots}** slot. Gõ \`/interact\` để tìm cơ hội tiếp theo!`,
                                inline: false,
                            });
                        }

                        await interaction.editReply({
                            embeds: [embed],
                            components: [] // Xóa các ActionRow chứa Buttons
                        });
                    }

                } catch (error) {
                    console.error('[ECHO Handler] Button choice execution error:', error);
                    await interaction.followUp({
                        content: 'Đã xảy ra lỗi khi ghi nhận lựa chọn của bạn!',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // ── Combat Buttons ──────────────────────────────
            if (customId.startsWith('combat:')) {
                const [, action, targetUserId] = customId.split(':');

                if (interaction.user.id !== targetUserId) {
                    await interaction.reply({ content: '⚠️ Không phải combat của bạn!', flags: MessageFlags.Ephemeral });
                    return;
                }

                await interaction.deferUpdate();

                const { combatService } = getContainer();

                try {
                    if (action === 'escape') {
                        const result = await combatService.escape(targetUserId);
                        await updateCombatMessage(interaction, result, targetUserId);
                    } else {
                        const result = await combatService.performAction(targetUserId, { type: action as any });
                        await updateCombatMessage(interaction, result, targetUserId);
                    }
                } catch (error) {
                    await interaction.followUp({
                        content: `❌ ${error instanceof Error ? error.message : 'Lỗi combat'}`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // ── Exploration Buttons ─────────────────────────
            if (customId.startsWith('explore:')) {
                const [, action, targetUserId] = customId.split(':');

                if (interaction.user.id !== targetUserId) {
                    await interaction.reply({ content: '⚠️ Không phải exploration của bạn!', flags: MessageFlags.Ephemeral });
                    return;
                }

                await interaction.deferUpdate();

                const { explorationService } = getContainer();

                try {
                    if (action === 'stop') {
                        explorationService.endExploration(targetUserId);
                        await interaction.editReply({ content: 'Đã kết thúc exploration.', components: [] });
                    } else if (action === 'continue') {
                        const result = await explorationService.continueExploration(targetUserId);
                        // Re-use sendExplorationResult from explore command
                        await interaction.editReply({ content: `🔍 Tiếp tục thám hiểm... ${result.description}`, components: [] });
                    }
                } catch (error) {
                    await interaction.followUp({
                        content: `❌ ${error instanceof Error ? error.message : 'Lỗi exploration'}`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        }
    },
};

// ── Combat UI Helpers ──────────────────────────────────────

function hpBar(hp: number, max: number, length: number = 10): string {
    const filled = Math.min(Math.floor((hp / max) * length), length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
}

async function updateCombatMessage(interaction: any, encounter: any, userId: string): Promise<void> {
    const enemy = encounter.enemy;
    const lastLog = encounter.log[encounter.log.length - 1];

    const embed = new EmbedBuilder()
        .setTitle(`⚔️ Turn ${encounter.turn} — ${enemy.name}`)
        .setDescription(lastLog?.description || '...')
        .addFields(
            { name: `❤️ HP ${enemy.name}`, value: `\`${hpBar(enemy.hp, enemy.maxHp)}\` **${enemy.hp}/${enemy.maxHp}**`, inline: false },
        )
        .setColor(encounter.status === 'active' ? Colors.Orange : Colors.Gold)
        .setTimestamp();

    if (encounter.status !== 'active') {
        const statusText = encounter.status === 'victory' ? '🏆 **THẮNG!**' :
                          encounter.status === 'defeat' ? '💀 **THUA!**' : '🏃 **THOÁT!**';
        embed.addFields({ name: 'Kết quả', value: statusText, inline: false });
        await interaction.editReply({ embeds: [embed], components: [] });
    } else {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`combat:attack:${userId}`).setLabel('⚔️ Tấn công').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`combat:defend:${userId}`).setLabel('🛡️ Phòng thủ').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`combat:escape:${userId}`).setLabel('🏃 Thoát').setStyle(ButtonStyle.Primary),
        );
        await interaction.editReply({ embeds: [embed], components: [row] });
    }
}

export default event;
