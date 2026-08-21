// ============================================================
// ECHO — Scheduler Service
// Quản lý cron job advanceDay() cho từng guild.
// Hỗ trợ world speed (6x default) và auto-announce.
// Spec ref: Section 4 (World Observation), 17 (RAM First)
// ============================================================

import cron, { ScheduledTask } from 'node-cron';
import { EventEmitter } from 'events';
import { Client, TextChannel, EmbedBuilder, Colors } from 'discord.js';
import { WorldStateService } from '../../core/world/WorldStateService';
import { Weather, Season, RegionStatus } from '../../core/world/WorldStateTypes';
import { IGuildScheduleRepository } from './IGuildScheduleRepository';
import { GuildScheduleConfig } from './GuildScheduleTypes';
import { checkSeasonChange, DAYS_PER_SEASON } from './SeasonEngine';

// Events mà SchedulerService phát ra
export const SCHEDULER_EVENTS = {
    DAY_ADVANCED: 'scheduler:day_advanced',
    SEASON_CHANGED: 'scheduler:season_changed',
    SCHEDULE_CREATED: 'scheduler:schedule_created',
    SCHEDULE_UPDATED: 'scheduler:schedule_updated',
    SCHEDULE_REMOVED: 'scheduler:schedule_removed',
    CATCHUP_PERFORMED: 'scheduler:catchup_performed',
} as const;

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

export class SchedulerService {
    // In-memory map: guildId → ScheduledTask
    private cronJobs: Map<string, ScheduledTask> = new Map();

    // Discord client reference cho auto-announce
    private client: Client | null = null;

    // Event bus cho các module khác subscribe
    public readonly events: EventEmitter = new EventEmitter();

    constructor(
        private readonly worldStateService: WorldStateService,
        private readonly repo: IGuildScheduleRepository
    ) {}

    /**
     * Set Discord client reference (gọi sau khi login).
     */
    setClient(client: Client): void {
        this.client = client;
    }

    // --------------------------------------------------------
    // Public API
    // --------------------------------------------------------

    /**
     * Khởi tạo scheduler: load tất cả guild schedules từ DB,
     * tạo cron job per guild.
     */
    async initialize(): Promise<void> {
        console.log('[ECHO Scheduler] Initializing...');

        const schedules = await this.repo.findAll();
        let activeCount = 0;

        for (const schedule of schedules) {
            if (schedule.enabled) {
                this.createCronForGuild(schedule);
                activeCount++;
            }
        }

        console.log(`[ECHO Scheduler] Ready. ${activeCount} active cron job(s) loaded.`);
    }

    /**
     * Kiểm tra và chạy catch-up nếu bot bị offline.
     * Tính số ngày đã bỏ lỡ dựa trên worldSpeed.
     */
    async catchUpOnRestart(): Promise<void> {
        console.log('[ECHO Scheduler] Checking for catch-up...');

        const schedules = await this.repo.findAll();
        const now = new Date();
        let catchUpCount = 0;

        for (const schedule of schedules) {
            if (!schedule.enabled || !schedule.lastAdvanced) {
                continue;
            }

            const lastAdvanced = new Date(schedule.lastAdvanced);
            const hoursSinceLast = (now.getTime() - lastAdvanced.getTime()) / (1000 * 60 * 60);
            const worldSpeed = schedule.worldSpeed || 6;
            const echoHoursPerDay = 24 / worldSpeed; // Số ECHO-hours mỗi lần advance

            // Nếu đã qua đủ thời gian → advance
            if (hoursSinceLast >= echoHoursPerDay) {
                // Tính số lần advance cần thiết (tối đa worldSpeed lần)
                const advancesNeeded = Math.min(
                    Math.floor(hoursSinceLast / echoHoursPerDay),
                    worldSpeed
                );

                for (let i = 0; i < advancesNeeded; i++) {
                    await this.runAdvanceDay(schedule.guildId, false);
                    catchUpCount++;
                }

                // Auto-announce nếu có channel
                if (advancesNeeded > 0 && schedule.worldChannelId) {
                    await this.sendWorldAnnounce(schedule);
                }

                console.log(`[ECHO Scheduler] Catch-up: ${advancesNeeded} advance(s) for guild ${schedule.guildId}`);
            }
        }

        if (catchUpCount > 0) {
            this.events.emit(SCHEDULER_EVENTS.CATCHUP_PERFORMED, { count: catchUpCount });
            console.log(`[ECHO Scheduler] Catch-up complete: ${catchUpCount} advance(s).`);
        } else {
            console.log('[ECHO Scheduler] No catch-up needed.');
        }
    }

