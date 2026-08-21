// ============================================================
// ECHO — Notification Service
// Gửi thông báo đến người chơi qua Discord DM.
// Spec ref: Section 32 (Anti-Compulsion), 33 (Daily Budget)
// ============================================================

import { Client, EmbedBuilder, Colors } from 'discord.js';

export class NotificationService {
    private client: Client | null = null;

    /**
     * Gán Discord client để gửi notification.
     * Gọi sau khi client.login() thành công.
     */
    setClient(client: Client): void {
        this.client = client;
    }

    /**
     * Gửi level-up notification qua DM.
     * Nếu không gửi được (DM đóng), fail silently.
     */
    async sendLevelUp(userId: string, newLevel: number, xpNeededForNext: number): Promise<void> {
        if (!this.client) {
            console.warn('[ECHO Notification] Client not set, skipping level-up notification');
            return;
        }

        try {
            const user = await this.client.users.fetch(userId);
            if (!user) return;

            const embed = new EmbedBuilder()
                .setTitle('🎉 Lên Cấp!')
                .setDescription(`Chúc mừng bạn đã đạt **Level ${newLevel}!**`)
                .addFields(
                    {
                        name: '📈 Tiến Trình',
                        value: `XP cần cho Level ${newLevel + 1}: **${xpNeededForNext}** XP`,
                        inline: true,
                    },
                    {
                        name: '💡 Mẹo',
                        value: 'Tiếp tục tương tác với thế giới để nhận thêm XP!',
                        inline: false,
                    }
                )
                .setColor(Colors.Gold)
                .setTimestamp()
                .setFooter({ text: 'ECHO — The world that remembers.' });

            await user.send({ embeds: [embed] });
            console.log(`[ECHO Notification] Level-up DM sent to ${userId}`);
        } catch (error) {
            // DM có thể bị đóng — fail silently
            console.log(`[ECHO Notification] Could not send level-up DM to ${userId} (DM may be closed)`);
        }
    }

    /**
     * Gửi welcome notification cho người chơi mới.
     */
    async sendWelcome(userId: string): Promise<void> {
        if (!this.client) return;

        try {
            const user = await this.client.users.fetch(userId);
            if (!user) return;

            const embed = new EmbedBuilder()
                .setTitle('🌍 Chào Mừng Đến Với ECHO!')
                .setDescription('Bạn vừa bước vào một thế giới luôn ghi nhớ mọi hành động.\n\n*Each day brings a new opportunity. Every choice leaves a trace.*')
                .addFields(
                    {
                        name: '🎮 Bắt Đầu',
                        value: [
                            '• Gõ `/help` để xem hướng dẫn',
                            '• Gõ `/interact` để nhận cơ hội hàng ngày',
                            '• Gõ `/profile` để xem thông tin nhân vật',
                        ].join('\n'),
                        inline: false,
                    }
                )
                .setColor(Colors.Blurple)
                .setTimestamp()
                .setFooter({ text: 'ECHO — The world that remembers.' });

            await user.send({ embeds: [embed] });
            console.log(`[ECHO Notification] Welcome DM sent to ${userId}`);
        } catch (error) {
            console.log(`[ECHO Notification] Could not send welcome DM to ${userId}`);
        }
    }
}

// Singleton instance
export const notificationService = new NotificationService();
