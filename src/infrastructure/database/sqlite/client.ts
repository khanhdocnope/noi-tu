// ============================================================
// ECHO — Database Client Singleton
// Quản lý kết nối SQLite duy nhất cho toàn bộ ứng dụng.
// Sau này chỉ cần thay file này bằng Supabase client là xong.
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Lấy hoặc tạo instance SQLite dùng chung trong toàn ứng dụng.
 * Database file được lưu tại: /data/echo.db
 */
export function getDatabase(): Database.Database {
    if (db) return db;

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'echo.db');
    db = new Database(dbPath);

    // Bật WAL mode để tăng hiệu suất đọc/ghi đồng thời
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    console.log(`[ECHO DB] SQLite connected at: ${dbPath}`);
    return db;
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('[ECHO DB] SQLite connection closed.');
    }
}
