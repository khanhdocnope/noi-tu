// ============================================================
// ECHO — Season Engine
// Logic season progression: mỗi 30 ngày chuyển season.
// Spec ref: Section 10 (Progression - World), 14 (Server World)
// ============================================================

import { Season } from '../../core/world/WorldStateTypes';

/**
 * Thứ tự các mùa trong năm.
 */
export const SEASON_ORDER: readonly Season[] = [
    Season.Spring,
    Season.Summer,
    Season.Autumn,
    Season.Winter,
] as const;

/**
 * Số ngày mỗi mùa.
 */
export const DAYS_PER_SEASON = 30;

/**
 * Số ngày mỗi năm (4 mùa × 30 ngày).
 */
export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4;

/**
 * Kiểm tra xem season có cần thay đổi không.
 * Trả về season mới nếu cần đổi, null nếu giữ nguyên.
 *
 * Season thay đổi khi:
 * - dayNumber % DAYS_PER_SEASON == 0
 * - dayNumber > 0
 *
 * Ví dụ:
 * - Day 30: Spring → Summer
 * - Day 60: Summer → Autumn
 * - Day 90: Autumn → Winter
 * - Day 120: Winter → Spring
 */
export function checkSeasonChange(
    currentSeason: Season,
    dayNumber: number
): Season | null {
    if (dayNumber <= 0 || dayNumber % DAYS_PER_SEASON !== 0) {
        return null;
    }

    const currentIndex = SEASON_ORDER.indexOf(currentSeason);
    if (currentIndex === -1) {
        return null;
    }

    const nextIndex = (currentIndex + 1) % SEASON_ORDER.length;
    return SEASON_ORDER[nextIndex];
}

/**
 * Lấy season hiện tại dựa trên dayNumber.
 * Useful cho việc khởi tạo world mới.
 */
export function getSeasonFromDay(dayNumber: number): Season {
    const seasonIndex = Math.floor((dayNumber - 1) / DAYS_PER_SEASON) % SEASON_ORDER.length;
    return SEASON_ORDER[seasonIndex];
}

/**
 * Lấy số ngày còn lại trong season hiện tại.
 */
export function getDaysRemainingInSeason(dayNumber: number): number {
    const positionInSeason = dayNumber % DAYS_PER_SEASON;
    if (positionInSeason === 0) return DAYS_PER_SEASON;
    return DAYS_PER_SEASON - positionInSeason;
}

/**
 * Lấy số ngày còn lại trong năm.
 */
export function getDaysRemainingInYear(dayNumber: number): number {
    const positionInYear = dayNumber % DAYS_PER_YEAR;
    if (positionInYear === 0) return DAYS_PER_YEAR;
    return DAYS_PER_YEAR - positionInYear;
}
