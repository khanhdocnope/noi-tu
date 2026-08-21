// ============================================================
// ECHO — Slash Command: /explore
// Hệ thống thám hiểm: chọn region, khám phá, tìm items/combat.
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

function hpBar(hp: number, max: number, length: number = 10): string {
    const filled = Math.min(Math.floor((hp / max) * length), length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
}

const EVENT_EMOJI: Record<string, string> = {
    combat: '⚔️',
    item: '🎁',
    treasure: '💰',
    discovery: '🔍',
    trap: '⚠️',
    rest: '🏕️',
    nothing: '📭',
    npc: '👤',
};

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Thám hiểm thế giới ECHO')
        .addSubcommand(sub =>
            sub
                .setName('list')
                .setDescription('Xem các region có thể thám hiểm')
        )
        .addSubcommand(sub =>
            sub
                .setName('start')
                .setDescription('Bắt đầu thám hiểm')
                .addStringOption(opt =>
                    opt
                        .setName('region')
                        .setDescription('Region muốn thám hiểm')
                        .setRequired(true)
                        .addChoices(
                            { name: '🌲 Rừng Rậm', value: 'forest' },
                            { name: '🕳️ Hang Đá', value: 'cave' },
                            { name: '🏚️ Tàn Tích', value: 'ruins' },
                            { name: '🌫️ Đầm Lầy', value: 'swamp' },
                        )
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('continue')
                .setDescription('Tiếp tục thám hiểm (sau lần đầu)')
        )
        .addSubcommand(sub =>
            sub
                .setName('stop')
                .setDescription('Kết thúc exploration session')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ dùng trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        const { explorationService, combatService } = getContainer();
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        // ── /explore list ──────────────────────────────────
        if (subcommand === 'list') {
            await interaction.deferReply();
            const regions = await explorationService.getAvailableRegions(userId);
            const session = explorationService.getSession(userId);

            const embed = new EmbedBuilder()
                .setTitle('🗺️ Regions — Chọn Nơi Thám Hiểm')
                .setDescription('Chọn region phù hợp với level của bạn.')
                .setColor(Colors.Blue)
                .setTimestamp();

            for (const region of regions) {
                embed.addFields({
                    name: region.name,
                    value: `${region.description}\n_Yêu cầu: Level ${region.minLevel}_`,
                    inline: false,
                });
            }

            if (session) {
                embed.addFields({
                    name: '⚠️ Đang thám hiểm',
                    value: `Session active tại **${session.regionId}** (${session.explorationCount} lần)`,
                    inline: false,
                });
            }

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // ── /explore start ─────────────────────────────────
        if (subcommand === 'start') {
            const regionId = interaction.options.getString('region', true);
            await interaction.deferReply();

            try {
                const result = await explorationService.startExploration(userId, regionId);
                await sendExplorationResult(interaction, result, userId);
            } catch (error) {
                await interaction.editReply({
                    content: `❌ ${error instanceof Error ? error.message : 'Lỗi'}`,
                });
            }
            return;
        }

        // ── /explore continue ──────────────────────────────
        if (subcommand === 'continue') {
            await interaction.deferReply();

            try {
                const result = await explorationService.continueExploration(userId);
                await sendExplorationResult(interaction, result, userId);
            } catch (error) {
                await interaction.editReply({
                    content: `❌ ${error instanceof Error ? error.message : 'Lỗi'}`,
                });
            }
            return;
        }

        // ── /explore stop ──────────────────────────────────
        if (subcommand === 'stop') {
            const session = explorationService.endExploration(userId);

            if (!session) {
                await interaction.reply({ content: 'Không có session nào đang active.', flags: MessageFlags.Ephemeral });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🏁 Kết Thúc Thám Hiểm')
                .setDescription(`Đã thám hiểm **${session.regionId}** ${session.explorationCount} lần.`)
                .addFields(
                    { name: '💰 Gold tìm được', value: `**${session.totalGold}**`, inline: true },
                    { name: '🎁 Items tìm được', value: session.totalItems.length > 0 ? session.totalItems.map(i => `${i.itemName} x${i.amount}`).join(', ') : 'Không có', inline: true },
                    { name: '🔍 Discoveries', value: session.discoveries.length > 0 ? session.discoveries.join(', ') : 'Không có', inline: true },
                )
                .setColor(Colors.Gold)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }
    },
};

// ── Helper ──────────────────────────────────────────────────

async function sendExplorationResult(interaction: ChatInputCommandInteraction, result: any, userId: string): Promise<void> {
    const emoji = EVENT_EMOJI[result.event.type] || '❓';
    const { combatService } = getContainer();

    const embed = new EmbedBuilder()
        .setTitle(`${emoji} Thám Hiểm — ${result.regionId}`)
        .setDescription(result.description)
        .addFields(
            { name: '❤️ HP', value: `\`${hpBar(result.hpAfter, 100)}\` **${result.hpBefore} → ${result.hpAfter}**`, inline: false },
        )
        .setColor(result.event.type === 'combat' ? Colors.Red : Colors.Green)
        .setTimestamp();

    if (result.goldGained > 0) {
        embed.addFields({ name: '💰 Gold', value: `**+${result.goldGained}**`, inline: true });
    }

    if (result.itemsGained.length > 0) {
        embed.addFields({
            name: '🎁 Items',
            value: result.itemsGained.map((i: any) => `**${i.itemName}** x${i.amount}`).join('\n'),
            inline: true,
        });
    }

    if (result.xpGained > 0) {
        embed.addFields({ name: '📈 XP', value: `**+${result.xpGained}**`, inline: true });
    }

    if (result.discovery) {
        embed.addFields({ name: '🔍 Discovery', value: `**${result.discovery}**`, inline: false });
    }

    // Nếu là combat → hiển thị combat UI
    if (result.event.type === 'combat') {
        const encounter = combatService.getEncounter(userId);
        if (encounter) {
            const enemy = encounter.enemy;
            embed.addFields({
                name: `⚔️ Combat: ${enemy.name}`,
                value: `\`${hpBar(enemy.hp, enemy.maxHp)}\` **${enemy.hp}/${enemy.maxHp}**`,
                inline: false,
            });

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`combat:attack:${userId}`).setLabel('⚔️ Tấn công').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`combat:defend:${userId}`).setLabel('🛡️ Phòng thủ').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`combat:escape:${userId}`).setLabel('🏃 Thoát').setStyle(ButtonStyle.Primary),
            );

            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
        }
    }

    // Buttons tiếp tục / dừng
    if (result.canContinue) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`explore:continue:${userId}`).setLabel('🔍 Tiếp tục').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`explore:stop:${userId}`).setLabel('🏠 Dừng').setStyle(ButtonStyle.Secondary),
        );
        await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
        await interaction.editReply({ embeds: [embed], components: [] });
    }
}

export default command;
