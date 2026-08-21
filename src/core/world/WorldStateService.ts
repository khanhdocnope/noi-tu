// ============================================================
// ECHO — World State Service
// Core business logic cho World State.
// Đây là tầng game logic duy nhất được phép gọi Repository.
// Spec ref: Section 4, 6, 14, 15, 17 (RAM First)
// ============================================================

import { EventEmitter } from 'events';
import {
    ServerWorldState,
    Weather,
    Season,
    RegionStatus,
    GlobalEventStatus,
    WorldStateUpdate,
} from './WorldStateTypes';
import { IWorldStateRepository } from './IWorldStateRepository';

// Events mà WorldStateService phát ra — các module khác lắng nghe.
// Spec ref: Section 25 (Event-driven Architecture)
export const WORLD_EVENTS = {
    WORLD_CREATED:      'world:created',
    WORLD_UPDATED:      'world:updated',
    WEATHER_CHANGED:    'world:weather_changed',
    SEASON_CHANGED:     'world:season_changed',
    GLOBAL_EVENT_STARTED: 'world:global_event_started',
    GLOBAL_EVENT_COMPLETED: 'world:global_event_completed',
    DAY_ADVANCED:       'world:day_advanced',
} as const;

export class WorldStateService {
    // In-memory cache: guildId → ServerWorldState
    // Spec ref: Section 23 (Cache), 24 (Stateless Where Possible)
    private cache: Map<string, ServerWorldState> = new Map();

    // Global event bus — các module khác subscribe để nhận thông báo
    public readonly events: EventEmitter = new EventEmitter();

    constructor(private readonly repo: IWorldStateRepository) {}

    // --------------------------------------------------------
    // Public API
    // --------------------------------------------------------

    /**
     * Lấy World State của server. Ưu tiên từ cache, fallback về DB.
     * Nếu server chưa có World, tự động tạo mới.
     * Spec ref: Section 17 (RAM First)
     */
    async getWorld(guildId: string): Promise<ServerWorldState> {
        // 1. Kiểm tra cache trước (RAM First)
        const cached = this.cache.get(guildId);
        if (cached) return cached;

        // 2. Fallback về database
        let world = await this.repo.findByGuildId(guildId);

        // 3. Nếu server chưa từng dùng ECHO, tạo world mới
        if (!world) {
            world = await this.repo.create(guildId);
            this.events.emit(WORLD_EVENTS.WORLD_CREATED, world);
            console.log(`[ECHO World] New world created for guild: ${guildId}`);
        }

        // 4. Đưa vào cache
        this.cache.set(guildId, world);
        return world;
    }

    /**
     * Cập nhật World State và sync về DB, sau đó cập nhật cache.
     */
    async updateWorld(guildId: string, data: WorldStateUpdate): Promise<ServerWorldState> {
        const updated = await this.repo.update(guildId, {
            ...data,
            lastUpdatedAt: new Date(),
        });

        // Luôn cập nhật cache sau khi update DB
        this.cache.set(guildId, updated);
        this.events.emit(WORLD_EVENTS.WORLD_UPDATED, updated);
        return updated;
    }

    /**
     * Xoá cache của một server khỏi RAM (để giải phóng memory).
     * Gọi khi bot bị kick hoặc server không còn active.
     * Spec ref: Section 23 (Cache must have limits)
     */
    evictFromCache(guildId: string): void {
        this.cache.delete(guildId);
    }

    /**
     * Advance World sang ngày tiếp theo: thay đổi thời tiết, tăng dayNumber.
     * Được gọi bởi cron job hằng ngày.
     * Spec ref: Section 4 (World Observation), 6 (Opportunity không deterministic)
     */
    async advanceDay(guildId: string): Promise<ServerWorldState> {
        const world = await this.getWorld(guildId);
        const oldWeather = world.weather;

        const newWeather = this.rollWeather(world.weather, world.season);

        const updated = await this.updateWorld(guildId, {
            dayNumber: world.dayNumber + 1,
            weather: newWeather,
        });

        this.events.emit(WORLD_EVENTS.DAY_ADVANCED, updated);

        if (newWeather !== oldWeather) {
            this.events.emit(WORLD_EVENTS.WEATHER_CHANGED, { guildId, from: oldWeather, to: newWeather });
        }

        console.log(`[ECHO World] Guild ${guildId} — Day ${updated.dayNumber} begins. Weather: ${newWeather}`);
        return updated;
    }

