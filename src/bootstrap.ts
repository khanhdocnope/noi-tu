// ============================================================
// ECHO — Application Bootstrap / Dependency Injection
// Kết nối DB → Repository → Service → Container.
// Để chuyển sang Supabase: chỉ cần thay SQLite* bằng Supabase* ở đây.
// Spec ref: Section 21 (Database Abstraction), 25 (Event-driven)
// ============================================================

import { WorldStateService } from './core/world/WorldStateService';
import { PlayerService } from './core/player/PlayerService';
import { OpportunityService } from './core/opportunity/OpportunityService';
import { getDatabase } from './infrastructure/database/sqlite/client';
import { runMigrations } from './infrastructure/database/sqlite/migrations';
import { SQLiteWorldStateRepository } from './infrastructure/database/sqlite/SQLiteWorldStateRepository';
import { SQLitePlayerRepository } from './infrastructure/database/sqlite/SQLitePlayerRepository';

export interface AppContainer {
    worldStateService: WorldStateService;
    playerService: PlayerService;
    opportunityService: OpportunityService;
}

let container: AppContainer | null = null;

export function bootstrapApp(): AppContainer {
    if (container) return container;

    console.log('[ECHO Bootstrap] Initializing services...');

    // ── Bước 1: Kết nối DB và chạy migrations ─────────────────
    const db = getDatabase();
    runMigrations(db);

    // ── Bước 2: Tầng Infrastructure (Repositories) ─────────────
    // ⚡ Để chuyển sang Supabase: thay 2 dòng này bằng:
    //    const worldStateRepo = new SupabaseWorldStateRepository(supabaseClient);
    //    const playerRepo     = new SupabasePlayerRepository(supabaseClient);
    const worldStateRepo = new SQLiteWorldStateRepository(db);
    const playerRepo     = new SQLitePlayerRepository(db);

    // ── Bước 3: Tầng Core (Services) ───────────────────────────
    const worldStateService  = new WorldStateService(worldStateRepo);
    const playerService      = new PlayerService(playerRepo);
    const opportunityService = new OpportunityService(playerService, worldStateService);

    // ── Bước 4: Event listeners (Logging / Hooks) ───────────────
    worldStateService.events.on('world:created', (world) => {
        console.log(`[ECHO World] World initialized for guild: ${world.guildId}`);
    });
    worldStateService.events.on('world:day_advanced', (world) => {
        console.log(`[ECHO World] Day ${world.dayNumber} — Guild: ${world.guildId}`);
    });

    playerService.events.on('player:level_up', (data) => {
        console.log(`[ECHO Player] User ${data.userId} leveled up to Level ${data.level}!`);
    });
    playerService.events.on('player:streak_lost', (data) => {
        console.log(`[ECHO Streak] User ${data.userId} lost streak of ${data.lostStreak} days.`);
    });

    container = { worldStateService, playerService, opportunityService };

    console.log('[ECHO Bootstrap] All services ready. Database: SQLite');
    return container;
}

export function getContainer(): AppContainer {
    if (!container) throw new Error('[ECHO Bootstrap] App not bootstrapped yet!');
    return container;
}
