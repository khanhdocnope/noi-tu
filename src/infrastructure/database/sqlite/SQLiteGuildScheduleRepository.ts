// ============================================================
// ECHO — SQLite Guild Schedule Repository
// Lưu trữ lịch advanceDay() bằng SQLite.
// Spec ref: Section 21 (Database Abstraction), 22 (SQLite cho MVP)
// ============================================================

import Database from 'better-sqlite3';
import { GuildScheduleConfig, GuildScheduleUpdate } from '../../scheduler/GuildScheduleTypes';
import { IGuildScheduleRepository } from '../../scheduler/IGuildScheduleRepository';

/**
 * Row type từ database (trước khi map sang entity).
 */
interface GuildScheduleRow {
    guild_id: string;
    timezone: string;
    schedule_time: string;
    enabled: number;          // SQLite boolean: 0 hoặc 1
    world_speed: number;
    world_channel_id: string | null;
    last_advanced: string | null;
    created_at: string;
}

/**
 * Map database row → entity.
 */
function rowToEntity(row: GuildScheduleRow): GuildScheduleConfig {
    return {
        guildId: row.guild_id,
        timezone: row.timezone,
        scheduleTime: row.schedule_time,
        enabled: row.enabled === 1,
        worldSpeed: row.world_speed || 6,
        worldChannelId: row.world_channel_id,
        lastAdvanced: row.last_advanced ? new Date(row.last_advanced) : null,
        createdAt: new Date(row.created_at),
    };
}

export class GuildScheduleRepository implements IGuildScheduleRepository {
    private findStmt: Database.Statement;
    private insertStmt: Database.Statement;
    private updateStmt: Database.Statement;
    private updateLastAdvancedStmt: Database.Statement;
    private findAllStmt: Database.Statement;

    constructor(private readonly db: Database.Database) {
        this.findStmt = this.db.prepare(
            'SELECT * FROM guild_schedules WHERE guild_id = ?'
        );

        this.insertStmt = this.db.prepare(`
            INSERT INTO guild_schedules (guild_id, timezone, schedule_time, enabled, world_speed, world_channel_id, last_advanced, created_at)
            VALUES (@guildId, @timezone, @scheduleTime, @enabled, @worldSpeed, @worldChannelId, @lastAdvanced, @createdAt)
        `);

        this.updateStmt = this.db.prepare(`
            UPDATE guild_schedules
            SET timezone = @timezone, schedule_time = @scheduleTime, enabled = @enabled,
                world_speed = @worldSpeed, world_channel_id = @worldChannelId
            WHERE guild_id = @guildId
        `);

        this.updateLastAdvancedStmt = this.db.prepare(`
            UPDATE guild_schedules
            SET last_advanced = @lastAdvanced
            WHERE guild_id = @guildId
        `);

        this.findAllStmt = this.db.prepare('SELECT * FROM guild_schedules');
    }

    async findByGuildId(guildId: string): Promise<GuildScheduleConfig | null> {
        const row = this.findStmt.get(guildId) as GuildScheduleRow | undefined;
        return row ? rowToEntity(row) : null;
    }

    async create(guildId: string, timezone: string = 'UTC'): Promise<GuildScheduleConfig> {
        const now = new Date().toISOString();

        this.insertStmt.run({
            guildId,
            timezone,
            scheduleTime: '00:00',
            enabled: 1,
            worldSpeed: 6,
            worldChannelId: null,
            lastAdvanced: null,
            createdAt: now,
        });

        return this.findByGuildId(guildId) as Promise<GuildScheduleConfig>;
    }

    async update(guildId: string, data: GuildScheduleUpdate): Promise<GuildScheduleConfig> {
        // Lấy current data trước, nếu chưa có thì tạo mới
        let existing = await this.findByGuildId(guildId);
        if (!existing) {
            existing = await this.create(guildId);
        }

        // Merge data
        const merged = { ...existing, ...data };

        this.updateStmt.run({
            guildId,
            timezone: merged.timezone,
            scheduleTime: merged.scheduleTime,
            enabled: merged.enabled ? 1 : 0,
            worldSpeed: merged.worldSpeed,
            worldChannelId: merged.worldChannelId,
        });

        return this.findByGuildId(guildId) as Promise<GuildScheduleConfig>;
    }

    async findAll(): Promise<GuildScheduleConfig[]> {
        const rows = this.findAllStmt.all() as GuildScheduleRow[];
        return rows.map(rowToEntity);
    }

    async updateLastAdvanced(guildId: string, date: Date): Promise<GuildScheduleConfig> {
        this.updateLastAdvancedStmt.run({
            guildId,
            lastAdvanced: date.toISOString(),
        });

        return this.findByGuildId(guildId) as Promise<GuildScheduleConfig>;
    }
}
