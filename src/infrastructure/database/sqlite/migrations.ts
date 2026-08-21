// ============================================================
// ECHO — Database Schema Migrations
// Tạo bảng (nếu chưa có) theo thứ tự ưu tiên đúng.
// Thiết kế để dễ migrate sang PostgreSQL/Supabase sau này.
// ============================================================

import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
    console.log('[ECHO DB] Running migrations...');

    db.exec(`
        -- ================================================================
        -- Table: world_states
        -- Lưu trạng thái World của từng Discord Server.
        -- Các trường kiểu Object/Array được serialize sang JSON text.
        -- ================================================================
        CREATE TABLE IF NOT EXISTS world_states (
            guild_id            TEXT        PRIMARY KEY,
            weather             TEXT        NOT NULL DEFAULT 'clear',
            season              TEXT        NOT NULL DEFAULT 'spring',
            day_number          INTEGER     NOT NULL DEFAULT 1,
            regions             TEXT        NOT NULL DEFAULT '[]',
            active_global_event TEXT,
            market_trends       TEXT        NOT NULL DEFAULT '[]',
            world_level         INTEGER     NOT NULL DEFAULT 1,
            shared_resource_pool INTEGER    NOT NULL DEFAULT 0,
            last_updated_at     TEXT        NOT NULL,
            created_at          TEXT        NOT NULL
        );

        -- ================================================================
        -- Table: guild_schedules
        -- Lưu lịch advanceDay() cho từng server.
        -- Mỗi guild có timezone riêng, chạy lúc 00:00 local.
        -- ================================================================
        CREATE TABLE IF NOT EXISTS guild_schedules (
            guild_id        TEXT        PRIMARY KEY,
            timezone        TEXT        NOT NULL DEFAULT 'UTC',
            schedule_time   TEXT        NOT NULL DEFAULT '00:00',
            enabled         INTEGER     NOT NULL DEFAULT 1,
            last_advanced   TEXT,
            created_at      TEXT        NOT NULL
        );

        -- ================================================================
        -- Table: player_states
        -- Lưu trạng thái nhân vật của từng người chơi.
        -- ================================================================
        CREATE TABLE IF NOT EXISTS player_states (
            user_id             TEXT        PRIMARY KEY,
            level               INTEGER     NOT NULL DEFAULT 1,
            xp                  INTEGER     NOT NULL DEFAULT 0,
            currency            INTEGER     NOT NULL DEFAULT 100,
            streak_current      INTEGER     NOT NULL DEFAULT 0,
            streak_max          INTEGER     NOT NULL DEFAULT 0,
            streak_last_active  TEXT,
            streak_protection   INTEGER     NOT NULL DEFAULT 1,
            current_state       TEXT        NOT NULL DEFAULT 'idle',
            inventory           TEXT        NOT NULL DEFAULT '[]',
            relationships       TEXT        NOT NULL DEFAULT '[]',
            discoveries         TEXT        NOT NULL DEFAULT '[]',
            active_opportunity  TEXT,
            daily_session       TEXT,
            last_updated_at     TEXT        NOT NULL,
            created_at          TEXT        NOT NULL
        );
    `);

    // ── ALTER TABLE: Add missing columns ──────────────────────────
    // These will fail silently if columns already exist
    const alterStatements = [
        `ALTER TABLE player_states ADD COLUMN daily_session TEXT`,
        `ALTER TABLE guild_schedules ADD COLUMN world_speed INTEGER NOT NULL DEFAULT 6`,
        `ALTER TABLE guild_schedules ADD COLUMN world_channel_id TEXT`,
        // Combat stats
        `ALTER TABLE player_states ADD COLUMN combat_hp INTEGER NOT NULL DEFAULT 100`,
        `ALTER TABLE player_states ADD COLUMN combat_max_hp INTEGER NOT NULL DEFAULT 100`,
        `ALTER TABLE player_states ADD COLUMN combat_attack INTEGER NOT NULL DEFAULT 10`,
        `ALTER TABLE player_states ADD COLUMN combat_defense INTEGER NOT NULL DEFAULT 5`,
        `ALTER TABLE player_states ADD COLUMN combat_speed INTEGER NOT NULL DEFAULT 10`,
    ];

    for (const stmt of alterStatements) {
        try {
            db.exec(stmt);
        } catch (e: any) {
            // Column already exists - ignore
            if (!e.message?.includes('duplicate column')) {
                console.error('[ECHO DB] Migration error:', e.message);
            }
        }
    }

    console.log('[ECHO DB] Migrations complete.');
}
