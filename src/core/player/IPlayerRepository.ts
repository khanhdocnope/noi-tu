// ============================================================
// ECHO — Player Repository Interface
// Tầng trừu tượng hóa việc lưu trữ dữ liệu Player.
// Spec ref: Section 21 (Database Abstraction)
// ============================================================

import { PlayerState, PlayerStateUpdate } from './PlayerStateTypes';

export interface IPlayerRepository {
    /**
     * Tìm kiếm thông tin người chơi theo Discord User ID.
     */
    findByUserId(userId: string): Promise<PlayerState | null>;

    /**
     * Tạo thông tin người chơi mới.
     */
    create(userId: string): Promise<PlayerState>;

    /**
     * Cập nhật trạng thái người chơi.
     */
    update(userId: string, data: PlayerStateUpdate): Promise<PlayerState>;
}
