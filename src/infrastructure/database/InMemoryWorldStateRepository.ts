// ============================================================
// ECHO — In-Memory World State Repository
// Triển khai repository không dùng database (dùng cho dev/test).
// Khi sẵn sàng dùng SQLite/PostgreSQL, chỉ cần tạo class mới
// implement IWorldStateRepository mà không cần sửa service.
// Spec ref: Section 21 (Database Abstraction), 22 (SQLite cho MVP)
// ============================================================

import {
    ServerWorldState,
    Weather,
    Season,
    WorldStateUpdate,
} from '../../core/world/WorldStateTypes';
import { IWorldStateRepository } from '../../core/world/IWorldStateRepository';

export class InMemoryWorldStateRepository implements IWorldStateRepository {
    private store: Map<string, ServerWorldState> = new Map();

    async findByGuildId(guildId: string): Promise<ServerWorldState | null> {
        return this.store.get(guildId) ?? null;
    }

    async create(guildId: string): Promise<ServerWorldState> {
        const now = new Date();

        const newWorld: ServerWorldState = {
            guildId,
            weather: Weather.Clear,
            season: Season.Spring,
            dayNumber: 1,
            regions: [
                { id: 'town', name: 'Thị Trấn', status: 'active' as any },
                { id: 'forest', name: 'Khu Rừng Phía Bắc', status: 'locked' as any },
                { id: 'ruins', name: 'Di Tích Cổ', status: 'locked' as any },
            ],
            activeGlobalEvent: null,
            marketTrends: [],
            worldLevel: 1,
            sharedResourcePool: 0,
            lastUpdatedAt: now,
            createdAt: now,
        };

        this.store.set(guildId, newWorld);
        return newWorld;
    }

    async update(guildId: string, data: WorldStateUpdate): Promise<ServerWorldState> {
        const existing = this.store.get(guildId);
        if (!existing) throw new Error(`World not found for guild: ${guildId}`);

        const updated: ServerWorldState = { ...existing, ...data };
        this.store.set(guildId, updated);
        return updated;
    }

    async findAllActive(): Promise<ServerWorldState[]> {
        return Array.from(this.store.values());
    }
}
