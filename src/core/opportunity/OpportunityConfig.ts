// ============================================================
// ECHO — Opportunity Content Configuration
// Nơi định nghĩa các Cơ hội cụ thể dưới dạng dữ liệu cấu hình.
// Đúng nguyên tắc: Content != Engine (Section 27).
// ============================================================

import { Opportunity } from './OpportunityTypes';
import { Weather } from '../world/WorldStateTypes';

export const OPPORTUNITIES: Opportunity[] = [
    {
        id: 'foggy_forest',
        title: '🌲 Sương Mù Trên Rừng Phía Bắc',
        description: 'Hôm nay sương mù tràn qua khu rừng phía Bắc rất dày đặc. Có tiếng động lạ phát ra từ trong các tán cây ẩm ướt...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Fog },
        ],
        choices: [
            {
                id: 'explore_forest',
                text: '🔍 Đi sâu vào rừng khám phá',
                outcome: {
                    text: 'Bạn lần theo tiếng động và phát hiện ra một tảng đá phát sáng cổ xưa. Sau khi cẩn thận tìm kiếm, bạn nhặt được một viên Đá Kỳ Bí!',
                    rewards: [
                        { type: 'xp', amount: 50 },
                        { type: 'item', targetId: 'riddle_stone', itemName: 'Đá Kỳ Bí', itemType: 'key', amount: 1 }
                    ]
                }
            },
            {
                id: 'ask_elias',
                text: '🗣️ Hỏi Elias (NPC) về tiếng động',
                outcome: {
                    text: 'Elias mỉm cười và kể cho bạn nghe truyền thuyết về tảng đá cổ. Mối quan hệ giữa bạn và Elias tốt lên, ông ấy còn cho bạn một quả táo rừng.',
                    rewards: [
                        { type: 'xp', amount: 20 },
                        { type: 'relationship', targetId: 'elias', amount: 15 },
                        { type: 'item', targetId: 'wild_apple', itemName: 'Táo Rừng', itemType: 'usable', amount: 1 }
                    ]
                }
            },
            {
                id: 'ignore_forest',
                text: '🚶 Bỏ qua và quay về thị trấn',
                outcome: {
                    text: 'Bạn chọn an toàn và trở lại thị trấn. Dù không gặp nguy hiểm nhưng bạn cũng không khám phá ra điều gì mới.',
                    rewards: [
                        { type: 'xp', amount: 5 }
                    ]
                }
            }
        ]
    },
    {
        id: 'crystal_peddler',
        title: '💎 Người Bán Tinh Thể Kì Lạ',
        description: 'Một thương nhân trùm đầu kín mít vẫy gọi bạn từ một con hẻm tối. Ông ta chào bán các tinh thể pha lê lấp lánh với giá 50 Gold.',
        conditions: [
            { type: 'level', operator: 'gte', value: 1 } // Luôn hiển thị cho mọi cấp độ
        ],
        choices: [
            {
                id: 'buy_crystal',
                text: '🪙 Mua tinh thể (Tốn 50 Gold)',
                outcome: {
                    text: 'Bạn giao 50 Gold cho thương nhân. Ông ta đưa cho bạn một viên Pha Lê Đỏ lấp lánh đầy năng lượng.',
                    rewards: [
                        { type: 'currency', amount: -50 },
                        { type: 'item', targetId: 'red_crystal', itemName: 'Pha Lê Đỏ', itemType: 'resource', amount: 1 },
                        { type: 'xp', amount: 30 }
                    ]
                }
            },
            {
                id: 'steal_crystal',
                text: '🥷 Lén trộm tinh thể của thương nhân',
                outcome: {
                    text: 'Thương nhân phát hiện ra hành vi trộm cắp của bạn! Ông ta lớn tiếng cảnh cáo và xua đuổi bạn. Người dân xung quanh nhìn bạn bằng ánh mắt thiếu thiện cảm.',
                    rewards: [
                        { type: 'xp', amount: 10 },
                        { type: 'relationship', targetId: 'elias', amount: -10 } // Elias nghe đồn bạn trộm cắp
                    ]
                }
            },
            {
                id: 'ignore_peddler',
                text: '🚶 Lướt qua không bận tâm',
                outcome: {
                    text: 'Bạn từ chối lời chào mời và tiếp tục đi đường của mình.',
                    rewards: []
                }
            }
        ]
    },
    {
        id: 'eclipse_ritual',
        title: '🌑 Nghi Lễ Nguyệt Thực',
        description: 'Khi mặt trăng che khuất mặt trời hoàn toàn, một nhóm người mặc áo choàng đen đang tụ tập quanh giếng cổ của thị trấn để làm lễ cầu nguyện...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Eclipse }
        ],
        choices: [
            {
                id: 'join_ritual',
                text: '🛐 Tham gia nghi lễ cầu nguyện',
                outcome: {
                    text: 'Bạn nhắm mắt và hòa dòng năng lượng của mình với họ. Một ấn ký kỳ bí xuất hiện trên mu bàn tay của bạn. Bạn đã chứng kiến Nghi lễ Nguyệt Thực!',
                    rewards: [
                        { type: 'xp', amount: 100 },
                        { type: 'discovery', targetId: 'eclipse_witness' }
                    ]
                }
            },
            {
                id: 'disrupt_ritual',
                text: '💥 Phá bĩnh nghi lễ',
                outcome: {
                    text: 'Bạn ném đá phá tan nghi lễ. Nhóm người áo đen tức giận giải tán, nhưng một luồng khí đen từ chiếc giếng cổ bám vào bạn. Bạn cảm thấy mệt mỏi.',
                    rewards: [
                        { type: 'xp', amount: -20 },
                        { type: 'item', targetId: 'void_shard', itemName: 'Mảnh Vỡ Hư Vô', itemType: 'key', amount: 1 }
                    ],
                    stateChange: 'cursed'
                }
            }
        ]
    }
];
