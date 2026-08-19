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
            last_updated_at     TEXT        NOT NULL,
            created_at          TEXT        NOT NULL
        );
    `);

    console.log('[ECHO DB] Migrations complete.');
}
