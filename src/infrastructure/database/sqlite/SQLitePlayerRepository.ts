// ============================================================
// ECHO — SQLite Player State Repository
// Triển khai IPlayerRepository dùng SQLite.
// ============================================================

import Database from 'better-sqlite3';
import { IPlayerRepository } from '../../../core/player/IPlayerRepository';
import { PlayerState, PlayerStateUpdate } from '../../../core/player/PlayerStateTypes';

// ── Kiểu dữ liệu raw từ SQLite row ────────────────────────────
interface PlayerRow {
    user_id: string;
    level: number;
    xp: number;
    currency: number;
    streak_current: number;
    streak_max: number;
    streak_last_active: string | null;
    streak_protection: number; // SQLite dùng 0/1 cho boolean
    current_state: string;
    inventory: string;
    relationships: string;
    discoveries: string;
    active_opportunity: string | null;
    last_updated_at: string;
    created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────

function rowToPlayer(row: PlayerRow): PlayerState {
    return {
        userId: row.user_id,
        level: row.level,
        xp: row.xp,
        currency: row.currency,
        streak: {
            current: row.streak_current,
            max: row.streak_max,
            lastActiveAt: row.streak_last_active ? new Date(row.streak_last_active) : null,
            protectionActive: row.streak_protection === 1,
        },
        currentState: row.current_state,
        inventory: JSON.parse(row.inventory),
        relationships: JSON.parse(row.relationships),
        discoveries: JSON.parse(row.discoveries),
        activeOpportunity: row.active_opportunity ? JSON.parse(row.active_opportunity) : null,
        lastUpdatedAt: new Date(row.last_updated_at),
        createdAt: new Date(row.created_at),
    };
}

// ── Repository ─────────────────────────────────────────────────

export class SQLitePlayerRepository implements IPlayerRepository {
    private readonly findStmt: Database.Statement;
    private readonly insertStmt: Database.Statement;
    private readonly updateStmt: Database.Statement;

    constructor(private readonly db: Database.Database) {
        this.findStmt = db.prepare(`
            SELECT * FROM player_states WHERE user_id = ?
        `);

        this.insertStmt = db.prepare(`
            INSERT INTO player_states (
                user_id, level, xp, currency,
                streak_current, streak_max, streak_last_active, streak_protection,
                current_state, inventory, relationships, discoveries,
                active_opportunity, last_updated_at, created_at
            ) VALUES (
                @user_id, @level, @xp, @currency,
                @streak_current, @streak_max, @streak_last_active, @streak_protection,
                @current_state, @inventory, @relationships, @discoveries,
                @active_opportunity, @last_updated_at, @created_at
            )
        `);

        this.updateStmt = db.prepare(`
            UPDATE player_states SET
                level               = @level,
                xp                  = @xp,
                currency            = @currency,
                streak_current      = @streak_current,
                streak_max          = @streak_max,
                streak_last_active  = @streak_last_active,
                streak_protection   = @streak_protection,
                current_state       = @current_state,
                inventory           = @inventory,
                relationships       = @relationships,
                discoveries         = @discoveries,
                active_opportunity  = @active_opportunity,
                last_updated_at     = @last_updated_at
            WHERE user_id = @user_id
        `);
    }

    async findByUserId(userId: string): Promise<PlayerState | null> {
        const row = this.findStmt.get(userId) as PlayerRow | undefined;
        return row ? rowToPlayer(row) : null;
    }

    async create(userId: string): Promise<PlayerState> {
        const now = new Date().toISOString();
        const newPlayer: PlayerState = {
            userId,
            level: 1,
            xp: 0,
            currency: 100,
            streak: {
                current: 0,
                max: 0,
                lastActiveAt: null,
                protectionActive: true,
            },
            currentState: 'idle',
            inventory: [],
            relationships: [],
            discoveries: [],
            activeOpportunity: null,
            lastUpdatedAt: new Date(),
            createdAt: new Date(),
        };

        this.insertStmt.run({
            user_id: userId,
            level: newPlayer.level,
            xp: newPlayer.xp,
            currency: newPlayer.currency,
            streak_current: newPlayer.streak.current,
            streak_max: newPlayer.streak.max,
            streak_last_active: null,
            streak_protection: 1,
            current_state: newPlayer.currentState,
            inventory: JSON.stringify(newPlayer.inventory),
            relationships: JSON.stringify(newPlayer.relationships),
            discoveries: JSON.stringify(newPlayer.discoveries),
            active_opportunity: null,
            last_updated_at: now,
            created_at: now,
        });

        return newPlayer;
    }

    async update(userId: string, data: PlayerStateUpdate): Promise<PlayerState> {
        const current = await this.findByUserId(userId);
        if (!current) throw new Error(`[SQLite] Player not found for user: ${userId}`);

        const merged: PlayerState = {
            ...current,
            ...data,
            // Merge nested streak object đúng cách
            streak: data.streak ? { ...current.streak, ...data.streak } : current.streak,
            lastUpdatedAt: new Date(),
        };

        this.updateStmt.run({
            user_id: userId,
            level: merged.level,
            xp: merged.xp,
            currency: merged.currency,
            streak_current: merged.streak.current,
            streak_max: merged.streak.max,
            streak_last_active: merged.streak.lastActiveAt ? new Date(merged.streak.lastActiveAt).toISOString() : null,
            streak_protection: merged.streak.protectionActive ? 1 : 0,
            current_state: merged.currentState,
            inventory: JSON.stringify(merged.inventory),
            relationships: JSON.stringify(merged.relationships),
            discoveries: JSON.stringify(merged.discoveries),
            active_opportunity: merged.activeOpportunity ? JSON.stringify(merged.activeOpportunity) : null,
            last_updated_at: merged.lastUpdatedAt.toISOString(),
        });

        return merged;
    }
}
