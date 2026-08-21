// ============================================================
// ECHO — Guild Schedule Repository Interface
// Tầng trừu tượng giữa scheduler logic và database.
// Spec ref: Section 21 (Database Abstraction)
// ============================================================

import { GuildScheduleConfig, GuildScheduleUpdate } from './GuildScheduleTypes';

export interface IGuildScheduleRepository {
    /**
     * Lấy lịch advanceDay() của một guild.
     * Trả về null nếu guild chưa được cấu hình.
     */
    findByGuildId(guildId: string): Promise<GuildScheduleConfig | null>;

    /**
     * Tạo lịch advanceDay() mới cho guild (lần đầu tiên).
     */
    create(guildId: string, timezone?: string): Promise<GuildScheduleConfig>;

    /**
     * Cập nhật một phần lịch advanceDay().
     */
    update(guildId: string, data: GuildScheduleUpdate): Promise<GuildScheduleConfig>;

    /**
     * Lấy tất cả guild schedules (dùng cho scheduler initialize).
     */
    findAll(): Promise<GuildScheduleConfig[]>;

    /**
     * Cập nhật thời gian advanceDay() lần cuối.
     */
    updateLastAdvanced(guildId: string, date: Date): Promise<GuildScheduleConfig>;
}
