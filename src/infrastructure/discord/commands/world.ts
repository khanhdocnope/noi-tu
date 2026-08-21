// ============================================================
// ECHO — World State Slash Command
// Spec ref: Section 4, 7, 14
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
import { Weather, Season, RegionStatus } from '../../../core/world/WorldStateTypes';

const WEATHER_EMOJI: Record<Weather, string> = {
    [Weather.Clear]:    '☀️',
    [Weather.Rain]:     '🌧️',
    [Weather.Storm]:    '⛈️',
    [Weather.Fog]:      '🌫️',
    [Weather.Snow]:     '❄️',
    [Weather.Eclipse]:  '🌑',
    [Weather.Heatwave]: '🔥',
};

const SEASON_EMOJI: Record<Season, string> = {
    [Season.Spring]: '🌸',
    [Season.Summer]: '☀️',
    [Season.Autumn]: '🍂',
    [Season.Winter]: '⛄',
};

const REGION_STATUS_EMOJI: Record<RegionStatus, string> = {
    [RegionStatus.Active]:  '✅',
    [RegionStatus.Locked]:  '🔒',
    [RegionStatus.Anomaly]: '⚠️',
    [RegionStatus.Closed]:  '🚫',
};

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('world')
        .setDescription('Xem trạng thái thế giới ECHO của server hôm nay.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Lệnh này chỉ dùng được trong server!', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        // Sử dụng Service Locator pattern để lấy WorldStateService từ Container
        const { worldStateService } = getContainer();
        const world = await worldStateService.getWorld(interaction.guildId);

        const weatherEmoji = WEATHER_EMOJI[world.weather];
        const seasonEmoji  = SEASON_EMOJI[world.season];

        const regionList = world.regions
            .map(r => `${REGION_STATUS_EMOJI[r.status]} **${r.name}**`)
            .join('\n');

        let globalEventField = '*Không có sự kiện nào đang diễn ra.*';
        if (world.activeGlobalEvent) {
            const ev = world.activeGlobalEvent;
            const pct = Math.floor((ev.currentProgress / ev.requiredProgress) * 100);
            const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
            globalEventField = `**${ev.name}**\n\`${bar}\` ${pct}%\n${ev.currentProgress.toLocaleString()} / ${ev.requiredProgress.toLocaleString()}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🌍 Thế Giới ECHO — Ngày ${world.dayNumber}`)
            .setDescription(`${seasonEmoji} Mùa: **${world.season}**  •  ${weatherEmoji} Thời tiết: **${world.weather}**`)
            .addFields(
                { name: '🗺️ Các Khu Vực', value: regionList, inline: false },
                { name: '⚡ Sự Kiện Toàn Cầu', value: globalEventField, inline: false },
                { name: '🌟 World Level', value: `Cấp ${world.worldLevel}`, inline: true },
                { name: '💎 Tài Nguyên Chung', value: `${world.sharedResourcePool.toLocaleString()}`, inline: true },
            )
            .setColor(Colors.Blurple)
            .setTimestamp(world.lastUpdatedAt)
            .setFooter({ text: 'ECHO — The world that remembers.' });

        await interaction.editReply({ embeds: [embed] });
    },
};

export default command;
