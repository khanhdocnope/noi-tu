import { Events, Interaction, EmbedBuilder, Colors } from 'discord.js';
import { DiscordEvent } from '../types';
import { getContainer } from '../../../bootstrap';

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
                    await interaction.followUp({ content: 'Có lỗi xảy ra khi thực hiện lệnh!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Có lỗi xảy ra khi thực hiện lệnh!', ephemeral: true });
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
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferUpdate();

                const { opportunityService } = getContainer();

                try {
                    const { choice, outcome } = await opportunityService.makeChoice(targetUserId!, choiceId!);

                    // Xây dựng danh sách phần thưởng trực quan
                    const rewardList: string[] = [];
                    for (const r of outcome.rewards) {
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

                    const embed = new EmbedBuilder()
                        .setTitle(`🎬 Kết Quả: ${choice.text}`)
                        .setDescription(outcome.text)
                        .addFields({ name: '🎁 Phần Thưởng Nhận Được', value: rewardText, inline: false })
                        .setColor(Colors.Green)
                        .setTimestamp()
                        .setFooter({ text: 'ECHO — Trạng thái thế giới đã ghi nhớ lựa chọn của bạn.' });

                    // Cập nhật lại tin nhắn ban đầu: Thay bằng kết quả và XÓA các nút bấm
                    await interaction.editReply({
                        embeds: [embed],
                        components: [] // Xóa các ActionRow chứa Buttons
                    });

                } catch (error) {
                    console.error('[ECHO Handler] Button choice execution error:', error);
                    await interaction.followUp({
                        content: 'Đã xảy ra lỗi khi ghi nhận lựa chọn của bạn!',
                        ephemeral: true
                    });
                }
            }
        }
    },
};

export default event;
