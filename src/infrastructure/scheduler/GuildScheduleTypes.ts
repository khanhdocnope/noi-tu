// ============================================================
// ECHO — Guild Schedule Types
// Định nghĩa kiểu dữ liệu cho lịch advanceDay() của từng guild.
// Spec ref: Section 4 (World Observation), 14 (Server World)
// ============================================================

/**
 * Cấu hình lịch advanceDay() của một Discord Server.
 * Mỗi guild có timezone riêng, chạy lúc 00:00 local.
 *
 * World Speed: Số lần advance_day mỗi real-day.
 * Ví dụ: worldSpeed = 6 → 1 ngày thực = 6 ngày ECHO (mỗi 4 tiếng advance 1 lần).
 */
export interface GuildScheduleConfig {
    guildId: string;
    timezone: string;        // IANA timezone: "Asia/Ho_Chi_Minh", "UTC", "America/New_York"
    scheduleTime: string;    // "HH:mm" format, ví dụ: "00:00"
    enabled: boolean;
    worldSpeed: number;      // Số ECHO-days per real-day (default: 6)
    worldChannelId: string | null;  // Channel ID để auto-announce world state
    lastAdvanced: Date | null;
    createdAt: Date;
}

/**
 * Dữ liệu dùng để cập nhật một phần GuildScheduleConfig.
 */
export type GuildScheduleUpdate = Partial<Omit<GuildScheduleConfig, 'guildId' | 'createdAt'>>;