    /**
     * Đặt season mới cho world.
     * Được gọi bởi SchedulerService khi season thay đổi.
     * Spec ref: Section 10 (Progression - World)
     */
    async setSeason(guildId: string, newSeason: Season): Promise<ServerWorldState> {
        const world = await this.getWorld(guildId);

        if (world.season === newSeason) {
            return world;  // Không thay đổi
        }

        const updated = await this.updateWorld(guildId, {
            season: newSeason,
        });

        this.events.emit(WORLD_EVENTS.SEASON_CHANGED, {
            guildId,
            from: world.season,
            to: newSeason,
            dayNumber: updated.dayNumber,
        });

        console.log(`[ECHO World] Guild ${guildId} — Season changed: ${world.season} → ${newSeason}`);
        return updated;
    }

    /**
     * Đóng góp progress vào Global Event đang chạy.
     * Spec ref: Section 15 (Global Event)
     */
    async contributeToGlobalEvent(guildId: string, amount: number): Promise<ServerWorldState> {
        const world = await this.getWorld(guildId);

        if (!world.activeGlobalEvent) {
            throw new Error('No active global event for this guild.');
        }

        const event = world.activeGlobalEvent;
        const newProgress = Math.min(event.currentProgress + amount, event.requiredProgress);
        const isCompleted = newProgress >= event.requiredProgress;

        // Cập nhật progress (và status) trước
        const completedEvent = {
            ...event,
            currentProgress: newProgress,
            // Fix: dùng enum GlobalEventStatus thay vì raw string
            status: isCompleted ? GlobalEventStatus.Completed : GlobalEventStatus.Active,
        };

        // Fix: nếu event hoàn thành, xóa activeGlobalEvent khỏi world
        // để tránh emit null reference và mở đường cho event mới
        const updated = await this.updateWorld(guildId, {
            activeGlobalEvent: isCompleted ? null : completedEvent,
        });

        if (isCompleted) {
            // Emit bản snapshot của event đã hoàn thành (không phải null)
            this.events.emit(WORLD_EVENTS.GLOBAL_EVENT_COMPLETED, { guildId, event: completedEvent });
            console.log(`[ECHO World] Guild ${guildId} — Global event "${event.name}" completed!`);
        }

        return updated;
    }

    // --------------------------------------------------------
    // Private Helpers
    // --------------------------------------------------------

    /**
     * Logic thay đổi thời tiết có trọng số, không hoàn toàn ngẫu nhiên.
     * Spec ref: Section 6 (Randomness chỉ là một thành phần)
     */
    private rollWeather(current: Weather, season: Season): Weather {
        // Trọng số theo mùa
        const weights: Record<Season, Record<Weather, number>> = {
            [Season.Spring]: {
                [Weather.Clear]: 40, [Weather.Rain]: 30, [Weather.Fog]: 15,
                [Weather.Storm]: 5,  [Weather.Snow]: 0,  [Weather.Eclipse]: 5, [Weather.Heatwave]: 5,
            },
            [Season.Summer]: {
                [Weather.Clear]: 50, [Weather.Rain]: 15, [Weather.Fog]: 5,
                [Weather.Storm]: 15, [Weather.Snow]: 0,  [Weather.Eclipse]: 5, [Weather.Heatwave]: 10,
            },
            [Season.Autumn]: {
                [Weather.Clear]: 25, [Weather.Rain]: 35, [Weather.Fog]: 25,
                [Weather.Storm]: 10, [Weather.Snow]: 0,  [Weather.Eclipse]: 5, [Weather.Heatwave]: 0,
            },
            [Season.Winter]: {
                [Weather.Clear]: 25, [Weather.Rain]: 10, [Weather.Fog]: 20,
                [Weather.Storm]: 10, [Weather.Snow]: 30, [Weather.Eclipse]: 5, [Weather.Heatwave]: 0,
            },
        };

        const seasonWeights = weights[season];
        const total = Object.values(seasonWeights).reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;

        for (const [weather, weight] of Object.entries(seasonWeights)) {
            roll -= weight;
            if (roll <= 0) return weather as Weather;
        }

        return current; // fallback giữ nguyên
    }
}
