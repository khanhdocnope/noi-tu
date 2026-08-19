// ============================================================
// ECHO — SQLite World State Repository
// Triển khai IWorldStateRepository dùng SQLite.
// Để chuyển sang Supabase: tạo SupabaseWorldStateRepository
// implement cùng interface này và thay trong bootstrap.ts.
// ============================================================

import Database from 'better-sqlite3';
import { IWorldStateRepository } from '../../../core/world/IWorldStateRepository';
import { ServerWorldState, WorldStateUpdate, Weather, Season } from '../../../core/world/WorldStateTypes';

// ── Kiểu dữ liệu raw từ SQLite row ────────────────────────────
interface WorldRow {
    guild_id: string;
    weather: string;
    season: string;
    day_number: number;
    regions: string;
    active_global_event: string | null;
    market_trends: string;
    world_level: number;
    shared_resource_pool: number;
    last_updated_at: string;
    created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────

function rowToWorld(row: WorldRow): ServerWorldState {
    return {
        guildId: row.guild_id,
        weather: row.weather as Weather,
        season: row.season as Season,
        dayNumber: row.day_number,
        regions: JSON.parse(row.regions),
        activeGlobalEvent: row.active_global_event ? JSON.parse(row.active_global_event) : null,
        marketTrends: JSON.parse(row.market_trends),
        worldLevel: row.world_level,
        sharedResourcePool: row.shared_resource_pool,
        lastUpdatedAt: new Date(row.last_updated_at),
        createdAt: new Date(row.created_at),
    };
}

// ── Repository ─────────────────────────────────────────────────

export class SQLiteWorldStateRepository implements IWorldStateRepository {
    private readonly findStmt: Database.Statement;
    private readonly findAllStmt: Database.Statement;
    private readonly insertStmt: Database.Statement;
    private readonly updateStmt: Database.Statement;

    constructor(private readonly db: Database.Database) {
        // Chuẩn bị các Prepared Statements một lần duy nhất để tối ưu hiệu suất
        this.findStmt = db.prepare(`
            SELECT * FROM world_states WHERE guild_id = ?
        `);

        this.findAllStmt = db.prepare(`
            SELECT * FROM world_states
        `);

        this.insertStmt = db.prepare(`
            INSERT INTO world_states (
                guild_id, weather, season, day_number, regions,
                active_global_event, market_trends, world_level,
                shared_resource_pool, last_updated_at, created_at
            ) VALUES (
                @guild_id, @weather, @season, @day_number, @regions,
                @active_global_event, @market_trends, @world_level,
                @shared_resource_pool, @last_updated_at, @created_at
            )
        `);

        this.updateStmt = db.prepare(`
            UPDATE world_states SET
                weather             = @weather,
                season              = @season,
                day_number          = @day_number,
                regions             = @regions,
                active_global_event = @active_global_event,
                market_trends       = @market_trends,
                world_level         = @world_level,
                shared_resource_pool = @shared_resource_pool,
                last_updated_at     = @last_updated_at
            WHERE guild_id = @guild_id
        `);
    }

    async findByGuildId(guildId: string): Promise<ServerWorldState | null> {
        const row = this.findStmt.get(guildId) as WorldRow | undefined;
        return row ? rowToWorld(row) : null;
    }

    async create(guildId: string): Promise<ServerWorldState> {
        const now = new Date().toISOString();
        const defaultWorld: ServerWorldState = {
            guildId,
            weather: Weather.Clear,
            season: Season.Spring,
            dayNumber: 1,
            regions: [],
            activeGlobalEvent: null,
            marketTrends: [],
            worldLevel: 1,
            sharedResourcePool: 0,
            lastUpdatedAt: new Date(),
            createdAt: new Date(),
        };

        this.insertStmt.run({
            guild_id: guildId,
            weather: defaultWorld.weather,
            season: defaultWorld.season,
            day_number: defaultWorld.dayNumber,
            regions: JSON.stringify(defaultWorld.regions),
            active_global_event: null,
            market_trends: JSON.stringify(defaultWorld.marketTrends),
            world_level: defaultWorld.worldLevel,
            shared_resource_pool: defaultWorld.sharedResourcePool,
            last_updated_at: now,
            created_at: now,
        });

        return defaultWorld;
    }

    async update(guildId: string, data: WorldStateUpdate): Promise<ServerWorldState> {
        const current = await this.findByGuildId(guildId);
        if (!current) throw new Error(`[SQLite] World not found for guild: ${guildId}`);

        const merged = { ...current, ...data, lastUpdatedAt: new Date() };

        this.updateStmt.run({
            guild_id: guildId,
            weather: merged.weather,
            season: merged.season,
            day_number: merged.dayNumber,
            regions: JSON.stringify(merged.regions),
            active_global_event: merged.activeGlobalEvent ? JSON.stringify(merged.activeGlobalEvent) : null,
            market_trends: JSON.stringify(merged.marketTrends),
            world_level: merged.worldLevel,
            shared_resource_pool: merged.sharedResourcePool,
            last_updated_at: merged.lastUpdatedAt.toISOString(),
        });

        return merged;
    }

    async findAllActive(): Promise<ServerWorldState[]> {
        const rows = this.findAllStmt.all() as WorldRow[];
        return rows.map(rowToWorld);
    }
}