    /**
     * Tạo cron job mới cho guild.
     * Cron chạy mỗi (24 / worldSpeed) giờ.
     */
    createCronForGuild(config: GuildScheduleConfig): void {
        this.destroyCronForGuild(config.guildId);

        const worldSpeed = config.worldSpeed || 6;
        const intervalHours = 24 / worldSpeed;

        // Tạo cron expression dựa trên interval
        // Ví dụ: 6x → mỗi 4 tiếng → "0 */4 * * *"
        // Ví dụ: 1x → mỗi 24 tiếng → "0 0 * * *"
        let cronExpression: string;

        if (intervalHours >= 24) {
            // 1 lần/ngày: chạy lúc scheduleTime
            const [hour, minute] = config.scheduleTime.split(':');
            cronExpression = `${minute} ${hour} * * *`;
        } else if (intervalHours >= 1) {
            // Nhiều lần/ngày: chạy mỗi N tiếng
            const interval = Math.round(intervalHours);
            cronExpression = `0 */${interval} * * *`;
        } else {
            // interval < 1 giờ → mỗi 30 phút (tối thiểu)
            cronExpression = `*/30 * * * *`;
        }

        if (!cron.validate(cronExpression)) {
            console.error(`[ECHO Scheduler] Invalid cron for guild ${config.guildId}: ${cronExpression}`);
            return;
        }

        const job = cron.schedule(cronExpression, async () => {
            await this.runAdvanceDay(config.guildId, true);
        }, {
            timezone: config.timezone,
        });

        this.cronJobs.set(config.guildId, job);
        console.log(`[ECHO Scheduler] Cron created for guild ${config.guildId}: ${cronExpression} (${config.timezone}, ${worldSpeed}x speed)`);
    }

    destroyCronForGuild(guildId: string): void {
        const existing = this.cronJobs.get(guildId);
        if (existing) {
            existing.stop();
            this.cronJobs.delete(guildId);
            console.log(`[ECHO Scheduler] Cron destroyed for guild ${guildId}`);
        }
    }

    async getSchedule(guildId: string): Promise<GuildScheduleConfig> {
        let schedule = await this.repo.findByGuildId(guildId);

        if (!schedule) {
            schedule = await this.repo.create(guildId);
            this.events.emit(SCHEDULER_EVENTS.SCHEDULE_CREATED, schedule);
        }

        return schedule;
    }

    async updateTimezone(guildId: string, timezone: string): Promise<GuildScheduleConfig> {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
        } catch {
            throw new Error(`Invalid timezone: ${timezone}`);
        }

        const schedule = await this.repo.update(guildId, { timezone });

        if (schedule.enabled) {
            this.createCronForGuild(schedule);
        }

