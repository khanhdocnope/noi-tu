// ============================================================
// ECHO — Application Bootstrap / Dependency Injection
// Kết nối DB → Repository → Service → Container.
// Để chuyển sang Supabase: chỉ cần thay SQLite* bằng Supabase* ở đây.
// Spec ref: Section 21 (Database Abstraction), 25 (Event-driven)
// ============================================================

import { WorldStateService } from './core/world/WorldStateService';
import { WorldMemoryService } from './core/world/WorldMemoryService';
import { PlayerService } from './core/player/PlayerService';
import { OpportunityService } from './core/opportunity/OpportunityService';
import { CuriosityService } from './core/curiosity/CuriosityService';
import { CombatService } from './core/combat/CombatService';
import { ExplorationService } from './core/exploration/ExplorationService';
import { MYSTERIES, SECRETS, CLUES, LOCKED_CONTENT, DISCOVERY_CHAINS } from './core/curiosity/CuriosityContentConfig';
import { SchedulerService } from './infrastructure/scheduler/SchedulerService';
import { notificationService } from './infrastructure/notification/NotificationService';
import { getDatabase } from './infrastructure/database/sqlite/client';
import { runMigrations } from './infrastructure/database/sqlite/migrations';
import { SQLiteWorldStateRepository } from './infrastructure/database/sqlite/SQLiteWorldStateRepository';
import { SQLitePlayerRepository } from './infrastructure/database/sqlite/SQLitePlayerRepository';
import { GuildScheduleRepository } from './infrastructure/database/sqlite/SQLiteGuildScheduleRepository';

export interface AppContainer {
    worldStateService: WorldStateService;
    worldMemoryService: WorldMemoryService;
    playerService: PlayerService;
    opportunityService: OpportunityService;
    curiosityService: CuriosityService;
    combatService: CombatService;
    explorationService: ExplorationService;
    schedulerService: SchedulerService;
    notificationService: typeof notificationService;
}

let container: AppContainer | null = null;

export async function bootstrapApp(): Promise<AppContainer> {
    if (container) return container;

    console.log('[ECHO Bootstrap] Initializing services...');

    // ── Bước 1: Kết nối DB và chạy migrations ─────────────────
    const db = getDatabase();
    runMigrations(db);

    // ── Bước 2: Tầng Infrastructure (Repositories) ─────────────
    // ⚡ Để chuyển sang Supabase: thay các dòng này bằng Supabase implementations
    const worldStateRepo   = new SQLiteWorldStateRepository(db);
    const playerRepo       = new SQLitePlayerRepository(db);
    const guildScheduleRepo = new GuildScheduleRepository(db);

    // ── Bước 3: Tầng Core (Services) ───────────────────────────
    const worldStateService  = new WorldStateService(worldStateRepo);
    const playerService      = new PlayerService(playerRepo);
    const worldMemoryService = new WorldMemoryService(worldStateService, playerService);
    const curiosityService   = new CuriosityService(playerService, worldStateService);
    curiosityService.loadMysteries(MYSTERIES);
    curiosityService.loadSecrets(SECRETS);
    curiosityService.loadClues(CLUES);
    curiosityService.loadLockedContent(LOCKED_CONTENT);
    curiosityService.loadChainDefinitions(DISCOVERY_CHAINS);
    const opportunityService = new OpportunityService(playerService, worldStateService, curiosityService);
    const combatService      = new CombatService(playerService);
    const explorationService = new ExplorationService(playerService, worldStateService, combatService);
    const schedulerService   = new SchedulerService(worldStateService, guildScheduleRepo);

    // ── Bước 4: Event listeners (Logging / Hooks) ───────────────
    worldStateService.events.on('world:created', (world) => {
        console.log(`[ECHO World] World initialized for guild: ${world.guildId}`);
    });
    worldStateService.events.on('world:day_advanced', (world) => {
        console.log(`[ECHO World] Day ${world.dayNumber} — Guild: ${world.guildId}`);
    });
    worldStateService.events.on('world:season_changed', (data) => {
        console.log(`[ECHO World] Season changed: ${data.from} → ${data.to} — Guild: ${data.guildId}`);
    });

    // Level-up notification
    playerService.events.on('player:level_up', async (data) => {
        console.log(`[ECHO Player] User ${data.userId} leveled up to Level ${data.level}!`);

        // Tính XP cần cho level tiếp theo
        const xpNeededForNext = data.level * 100;

        // Gửi DM notification
        await notificationService.sendLevelUp(data.userId, data.level, xpNeededForNext);
    });

    playerService.events.on('player:streak_lost', (data) => {
        console.log(`[ECHO Streak] User ${data.userId} lost streak of ${data.lostStreak} days.`);
    });

    // World Memory events
    worldMemoryService.events.on('world_memory:created', (data) => {
        console.log(`[ECHO World Memory] New memory created: ${data.memory.description}`);
    });
    worldMemoryService.events.on('world_memory:world_changed', (data) => {
        console.log(`[ECHO World Memory] World changed by memory: ${data.memoryId}`);
    });

    // Curiosity events
    curiosityService.events.on('curiosity:mystery_discovered', (data) => {
        console.log(`[ECHO Curiosity] Player ${data.playerId} discovered mystery: ${data.mysteryName}`);
    });
    curiosityService.events.on('curiosity:mystery_solved', (data) => {
        console.log(`[ECHO Curiosity] Player ${data.playerId} solved mystery: ${data.mysteryName}`);
    });
    curiosityService.events.on('curiosity:secret_found', (data) => {
        console.log(`[ECHO Curiosity] Player ${data.playerId} found secret: ${data.secretName}`);
    });
    curiosityService.events.on('curiosity:chain_completed', (data) => {
        console.log(`[ECHO Curiosity] Player ${data.playerId} completed chain: ${data.chainName}`);
    });

    // ── Bước 5: Khởi tạo Scheduler ─────────────────────────────
    await schedulerService.initialize();
    await schedulerService.catchUpOnRestart();

    // Listen scheduler events
    schedulerService.events.on('scheduler:day_advanced', (data) => {
        console.log(`[ECHO Scheduler] Day advanced: Guild ${data.guildId} → Day ${data.dayNumber}`);
    });
    schedulerService.events.on('scheduler:season_changed', (data) => {
        console.log(`[ECHO Scheduler] Season changed: ${data.from} → ${data.to} — Guild: ${data.guildId}`);
    });

    container = { worldStateService, worldMemoryService, playerService, curiosityService, opportunityService, combatService, explorationService, schedulerService, notificationService };

    console.log('[ECHO Bootstrap] All services ready. Database: SQLite');
    return container;
}

export function getContainer(): AppContainer {
    if (!container) throw new Error('[ECHO Bootstrap] App not bootstrapped yet!');
    return container;
}
