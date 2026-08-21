// ============================================================
// ECHO — Slash Command: /combat
// Hệ thống combat: xem stats, bắt đầu fight, hành động.
// ============================================================

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    Colors,
    MessageFlags,
} from 'discord.js';
import { Command } from '../types';
import { getContainer } from '../../../bootstrap';
import { UI_COLORS, hpBar, hpText, withFooter, STAT_EMOJI, errorEmbed, buildButton } from '../ui-helpers';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('combat')
        .setDescription('Hệ thống combat ECHO')
        .addSubcommand(sub =>
            sub.setName('stats').setDescription('Xem combat stats')
        )
        .addSubcommand(sub =>
            sub.setName('fight').setDescription('Bắt đầu combat ngẫu nhiên')
        )
        .addSubcommand(sub =>
            sub.setName('heal').setDescription('Full heal (costs 50 gold)')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ dùng trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        const { combatService, playerService } = getContainer();
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        // ── /combat stats ─────────────────────────────────
        if (subcommand === 'stats') {
            await interaction.deferReply();
            const stats = await combatService.getPlayerStats(userId);
            const player = await playerService.getPlayer(userId);
            const encounter = combatService.getEncounter(userId);

            const embed = new EmbedBuilder()
                .setTitle('Combat Stats')
                .addFields(
                    { name: `${STAT_EMOJI.hp} HP`, value: hpText(stats.hp, stats.maxHp), inline: true },
                    { name: `${STAT_EMOJI.attack} ATK`, value: `**${stats.attack}**`, inline: true },
                    { name: `${STAT_EMOJI.defense} DEF`, value: `**${stats.defense}**`, inline: true },
                    { name: `${STAT_EMOJI.speed} SPD`, value: `**${stats.speed}**`, inline: true },
                )
                .setColor(UI_COLORS.Info)
                .setTimestamp();

            withFooter(embed, player);

            if (encounter) {
                embed.addFields({
                    name: '⚠️ Đang trong combat',
                    value: `Đang fight: **${encounter.enemy.name}**`,
                    inline: false,
                });
            }

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // ── /combat fight ─────────────────────────────────
        if (subcommand === 'fight') {
            await interaction.deferReply();

            try {
                const encounter = await combatService.startEncounter(userId);
                const enemy = encounter.enemy;
                const player = await playerService.getPlayer(userId);

                const embed = new EmbedBuilder()
                    .setTitle(`⚔️ ${enemy.name}`)
                    .setDescription(enemy.description)
                    .addFields(
                        { name: 'Enemy HP', value: hpText(enemy.hp, enemy.maxHp), inline: true },
                        { name: 'Your HP', value: hpText(player.combat.hp, player.combat.maxHp), inline: true },
                    )
                    .setColor(UI_COLORS.Danger)
                    .setTimestamp();

                withFooter(embed, player);

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    buildButton(`combat:attack:${userId}`, 'Tấn công', 'danger'),
                    buildButton(`combat:defend:${userId}`, 'Phòng thủ', 'secondary'),
                    buildButton(`combat:escape:${userId}`, 'Thoát', 'primary'),
                );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } catch (error) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed('Lỗi Combat', error instanceof Error ? error.message : 'Không thể bắt đầu combat'),
                    ],
                });
            }
            return;
        }

        // ── /combat heal ──────────────────────────────────
        if (subcommand === 'heal') {
            await interaction.deferReply();
            const player = await playerService.getPlayer(userId);

            if (player.currency < 50) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed('Không đủ Gold', `Cần **50 Gold** để heal. Bạn có **${player.currency} Gold**.`),
                    ],
                });
                return;
            }

            if (player.combat.hp >= player.combat.maxHp) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed('HP đã đầy', `HP: **${player.combat.hp}/${player.combat.maxHp}**`),
                    ],
                });
                return;
            }

            await playerService.modifyCurrency(userId, -50);
            await combatService.fullHeal(userId);

            const embed = new EmbedBuilder()
                .setTitle('Healed!')
                .setDescription(`HP đã hồi đầy. (-50 Gold)`)
                .addFields(
                    { name: 'HP', value: hpText(player.combat.maxHp, player.combat.maxHp), inline: true },
                    { name: 'Gold', value: `**${player.currency - 50}**`, inline: true },
                )
                .setColor(UI_COLORS.Success)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            return;
        }
    },
};

export default command;