        this.events.emit(SCHEDULER_EVENTS.SCHEDULE_UPDATED, schedule);
        return schedule;
    }

    /**
     * Cập nhật world speed cho guild.
     */
    async updateWorldSpeed(guildId: string, worldSpeed: number): Promise<GuildScheduleConfig> {
        if (worldSpeed < 1 || worldSpeed > 24) {
            throw new Error('World speed must be between 1 and 24');
        }

        const schedule = await this.repo.update(guildId, { worldSpeed });

        if (schedule.enabled) {
            this.createCronForGuild(schedule);
        }

        this.events.emit(SCHEDULER_EVENTS.SCHEDULE_UPDATED, schedule);
        return schedule;
    }

    /**
     * Set channel ID cho auto-announce.
     */
    async setWorldChannel(guildId: string, channelId: string | null): Promise<GuildScheduleConfig> {
        const schedule = await this.repo.update(guildId, { worldChannelId: channelId });

        this.events.emit(SCHEDULER_EVENTS.SCHEDULE_UPDATED, schedule);
        return schedule;
    }

    async toggleSchedule(guildId: string, enabled: boolean): Promise<GuildScheduleConfig> {
        const schedule = await this.repo.update(guildId, { enabled });

        if (enabled) {
            this.createCronForGuild(schedule);
        } else {
            this.destroyCronForGuild(guildId);
        }

        this.events.emit(SCHEDULER_EVENTS.SCHEDULE_UPDATED, schedule);
        return schedule;
    }

    async removeSchedule(guildId: string): Promise<void> {
        this.destroyCronForGuild(guildId);
        this.events.emit(SCHEDULER_EVENTS.SCHEDULE_REMOVED, { guildId });
    }

    async getAllSchedules(): Promise<GuildScheduleConfig[]> {
        return this.repo.findAll();
    }

    hasActiveCron(guildId: string): boolean {
        return this.cronJobs.has(guildId);
    }

    getStatus(): { totalCrons: number; activeGuildIds: string[] } {
        return {
            totalCrons: this.cronJobs.size,
            activeGuildIds: Array.from(this.cronJobs.keys()),
        };
    }

    // --------------------------------------------------------
    // Core Logic
    // --------------------------------------------------------

    /**
     * Chạy advanceDay() cho guild.
     * @param sendAnnounce - Có gửi auto-announce không
     */
    async runAdvanceDay(guildId: string, sendAnnounce: boolean = true): Promise<void> {
        try {
            const world = await this.worldStateService.advanceDay(guildId);

            const newSeason = checkSeasonChange(world.season, world.dayNumber);

            if (newSeason) {
                await this.worldStateService.updateWorld(guildId, {
                    season: newSeason,
                });

                this.events.emit(SCHEDULER_EVENTS.SEASON_CHANGED, {
                    guildId,
                    from: world.season,
                    to: newSeason,
                    dayNumber: world.dayNumber,
                });

                console.log(`[ECHO Season] Guild ${guildId}: ${world.season} → ${newSeason} (Day ${world.dayNumber})`);
            }

            await this.repo.updateLastAdvanced(guildId, new Date());

            this.events.emit(SCHEDULER_EVENTS.DAY_ADVANCED, {
                guildId,
                dayNumber: world.dayNumber,
                weather: world.weather,
                season: newSeason || world.season,
            });

            // Auto-announce nếu được yêu cầu
            if (sendAnnounce) {
                const schedule = await this.repo.findByGuildId(guildId);
                if (schedule?.worldChannelId) {
                    await this.sendWorldAnnounce(schedule);
                }
            }

        } catch (error) {
            console.error(`[ECHO Scheduler] Error advancing day for guild ${guildId}:`, error);
        }
    }

    /**
     * Gửi thông báo world state đến kênh đã chỉ định.
     */
    private async sendWorldAnnounce(schedule: GuildScheduleConfig): Promise<void> {
        if (!this.client || !schedule.worldChannelId) return;

        try {
            const channel = await this.client.channels.fetch(schedule.worldChannelId);
            if (!channel || !channel.isTextBased()) return;

            const world = await this.worldStateService.getWorld(schedule.guildId);

            const weatherEmoji = WEATHER_EMOJI[world.weather] || '❓';
            const seasonEmoji = SEASON_EMOJI[world.season] || '❓';

            const embed = new EmbedBuilder()
                .setTitle(`🌍 Thế Giới ECHO — Ngày ${world.dayNumber}`)
                .setDescription(
                    `${seasonEmoji} Mùa: **${world.season}**  •  ${weatherEmoji} Thời tiết: **${world.weather}**\n\n` +
                    `_Thế giới đang trôi... (Tốc độ: ${schedule.worldSpeed}x)_`
                )
                .addFields(
                    {
                        name: '🗺️ Các Khu Vực',
                        value: world.regions
                            .map(r => {
                                const statusEmoji = r.status === RegionStatus.Active ? '✅' :
                                                   r.status === RegionStatus.Locked ? '🔒' :
                                                   r.status === RegionStatus.Anomaly ? '⚠️' : '🚫';
                                return `${statusEmoji} **${r.name}**`;
                            }).join('\n'),
                        inline: false,
                    },
                    { name: '🌟 World Level', value: `Cấp ${world.worldLevel}`, inline: true },
                    { name: '💎 Tài Nguyên', value: `${world.sharedResourcePool.toLocaleString()}`, inline: true },
                )
                .setColor(Colors.Blurple)
                .setTimestamp()
                .setFooter({ text: 'ECHO — The world that remembers.' });

            await (channel as TextChannel).send({ embeds: [embed] });

        } catch (error) {
            console.error(`[ECHO Scheduler] Failed to send announce for guild ${schedule.guildId}:`, error);
        }
    }
}
