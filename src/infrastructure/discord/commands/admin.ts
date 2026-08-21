// ============================================================
// ECHO — Slash Command: /admin
// Gom tất cả admin commands vào một nơi.
// /admin schedule status|timezone|speed|channel|toggle
// /admin skip-day [days]
// ============================================================

import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags,
    ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../types';
import { getContainer } from '../../../bootstrap';
import { isPrivilegedUser } from '../../config';
import { Season } from '../../../core/world/WorldStateTypes';
import { DAYS_PER_SEASON } from '../../scheduler/SeasonEngine';

const TIMEZONE_EXAMPLES = [
    'UTC',
    'Asia/Ho_Chi_Minh',
    'Asia/Tokyo',
    'America/New_York',
    'Europe/London',
    'Australia/Sydney',
];

const SEASON_NAMES: Record<string, string> = {
    [Season.Spring]: '🌸 Xuân',
    [Season.Summer]: '☀️ Hạ',
    [Season.Autumn]: '🍂 Thu',
    [Season.Winter]: '❄️ Đông',
};

const WEATHER_NAMES: Record<string, string> = {
    clear: '☀️ Quang đãng',
    rain: '🌧️ Mưa',
    storm: '⛈️ Bão',
    fog: '🌫️ Sương mù',
    snow: '❄️ Tuyết',
    eclipse: '🌑 Nguyệt thực',
    heatwave: '🔥 Nắng nóng',
};

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Lệnh quản trị ECHO')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // ── /admin schedule ────────────────────────────────
        .addSubcommandGroup(group =>
            group
                .setName('schedule')
                .setDescription('Quản lý lịch advanceDay()')
                .addSubcommand(sub =>
                    sub
                        .setName('status')
                        .setDescription('Xem lịch advanceDay() hiện tại')
                )
                .addSubcommand(sub =>
                    sub
                        .setName('timezone')
                        .setDescription('Đặt timezone cho server')
                        .addStringOption(opt =>
                            opt
                                .setName('timezone')
                                .setDescription('IANA timezone')
                                .setRequired(true)
                                .setChoices(
                                    ...TIMEZONE_EXAMPLES.map(tz => ({ name: tz, value: tz }))
                                )
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('speed')
                        .setDescription('Đặt tốc độ thế giới (1-24x)')
                        .addIntegerOption(opt =>
                            opt
                                .setName('speed')
                                .setDescription('Tốc độ (mặc định 6)')
                                .setRequired(true)
                                .setMinValue(1)
                                .setMaxValue(24)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('channel')
                        .setDescription('Đặt kênh thông báo thế giới')
                        .addChannelOption(opt =>
                            opt
                                .setName('channel')
                                .setDescription('Kênh text')
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('toggle')
                        .setDescription('Bật/tắt advanceDay()')
                        .addStringOption(opt =>
                            opt
                                .setName('state')
                                .setDescription('on hoặc off')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Bật', value: 'on' },
                                    { name: 'Tắt', value: 'off' },
                                )
                        )
                )
        )
        // ── /admin skip-day ────────────────────────────────
        .addSubcommand(sub =>
            sub
                .setName('skip-day')
                .setDescription('Bỏ qua ngày (test)')
                .addIntegerOption(opt =>
                    opt
                        .setName('days')
                        .setDescription('Số ngày (1-30, mặc định 1)')
                        .setMinValue(1)
                        .setMaxValue(30)
                        .setRequired(false)
                )
        )
        // ── /admin info ────────────────────────────────────
        .addSubcommand(sub =>
            sub
                .setName('info')
                .setDescription('Xem thông tin admin &特权 users')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: 'Lệnh này chỉ dùng trong server.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Kiểm tra quyền Administrator
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '❌ Bạn cần quyền **Administrator** để dùng lệnh này.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const container = getContainer();
        const { schedulerService } = container;
        const group = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();

        // ── /admin schedule ────────────────────────────────
        if (group === 'schedule') {
            // Kiểm tra privileged cho timezone và channel
            if (subcommand === 'timezone' || subcommand === 'channel') {
                if (!isPrivilegedUser(interaction.user.id)) {
                    await interaction.reply({
                        content: '❌ Lệnh này chỉ dành cho quản trị viên được cấp phép (ALLOWED_USERS).',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }
            }

            // ── /admin schedule status ─────────────────────
            if (subcommand === 'status') {
                const schedule = await schedulerService.getSchedule(guildId);
                const hasCron = schedulerService.hasActiveCron(guildId);
                const status = schedulerService.getStatus();
                const worldSpeed = schedule.worldSpeed || 6;
                const intervalHours = Math.round(24 / worldSpeed);

                const embed = new EmbedBuilder()
                    .setTitle('📅 Lịch AdvanceDay')
                    .setColor(schedule.enabled ? 0x00ff00 : 0xff0000)
                    .addFields(
                        { name: 'Timezone', value: `\`${schedule.timezone}\``, inline: true },
                        { name: 'Thời gian chạy', value: `\`${schedule.scheduleTime}\``, inline: true },
                        { name: 'Trạng thái', value: schedule.enabled ? '✅ Bật' : '❌ Tắt', inline: true },
                        { name: '🌍 World Speed', value: `**${worldSpeed}x** (mỗi ${intervalHours}h)`, inline: true },
                        { name: '📢 Channel', value: schedule.worldChannelId ? `<#${schedule.worldChannelId}>` : 'Chưa set', inline: true },
                        { name: 'Lần cuối', value: schedule.lastAdvanced ? `<t:${Math.floor(schedule.lastAdvanced.getTime() / 1000)}:R>` : 'Chưa có', inline: true },
                        { name: 'Cron', value: hasCron ? '🟢 Active' : '🔴 Inactive', inline: true },
                    )
                    .setFooter({ text: `Active crons: ${status.totalCrons}` })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            // ── /admin schedule timezone ───────────────────
            if (subcommand === 'timezone') {
                const timezone = interaction.options.getString('timezone', true);
                try {
                    const schedule = await schedulerService.updateTimezone(guildId, timezone);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('✅ Timezone updated')
                                .setColor(0x00ff00)
                                .addFields(
                                    { name: 'Timezone', value: `\`${schedule.timezone}\``, inline: true },
                                )
                                .setTimestamp(),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                } catch (error) {
                    await interaction.reply({
                        content: `❌ ${error instanceof Error ? error.message : 'Lỗi'}`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
                return;
            }

            // ── /admin schedule speed ──────────────────────
            if (subcommand === 'speed') {
                const speed = interaction.options.getInteger('speed', true);
                try {
                    const schedule = await schedulerService.updateWorldSpeed(guildId, speed);
                    const intervalHours = Math.round(24 / speed);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('✅ World Speed updated')
                                .setColor(0x00ff00)
                                .addFields(
                                    { name: 'Speed', value: `**${speed}x** (mỗi ${intervalHours}h)`, inline: true },
                                    { name: 'Giải thích', value: `1 ngày thực = **${speed}** ngày ECHO`, inline: true },
                                )
                                .setTimestamp(),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                } catch (error) {
                    await interaction.reply({
                        content: `❌ ${error instanceof Error ? error.message : 'Lỗi'}`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
                return;
            }

            // ── /admin schedule channel ────────────────────
            if (subcommand === 'channel') {
                const channel = interaction.options.getChannel('channel', true);
                try {
                    await schedulerService.setWorldChannel(guildId, channel.id);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('✅ World Channel updated')
                                .setColor(0x00ff00)
                                .addFields(
                                    { name: 'Channel', value: `<#${channel.id}>`, inline: true },
                                    { name: 'Chức năng', value: 'Bot tự động thông báo khi thế giới chuyển ngày.', inline: false },
                                )
                                .setTimestamp(),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                } catch (error) {
                    await interaction.reply({
                        content: `❌ ${error instanceof Error ? error.message : 'Lỗi'}`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
                return;
            }

            // ── /admin schedule toggle ─────────────────────
            if (subcommand === 'toggle') {
                const state = interaction.options.getString('state', true);
                const enabled = state === 'on';
                const schedule = await schedulerService.toggleSchedule(guildId, enabled);

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(enabled ? '✅ Scheduler ON' : '✅ Scheduler OFF')
                            .setColor(enabled ? 0x00ff00 : 0xff0000)
                            .addFields(
                                { name: 'Status', value: enabled ? '🟢 Bật' : '🔴 Tắt', inline: true },
                                { name: 'Timezone', value: `\`${schedule.timezone}\``, inline: true },
                            )
                            .setTimestamp(),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
        }

        // ── /admin skip-day ────────────────────────────────
        if (subcommand === 'skip-day') {
            if (!isPrivilegedUser(interaction.user.id)) {
                await interaction.reply({
                    content: '❌ Lệnh này chỉ dành cho quản trị viên được cấp phép.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const daysToSkip = interaction.options.getInteger('days') || 1;
            await interaction.deferReply();

            const { worldStateService } = container;
            const worldBefore = await worldStateService.getWorld(guildId);

            let lastWorld = worldBefore;
            for (let i = 0; i < daysToSkip; i++) {
                lastWorld = await worldStateService.advanceDay(guildId);
            }

            const worldAfter = await worldStateService.getWorld(guildId);
            const seasonChanged = worldBefore.season !== worldAfter.season;

            const embed = new EmbedBuilder()
                .setTitle(`⏩ Đã bỏ qua ${daysToSkip} ngày`)
                .setColor(0x00ff00)
                .addFields(
                    { name: '📅 Ngày', value: `**${worldBefore.dayNumber}** → **${worldAfter.dayNumber}**`, inline: true },
                    { name: '🌤️ Thời tiết', value: WEATHER_NAMES[worldAfter.weather] || worldAfter.weather, inline: true },
                    { name: '🌱 Mùa', value: SEASON_NAMES[worldAfter.season] || worldAfter.season, inline: true },
                )
                .setTimestamp();

            if (seasonChanged) {
                embed.addFields({
                    name: '🎉 Season thay đổi!',
                    value: `**${SEASON_NAMES[worldBefore.season]}** → **${SEASON_NAMES[worldAfter.season]}**`,
                    inline: false,
                });
            }

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // ── /admin info ────────────────────────────────────
        if (subcommand === 'info') {
            const { isPrivilegedMode, getAllowedUserIds } = await import('../../config.js');
            const privilegedMode = isPrivilegedMode();
            const allowedIds = getAllowedUserIds();

            const embed = new EmbedBuilder()
                .setTitle('🔐 Admin Info')
                .setColor(0x5865f2)
                .addFields(
                    {
                        name: 'Privileged Mode',
                        value: privilegedMode ? '✅ Bật' : '❌ Tắt (Dev mode)',
                        inline: true,
                    },
                    {
                        name: 'Allowed Users',
                        value: allowedIds.length > 0
                            ? allowedIds.map((id: string) => `<@${id}>`).join(', ')
                            : 'Không có (ai cũng dùng được)',
                        inline: false,
                    },
                    {
                        name: 'Lệnh bị giới hạn',
                        value: [
                            '`/admin schedule timezone` — Cần privileged',
                            '`/admin schedule channel` — Cần privileged',
                            '`/admin skip-day` — Cần privileged',
                        ].join('\n'),
                        inline: false,
                    },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }
    },
};

export default command;
