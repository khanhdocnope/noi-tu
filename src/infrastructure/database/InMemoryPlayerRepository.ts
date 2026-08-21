// ============================================================
// ECHO — In-Memory Player Repository
// Triển khai Repository tạm thời trong bộ nhớ RAM cho Player.
// Spec ref: Section 21 (Database Abstraction)
// ============================================================

import { PlayerState, PlayerStateUpdate } from '../../core/player/PlayerStateTypes';
import { IPlayerRepository } from '../../core/player/IPlayerRepository';
import { DEFAULT_PLAYER_COMBAT_STATS } from '../../core/combat/CombatTypes';

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
            currency: 100,
            streak: {
                current: 0,
                max: 0,
                lastActiveAt: null,
                protectionActive: true,
            },
            currentState: 'idle',
            combat: { ...DEFAULT_PLAYER_COMBAT_STATS },
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
