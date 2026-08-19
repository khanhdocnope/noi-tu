// ============================================================
// ECHO — In-Memory Player Repository
// Triển khai Repository tạm thời trong bộ nhớ RAM cho Player.
// Spec ref: Section 21 (Database Abstraction)
// ============================================================

import { PlayerState, PlayerStateUpdate } from '../../core/player/PlayerStateTypes';
import { IPlayerRepository } from '../../core/player/IPlayerRepository';

export class InMemoryPlayerRepository implements IPlayerRepository {
    private store: Map<string, PlayerState> = new Map();

    async findByUserId(userId: string): Promise<PlayerState | null> {
        return this.store.get(userId) ?? null;
    }

    async create(userId: string): Promise<PlayerState> {
        const now = new Date();
        const newPlayer: PlayerState = {
            userId,
            level: 1,
            xp: 0,
            currency: 100, // Tiền tệ khởi đầu cho MVP
            streak: {
                current: 0,
                max: 0,
                lastActiveAt: null,
                protectionActive: true, // Tặng một lượt bảo vệ streak khi tạo acc
            },
            currentState: 'idle',
            inventory: [],
            relationships: [],
            discoveries: [],
            lastUpdatedAt: now,
            createdAt: now,
        };

        this.store.set(userId, newPlayer);
        return newPlayer;
    }

    async update(userId: string, data: PlayerStateUpdate): Promise<PlayerState> {
        const existing = this.store.get(userId);
        if (!existing) {
            throw new Error(`[InMemoryDB] Player profile not found for user: ${userId}`);
        }

        const updated: PlayerState = { ...existing, ...data };
        this.store.set(userId, updated);
        return updated;
    }
}
