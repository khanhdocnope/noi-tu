// ============================================================
// ECHO — Configuration
// Load và quản lý cấu hình từ environment variables.
// ============================================================

/**
 * Danh sách User IDs được phép dùng lệnh privileged.
 * Format trong .env: ALLOWED_USERS=123456,789012
 */
const ALLOWED_USERS_RAW = process.env.ALLOWED_USERS || '';

/**
 * Parse và cache allowed user IDs.
 */
const ALLOWED_USER_IDS: Set<string> = new Set(
    ALLOWED_USERS_RAW
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
);

/**
 * Kiểm tra user có được phép dùng lệnh privileged không.
 * - Nếu danh sách rỗng → ai cũng được dùng (cho phép development)
 * - Nếu có danh sách → chỉ user trong danh sách mới được dùng
 */
export function isPrivilegedUser(userId: string): boolean {
    // Nếu không set ALLOWED_USERS → cho phép tất cả (dev mode)
    if (ALLOWED_USER_IDS.size === 0) {
        return true;
    }

    return ALLOWED_USER_IDS.has(userId);
}

/**
 * Lấy danh sách allowed user IDs (để hiển thị nếu cần).
 */
export function getAllowedUserIds(): string[] {
    return Array.from(ALLOWED_USER_IDS);
}

/**
 * Kiểm tra特权 lệnh có bị giới hạn không.
 */
export function isPrivilegedMode(): boolean {
    return ALLOWED_USER_IDS.size > 0;
}

// Log khi startup
if (ALLOWED_USER_IDS.size > 0) {
    console.log(`[ECHO Config] Privileged mode: ${ALLOWED_USER_IDS.size} allowed user(s)`);
} else {
    console.log('[ECHO Config] Dev mode: All users can use privileged commands');
}
