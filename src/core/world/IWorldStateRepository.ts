// ============================================================
// ECHO — World State Repository Interface
// Tầng trừu tượng giữa game logic và database.
// Spec ref: Section 21 (Database Abstraction)
// Core Loop không phụ thuộc trực tiếp vào một database cụ thể.
// ============================================================

import { ServerWorldState, WorldStateUpdate } from './WorldStateTypes';

export interface IWorldStateRepository {
    /**
     * Lấy trạng thái thế giới của một server.
     * Trả về null nếu server chưa được khởi tạo.
     */
    findByGuildId(guildId: string): Promise<ServerWorldState | null>;

    /**
     * Tạo một trạng thái thế giới mới cho server (lần đầu tiên).
     */
    create(guildId: string): Promise<ServerWorldState>;

    /**
     * Cập nhật một phần trạng thái thế giới.
     */
    update(guildId: string, data: WorldStateUpdate): Promise<ServerWorldState>;

    /**
     * Lấy tất cả server worlds đang active (dùng cho cron job reset hằng ngày).
     */
    findAllActive(): Promise<ServerWorldState[]>;
}
