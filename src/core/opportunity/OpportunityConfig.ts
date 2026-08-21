// ============================================================
// ECHO — Opportunity Content Configuration
// Nơi định nghĩa các Cơ hội cụ thể dưới dạng dữ liệu cấu hình.
// Đúng nguyên tắc: Content != Engine (Section 27).
// Chain Opportunities: Spec ref Section 12 (Maybe Tomorrow)
// ============================================================

import { Opportunity } from './OpportunityTypes';
import { Weather, Season } from '../world/WorldStateTypes';

export const OPPORTUNITIES: Opportunity[] = [

    // ================================================================
    // 1. CƠ HỘI THEO THỜI TIẾT (Weather-based)
    // ================================================================

    // --- Sương mù: RISKY (60% thành công, 30% thất bại, 10% critical) ---
    {
        id: 'foggy_forest',
        title: '🌲 Sương Mù Trên Rừng Phía Bắc',
        description: 'Hôm nay sương mù tràn qua khu rừng phía Bắc rất dày đặc. Có tiếng động lạ phát ra từ trong các tán cây ẩm ướt...',
        riskLevel: 'risky',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Fog },
        ],
        choices: [
            {
                id: 'explore_forest',
                text: '🔍 Đi sâu vào rừng khám phá',
                revealRewards: false, // Ẩn phần thưởng — player không biết trước
                outcome: {
                    results: [
                        {
                            weight: 60,
                            text: 'Bạn lần theo tiếng động và phát hiện ra một tảng đá phát sáng cổ xưa! Đây là Đá Kỳ Bí — một vật phẩm quý hiếm!',
                            rewards: [
                                { type: 'xp', amount: 50 },
                                { type: 'item', targetId: 'riddle_stone', itemName: 'Đá Kỳ Bí', itemType: 'key', amount: 1 }
                            ],
                            nextOpportunityId: 'riddle_stone_mystery',
                            tag: 'success',
                        },
                        {
                            weight: 30,
                            text: 'Bạn lạc trong sương mù và cuối cùng quay lại điểm đầu. Không có gì mới, nhưng bạn cũng không mất mát gì.',
                            rewards: [
                                { type: 'xp', amount: 10 }
                            ],
                            tag: 'partial',
                        },
                        {
                            weight: 10,
                            text: 'Bạn bị trượt ngã trên vách đá và bị thương nhẹ. May mắn là không có gì nghiêm trọng.',
                            rewards: [
                                { type: 'xp', amount: -15 },
                                { type: 'currency', amount: -10 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            },
            {
                id: 'ask_elias',
                text: '🗣️ Hỏi Elias (NPC) về tiếng động',
                revealRewards: true, // Hiện phần thưởng — an toàn
                outcome: {
                    results: [
                        {
                            weight: 80,
                            text: 'Elias mỉm cười và kể cho bạn nghe truyền thuyết về tảng đá cổ. Ông ấy cho bạn một quả táo rừng.',
                            rewards: [
                                { type: 'xp', amount: 20 },
                                { type: 'relationship', targetId: 'elias', amount: 15 },
                                { type: 'item', targetId: 'wild_apple', itemName: 'Táo Rừng', itemType: 'usable', amount: 1 }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 20,
                            text: 'Elias bận rộn và không thể nói chuyện. Bạn rời đi mà không nhận được gì.',
                            rewards: [
                                { type: 'xp', amount: 5 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            },
            {
                id: 'ignore_forest',
                text: '🚶 Bỏ qua và quay về thị trấn',
                revealRewards: true,
                outcome: {
                    results: [
                        {
                            weight: 100,
                            text: 'Bạn chọn an toàn và trở lại thị trấn. Dù không gặp nguy hiểm nhưng bạn cũng không khám phá ra điều gì mới.',
                            rewards: [
                                { type: 'xp', amount: 5 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            }
        ]
    },

    // --- Trời quang đãng: SAFE ---
    {
        id: 'sunny_market',
        title: '☀️ Chợ Nông Sản Ngày Nắng',
        description: 'Trời nắng đẹp, người dân thị trấn bày bán nông sản tươi ngon ngoài trời. Bạn thấy một quầy hàng có viên ngọc lấp lánh...',
        riskLevel: 'safe',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Clear }
        ],
        choices: [
            {
                id: 'browse_jewels',
                text: '💎 Xem ngọc quý',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 70,
                            text: 'Chủ quầy giới thiệu cho bạn một viên Ngọc Lam Skyline tuyệt đẹp. Bạn phải lòng nó!',
                            rewards: [
                                { type: 'xp', amount: 25 },
                                { type: 'currency', amount: -30 },
                                { type: 'item', targetId: 'skyline_gem', itemName: 'Ngọc Lam Skyline', itemType: 'equipment', amount: 1 }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 30,
                            text: 'Viên ngọc đẹp nhưng quá đắt. Bạn quyết định không mua.',
                            rewards: [
                                { type: 'xp', amount: 10 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            },
            {
                id: 'buy_food',
                text: '🍎 Mua trái cây tươi',
                revealRewards: true,
                outcome: {
                    results: [
                        {
                            weight: 100,
                            text: 'Bạn mua một giỏ trái cây tươi ngon!',
                            rewards: [
                                { type: 'currency', amount: -10 },
                                { type: 'item', targetId: 'fresh_fruits', itemName: 'Trái Cây Tươi', itemType: 'usable', amount: 3 }
                            ],
                            tag: 'success',
                        }
                    ]
                }
            }
        ]
    },

    // --- Bão tố: MODERATE ---
    {
        id: 'summer_storm',
        title: '⛈️ Bão Mùa Hè',
        description: 'Một cơn bão lớn đang ập đến. Gió thổi mạnh và sét đánh liên hồi. Bạn thấy một cành cây lớn sắp đổ xuống ngôi nhà của người dân...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Storm },
            { type: 'season', operator: 'eq', value: Season.Summer }
        ],
        choices: [
            {
                id: 'save_house',
                text: '🏠 Cứu ngôi nhà khỏi cành cây',
                outcome: {
                    text: 'Bạn dùng kiếm chặt đứt cành cây trước khi nó đổ xuống. Ngôi nhà được cứu, nhưng bạn bị thương nhẹ. Chủ nhà rất biết ơn!',
                    rewards: [
                        { type: 'xp', amount: 60 },
                        { type: 'relationship', targetId: 'villager', amount: 25 },
                        { type: 'item', targetId: 'herb_pouch', itemName: 'Túi Thảo Dược', itemType: 'usable', amount: 2 }
                    ]
                }
            },
            {
                id: 'find_shelter',
                text: '🏚️ Tìm chỗ trú an toàn',
                outcome: {
                    text: 'Bạn tìm một hầm trú ẩn an toàn. Khi bão tan, bạn thấy ngôi nhà đã bị hư hại nặng nề.',
                    rewards: [
                        { type: 'xp', amount: 10 }
                    ]
                }
            }
        ]
    },

    // --- Nắng nóng ---
    {
        id: 'heatwave_well',
        title: '🔥 Nắng Nóng Khắc Nghiệt',
        description: 'Cái nóng thiêu đốt. Nguồn nước duy nhất trong thị trấn là chiếc giếng cổ, nhưng có vẻ như nước ở đó đang cạn kiệt...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Heatwave }
        ],
        choices: [
            {
                id: 'dig_well',
                text: '⛏️ Đào sâu hơn vào giếng',
                outcome: {
                    text: 'Bạn đào sâu thêm và phát hiện một dòng nước ngầm! Nước trong vắt và mát lạnh. Cả thị trấn đều biết ơn bạn!',
                    rewards: [
                        { type: 'xp', amount: 70 },
                        { type: 'relationship', targetId: 'villager', amount: 30 },
                        { type: 'discovery', targetId: 'underground_spring' }
                    ]
                }
            },
            {
                id: 'find_other_source',
                text: '🏞️ Tìm nguồn nước khác',
                outcome: {
                    text: 'Bạn ra ngoài thị trấn tìm suối. Sau vài giờ đi bộ, bạn tìm thấy một dòng suối nhỏ-hidden.',
                    rewards: [
                        { type: 'xp', amount: 40 },
                        { type: 'item', targetId: 'water_flask', itemName: 'Bình Nước Suối', itemType: 'usable', amount: 2 },
                        { type: 'discovery', targetId: 'hidden_stream' }
                    ]
                }
            },
            {
                id: 'wait_it_out',
                text: '😎 Đợi trời tối',
                outcome: {
                    text: 'Bạn quyết định đợi trời mát rồi mới ra ngoài. Đúng là cách an toàn nhất.',
                    rewards: [
                        { type: 'xp', amount: 5 }
                    ]
                }
            }
        ]
    },

    // --- Tuyết ---
    {
        id: 'winter_snow',
        title: '❄️ Tuyết Rơi Đầu Mùa',
        description: 'Những bông tuyết đầu mùa đang rơi nhẹ nhàng. Trong vườn hoa thị trấn, bạn thấy một sinh vật nhỏ bé đang bị lạnh cóng...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Snow },
            { type: 'season', operator: 'eq', value: Season.Winter }
        ],
        choices: [
            {
                id: 'help_creature',
                text: '🤲 Cứu sinh vật nhỏ',
                outcome: {
                    text: 'Bạn ôm sinh vật nhỏ vào lòng và sưởi ấm cho nó. Đột nhiên, nó biến thành một tinh linh tuyết và ban cho bạn một điều ước nhỏ!',
                    rewards: [
                        { type: 'xp', amount: 80 },
                        { type: 'item', targetId: 'snow_fairy_dust', itemName: 'Bụi Tinh Linh Tuyết', itemType: 'resource', amount: 2 },
                        { type: 'discovery', targetId: 'snow_fairy_encounter' }
                    ]
                }
            },
            {
                id: 'ignore_creature',
                text: '🚶 Tiếp tục đi',
                outcome: {
                    text: 'Bạn đi qua mà không để ý. Khi nhìn lại, sinh vật nhỏ đã biến mất trong tuyết.',
                    rewards: [
                        { type: 'xp', amount: 5 }
                    ]
                }
            }
        ]
    },

    // --- Nguyệt thực ---
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
    },

    // ================================================================
    // 2. CƠ HỘI THEO MÙA (Season-based)
    // ================================================================

    // --- Mùa xuân ---
    {
        id: 'spring_flowers',
        title: '🌸 Mùa Xuân Rực Rỡ',
        description: 'Mùa xuân đã về. Hoa nở khắp nơi, và bạn nghe nói rằng có một cánh đồng hoa bí ẩn chỉ xuất hiện vào mùa này...',
        conditions: [
            { type: 'season', operator: 'eq', value: Season.Spring }
        ],
        choices: [
            {
                id: 'find_flower_field',
                text: '🌺 Tìm cánh đồng hoa bí ẩn',
                outcome: {
                    text: 'Bạn lần theo hương thơm và tìm thấy một cánh đồng hoa anh đào tuyệt đẹp. Ở giữa cánh đồng có một hồ nước trong vắt!',
                    rewards: [
                        { type: 'xp', amount: 50 },
                        { type: 'item', targetId: 'cherry_blossom', itemName: 'Hoa Anh Đào', itemType: 'resource', amount: 3 },
                        { type: 'discovery', targetId: 'hidden_flower_field' }
                    ]
                }
            },
            {
                id: 'plant_seeds',
                text: '🌱 Gieo hạt giống trong vườn',
                outcome: {
                    text: 'Bạn gieo hạt giống vào vườn thị trấn. Tháng sau, những bông hoa đầu tiên sẽ nở!',
                    rewards: [
                        { type: 'xp', amount: 30 },
                        { type: 'relationship', targetId: 'gardener', amount: 20 }
                    ]
                }
            }
        ]
    },

    // --- Mùa hè ---
    {
        id: 'summer_rain',
        title: '🌧️ Cơn Mưa Mùa Hè',
        description: 'Một cơn mưa rào bất chợt đổ xuống thị trấn. Trong cơn mưa, bạn thấy một chiếc hộp gỗ trôi dạt từ con suối gần đó...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Rain },
            { type: 'season', operator: 'eq', value: Season.Summer }
        ],
        choices: [
            {
                id: 'retrieve_box',
                text: '📦 Lấy chiếc hộp gỗ',
                outcome: {
                    text: 'Bạn lội xuống suối và nhặt chiếc hộp lên. Bên trong là một bản đồ cũ bị rách một phần...',
                    rewards: [
                        { type: 'xp', amount: 40 },
                        { type: 'item', targetId: 'torn_map', itemName: 'Bản Đồ Rách', itemType: 'key', amount: 1 },
                        { type: 'discovery', targetId: 'old_map_fragment' }
                    ],
                    nextOpportunityId: 'map_treasure_hunt'
                }
            },
            {
                id: 'ignore_rain',
                text: '☔ Tìm chỗ trú mưa',
                outcome: {
                    text: 'Bạn tìm một mái hiên để trú mưa. Khi mưa tạnh, chiếc hộp đã bị nước cuốn đi mất.',
                    rewards: [
                        { type: 'xp', amount: 5 }
                    ]
                }
            }
        ]
    },

    // --- Mùa thu ---
    {
        id: 'autumn_leaves',
        title: '🍂 Lá Rụng Mùa Thu',
        description: 'Lá vàng rơi khắp nơi. Trong rừng, bạn thấy một chiếc lá đỏ rực phát sáng kỳ lạ giữa đám lá vàng...',
        conditions: [
            { type: 'season', operator: 'eq', value: Season.Autumn }
        ],
        choices: [
            {
                id: 'pick_red_leaf',
                text: '🍁 Nhặt chiếc lá đỏ',
                outcome: {
                    text: 'Bạn nhặt chiếc lá lên. Nó phát ra ánh sáng ấm áp và biến mất, để lại trên tay bạn một viên đá nhỏ phát sáng!',
                    rewards: [
                        { type: 'xp', amount: 45 },
                        { type: 'item', targetId: 'autumn_stone', itemName: 'Đá Mùa Thu', itemType: 'key', amount: 1 },
                        { type: 'discovery', targetId: 'autumn_magic' }
                    ]
                }
            },
            {
                id: 'collect_leaves',
                text: '🍂 Thu thập lá vàng',
                outcome: {
                    text: 'Bạn thu thập những chiếc lá đẹp nhất. Chúng sẽ là nguyên liệu tuyệt vời cho thuốc nhuộm!',
                    rewards: [
                        { type: 'xp', amount: 20 },
                        { type: 'item', targetId: 'golden_leaves', itemName: 'Lá Vàng', itemType: 'resource', amount: 5 }
                    ]
                }
            }
        ]
    },

    // --- Mùa đông ---
    {
        id: 'winter_fire',
        title: '🔥 Lò Sưởi Mùa Đông',
        description: 'Mùa đông lạnh giá. Bạn thấy một cụ già đang struggle để nhóm lửa ngoài trời...',
        conditions: [
            { type: 'season', operator: 'eq', value: Season.Winter }
        ],
        choices: [
            {
                id: 'help_elder',
                text: '👴 Giúp cụ già nhóm lửa',
                outcome: {
                    text: 'Bạn giúp cụ già nhóm lửa. Ông ấy kể cho bạn nghe một câu chuyện cổ về kho báu bị thất lạc...',
                    rewards: [
                        { type: 'xp', amount: 35 },
                        { type: 'relationship', targetId: 'elder', amount: 20 },
                        { type: 'discovery', targetId: 'elder_story' }
                    ]
                }
            },
            {
                id: 'ignore_elder',
                text: '🚶 Tiếp tục đi',
                outcome: {
                    text: 'Bạn đi qua mà không để ý. Tiếng gió rít làm bạn rùng mình.',
                    rewards: [
                        { type: 'xp', amount: 5 }
                    ]
                }
            }
        ]
    },

    // ================================================================
    // 3. CƠ HỘI YÊU CẦU CẤP ĐỘ (Level-gated)
    // ================================================================

    // --- Level 5+ ---
    {
        id: 'dungeon_entrance',
        title: '🚪 Lối Vào Dũng Hãm',
        description: 'Bạn đã trở nên mạnh mẽ hơn. Trước mặt bạn là lối vào một dungeon cổ xưa, nơi mà chỉ những chiến binh thực sự mới dám bước vào...',
        conditions: [
            { type: 'level', operator: 'gte', value: 5 }
        ],
        choices: [
            {
                id: 'enter_dungeon',
                text: '⚔️ Bước vào dungeon',
                outcome: {
                    text: 'Bạn bước vào bóng tối. Bên trong là những thử thách khó khăn, nhưng phần thưởng xứng đáng!',
                    rewards: [
                        { type: 'xp', amount: 100 },
                        { type: 'currency', amount: 80 },
                        { type: 'item', targetId: 'dungeon_trophy', itemName: 'Chiến Tích Dungeon', itemType: 'equipment', amount: 1 }
                    ]
                }
            },
            {
                id: 'observe_entrance',
                text: '👁️ Quan sát từ bên ngoài',
                outcome: {
                    text: 'Bạn quyết định quan sát kỹ lối vào trước khi quyết định. Có vẻ có những cái bẫy nguy hiểm...',
                    rewards: [
                        { type: 'xp', amount: 20 },
                        { type: 'discovery', targetId: 'dungeon_observed' }
                    ]
                }
            }
        ]
    },

    // --- Level 10+ ---
    {
        id: 'arena_challenge',
        title: '🏟️ Thách Đầu Thủ Lĩnh',
        description: 'Tin tức về sức mạnh của bạn đã đến tai thủ lĩnh của băng cướp. Ông ta thách đấu bạn trực tiếp!',
        conditions: [
            { type: 'level', operator: 'gte', value: 10 }
        ],
        choices: [
            {
                id: 'accept_duel',
                text: '⚔️ Chấp nhận thách đấu',
                outcome: {
                    text: 'Cuộc chiến khốc liệt diễn ra. Sau những đòn đánh quyết liệt, bạn đã chiến thắng! Thủ lĩnh băng cướp chịu thua và tuyên bố giải thể băng nhóm.',
                    rewards: [
                        { type: 'xp', amount: 150 },
                        { type: 'currency', amount: 200 },
                        { type: 'discovery', targetId: 'bandit_leader_defeated' }
                    ]
                }
            },
            {
                id: 'negotiate',
                text: '🤝 Đàm phán',
                outcome: {
                    text: 'Bạn đề nghị một thỏa thuận: thủ lĩnh rời đi và không bao giờ trở lại, đổi lấy sự tha thứ. Ông ta chấp nhận.',
                    rewards: [
                        { type: 'xp', amount: 80 },
                        { type: 'relationship', targetId: 'bandit_leader', amount: -20 }
                    ]
                }
            }
        ]
    },

    // --- Level 15+ ---
    {
        id: 'ancient_library',
        title: '📚 Thư Viện Cổ Đại',
        description: 'Bạn đã mở khóa kiến thức cổ đại. Trước mắt bạn là một thư viện ẩn giấu với hàng ngàn cuốn sách bị thất lạc...',
        conditions: [
            { type: 'level', operator: 'gte', value: 15 }
        ],
        choices: [
            {
                id: 'study_spells',
                text: '📖 Học pháp thuật cổ',
                outcome: {
                    text: 'Bạn dành hàng giờ nghiên cứu và học được một phép thuật mạnh mẽ từ thời cổ đại!',
                    rewards: [
                        { type: 'xp', amount: 200 },
                        { type: 'item', targetId: 'ancient_spellbook', itemName: 'Sách Phép Cổ', itemType: 'equipment', amount: 1 }
                    ]
                }
            },
            {
                id: 'read_history',
                text: '📜 Đọc lịch sử thế giới',
                outcome: {
                    text: 'Bạn đọc những cuốn sách lịch sử và khám phá ra bí mật về nguồn gốc của thế giới này...',
                    rewards: [
                        { type: 'xp', amount: 120 },
                        { type: 'discovery', targetId: 'world_history_lore' }
                    ]
                }
            }
        ]
    },

    // ================================================================
    // 4. CƠ HỘI YÊU CẦU VẬT PHẨM (Item-requirement)
    // ================================================================

    // --- Cần Đá Mùa Thu ---
    {
        id: 'autumn_stone_power',
        title: '🍁 Sức Mạnh Đá Mùa Thu',
        description: 'Đá Mùa Thu trên tay bạn đang phát ra ánh sáng ấm áp. Có vẻ như nó có thể được sử dụng để hồi phục năng lượng...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'autumn_stone' }
        ],
        choices: [
            {
                id: 'use_stone',
                text: '✨ Sử dụng Đá Mùa Thu',
                outcome: {
                    text: 'Bạn tập trung năng lượng vào viên đá. Một luồng sức mạnh ấm áp chảy vào cơ thể, hồi phục hoàn toàn!',
                    rewards: [
                        { type: 'xp', amount: 60 },
                        { type: 'item', targetId: 'autumn_stone', itemName: 'Đá Mùa Thu', itemType: 'key', amount: -1 }
                    ]
                }
            },
            {
                id: 'keep_stone',
                text: '🔐 Giữ viên đá',
                outcome: {
                    text: 'Bạn giữ viên đá. Có lẽ bạn sẽ cần nó vào lúc khác.',
                    rewards: [
                        { type: 'xp', amount: 15 }
                    ]
                }
            }
        ]
    },

    // ================================================================
    // 5. CƠ HỘI YÊU CẦU MỐI QUAN HỆ (Relationship-gated)
    // ================================================================

    // --- Elias thân thiết ---
    {
        id: 'elias_secret',
        title: '🤫 Bí Mật Của Elias',
        description: 'Elias gọi bạn đến gặp ông ấy trong bí mật. Có vẻ như ông ấy muốn chia sẻ một bí mật quan trọng...',
        conditions: [
            { type: 'relationship', operator: 'gte', targetId: 'elias', value: 50 }
        ],
        choices: [
            {
                id: 'hear_secret',
                text: '👂 Nghe Elias kể bí mật',
                outcome: {
                    text: 'Elias tiết lộ rằng ông ấy từng là một nhà thám hiểm nổi tiếng. Ông ấy đưa cho bạn một bản đồ kho báu cá nhân!',
                    rewards: [
                        { type: 'xp', amount: 100 },
                        { type: 'item', targetId: 'elias_map', itemName: 'Bản Đồ Elias', itemType: 'key', amount: 1 },
                        { type: 'discovery', targetId: 'elias_past' }
                    ]
                }
            },
            {
                id: 'keep_secret',
                text: '🤐 Giữ bí mật cho Elias',
                outcome: {
                    text: 'Bạn hứa sẽ giữ bí mật. Elias cảm ơn bạn và mối quan hệ giữa hai người càng thêm sâu đậm.',
                    rewards: [
                        { type: 'xp', amount: 50 },
                        { type: 'relationship', targetId: 'elias', amount: 25 }
                    ]
                }
            }
        ]
    },

    // --- Villager thân thiết ---
    {
        id: 'villager_festival',
        title: '🎉 Lễ Hội Thị Trấn',
        description: 'Người dân thị trấn tổ chức lễ hội và mời bạn tham dự. Bạn được coi như một phần của cộng đồng!',
        conditions: [
            { type: 'relationship', operator: 'gte', targetId: 'villager', value: 40 }
        ],
        choices: [
            {
                id: 'join_festival',
                text: '🎊 Tham gia lễ hội',
                outcome: {
                    text: 'Bạn hòa vào không khí lễ hội. Những điệu nhảy, âm nhạc và thức ăn ngon làm bạn quên đi mọi lo lắng!',
                    rewards: [
                        { type: 'xp', amount: 80 },
                        { type: 'currency', amount: 50 },
                        { type: 'item', targetId: 'festival_token', itemName: 'Phiếu Lễ Hội', itemType: 'resource', amount: 5 }
                    ]
                }
            },
            {
                id: 'help_organize',
                text: '🤝 Giúp tổ chức',
                outcome: {
                    text: 'Bạn giúp mọi người chuẩn bị lễ hội. Sự nhiệt tình của bạn được mọi người ghi nhận!',
                    rewards: [
                        { type: 'xp', amount: 60 },
                        { type: 'relationship', targetId: 'villager', amount: 30 }
                    ]
                }
            }
        ]
    },

    // ================================================================
    // 6. CƠ HỘI KẾT HỢP NHIỀU ĐIỀU KIỆN
    // ================================================================

    // --- Level 5+ VÀ Mùa xuân ---
    {
        id: 'spring_tournament',
        title: '🏆 Giải Đấu Mùa Xuân',
        description: 'Giải đấu mùa xuân bắt đầu! Chỉ những chiến binh level 5 trở lên mới được tham gia...',
        conditions: [
            { type: 'level', operator: 'gte', value: 5 },
            { type: 'season', operator: 'eq', value: Season.Spring }
        ],
        choices: [
            {
                id: 'join_tournament',
                text: '⚔️ Tham gia giải đấu',
                outcome: {
                    text: 'Bạn thể hiện kỹ năng chiến đấu xuất sắc và giành chiến thắng! Mọi người tung hô bạn như một anh hùng!',
                    rewards: [
                        { type: 'xp', amount: 120 },
                        { type: 'currency', amount: 100 },
                        { type: 'item', targetId: 'champion_trophy', itemName: 'Cúp Vô Địch', itemType: 'equipment', amount: 1 }
                    ]
                }
            },
            {
                id: 'watch_tournament',
                text: '👁️ Xem giải đấu',
                outcome: {
                    text: 'Bạn ngồi xem và học hỏi từ các chiến binh khác. Bạn rút ra được nhiều bài học quý giá!',
                    rewards: [
                        { type: 'xp', amount: 40 },
                        { type: 'discovery', targetId: 'tournament_watcher' }
                    ]
                }
            }
        ]
    },

    // --- Level 10+ VÀ Đã có Discovery ---
    {
        id: 'ancient_ruins',
        title: '🏛️ Phá Cổ Đại',
        description: 'Bạn đã khám phá bí mật về phá cổ đại. Giờ là lúc bước vào và tìm hiểu những gì ẩn giấu bên trong...',
        conditions: [
            { type: 'level', operator: 'gte', value: 10 }
        ],
        choices: [
            {
                id: 'explore_ruins',
                text: '🔍 Khám phá phá cổ đại',
                outcome: {
                    text: 'Bên trong phá là những biểu tượng kỳ lạ và kho báu cổ xưa. Bạn tìm thấy một cuốn sách ma thuật!',
                    rewards: [
                        { type: 'xp', amount: 150 },
                        { type: 'item', targetId: 'ancient_book', itemName: 'Sách Ma Thuật Cổ', itemType: 'equipment', amount: 1 },
                        { type: 'discovery', targetId: 'ruins_explored' }
                    ]
                }
            },
            {
                id: 'map_ruins',
                text: '🗺️ Lập bản đồ phá',
                outcome: {
                    text: 'Bạn cẩn thận lập bản đồ toàn bộ khu vực. Thông tin này sẽ rất hữu ích cho các nhà thám hiểm sau này!',
                    rewards: [
                        { type: 'xp', amount: 80 },
                        { type: 'item', targetId: 'ruins_map', itemName: 'Bản Đồ Phá', itemType: 'key', amount: 1 }
                    ]
                }
            }
        ]
    },

    // ================================================================
    // 7. CƠ HỘI MỚI (New Opportunities)
    // ================================================================

    // --- Thương nhân bí ẩn ---
    {
        id: 'mysterious_trader',
        title: '🎭 Thương Nhân Bí Ẩn',
        description: 'Một thương nhân lạ mặt xuất hiện ở thị trấn. Ông ta bán những vật phẩm hiếm với giá phải chăng...',
        conditions: [
            { type: 'level', operator: 'gte', value: 3 }
        ],
        choices: [
            {
                id: 'buy_rare_item',
                text: '💎 Mua vật phẩm hiếm (100 Gold)',
                outcome: {
                    text: 'Bạn mua một vật phẩm hiếm từ thương nhân. Ông ta biến mất ngay sau đó như một làn khói...',
                    rewards: [
                        { type: 'currency', amount: -100 },
                        { type: 'item', targetId: 'rare_artifact', itemName: 'Cổ Vật Hiếm', itemType: 'equipment', amount: 1 },
                        { type: 'xp', amount: 50 }
                    ]
                }
            },
            {
                id: 'ask_about_past',
                text: '❓ Hỏi về quá khứ của ông ta',
                outcome: {
                    text: 'Thương nhân nhìn bạn với ánh mắt sâu thẳm và nói: "Quá khứ chỉ là ảo ảnh. Hãy sống cho hiện tại."',
                    rewards: [
                        { type: 'xp', amount: 30 },
                        { type: 'discovery', targetId: 'mysterious_trader_lore' }
                    ]
                }
            },
            {
                id: 'ignore_trader',
                text: '🚶 Lướt qua',
                outcome: {
                    text: 'Bạn quyết định không mua gì. Khi bạn ngoảnh lại, thương nhân đã biến mất.',
                    rewards: [
                        { type: 'xp', amount: 5 }
                    ]
                }
            }
        ]
    },

    // --- Bí ẩn giếng cổ ---
    {
        id: 'well_mystery',
        title: '🕳️ Bí Ẩn Giếng Cổ',
        description: 'Chiếc giếng cổ trong thị trấn phát ra ánh sáng kỳ lạ vào ban đêm. Có vẻ như có thứ gì đó ở bên dưới...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Clear }
        ],
        choices: [
            {
                id: 'descend_well',
                text: '⬇️ Xuống giếng khám phá',
                outcome: {
                    text: 'Bạn xuống giếng và phát hiện một hệ thống hang động rộng lớn bên dưới. Ở đó có một kho báu cổ!',
                    rewards: [
                        { type: 'xp', amount: 90 },
                        { type: 'currency', amount: 75 },
                        { type: 'discovery', targetId: 'well_cave' }
                    ]
                }
            },
            {
                id: 'observe_from_above',
                text: '👁️ Quan sát từ trên',
                outcome: {
                    text: 'Bạn quan sát từ miệng giếng. Ánh sáng có vẻ phát ra từ một tinh thể lớn ở dưới đáy...',
                    rewards: [
                        { type: 'xp', amount: 25 },
                        { type: 'discovery', targetId: 'well_light_observed' }
                    ]
                }
            }
        ]
    },

    // --- Trộm cắp NPC ---
    {
        id: 'thief_encounter',
        title: '🥷 Cuộc Gặp Gỡ Với Kẻ Trộm',
        description: 'Bạn bắt gặp một kẻ trộm đang lục soát nhà của người dân. Hắn trông thấy bạn và rút dao ra đe dọa...',
        conditions: [
            { type: 'level', operator: 'gte', value: 3 }
        ],
        choices: [
            {
                id: 'fight_thief',
                text: '⚔️ Đánh hắn',
                outcome: {
                    text: 'Bạn chiến đấu với kẻ trộm và giành chiến thắng. Hắn bỏ chạy để lại một túi đồ ăn cắp!',
                    rewards: [
                        { type: 'xp', amount: 60 },
                        { type: 'currency', amount: 40 },
                        { type: 'item', targetId: 'stolen_goods', itemName: 'Hàng Ăn Cắp', itemType: 'resource', amount: 2 }
                    ]
                }
            },
            {
                id: 'negotiate_thief',
                text: '🤝 Đàm phán với hắn',
                outcome: {
                    text: 'Bạn đề nghị kẻ trộm trả lại đồ và rời đi. Hắn do dự rồi đồng ý, để lại một ít vàng và bỏ chạy.',
                    rewards: [
                        { type: 'xp', amount: 30 },
                        { type: 'currency', amount: 20 }
                    ]
                }
            },
            {
                id: 'call_for_help',
                text: '🚨 Gọi người dân',
                outcome: {
                    text: 'Bạn hét lớn gọi người dân. Kẻ trộm hoảng sợ bỏ chạy, nhưng hắn ném lại một con dao găm!',
                    rewards: [
                        { type: 'xp', amount: 40 },
                        { type: 'item', targetId: 'thief_dagger', itemName: 'Dao Găm Kẻ Trộm', itemType: 'equipment', amount: 1 }
                    ]
                }
            }
        ]
    },

    // --- Thiên thạch ---
    {
        id: 'meteorite_fall',
        title: '☄️ Thiên Thạch Rơi',
        description: 'Một quả thiên thạch rơi xuống cánh đồng gần thị trấn. Khói bốc lên nghi ngút...',
        conditions: [
            { type: 'level', operator: 'gte', value: 7 }
        ],
        choices: [
            {
                id: 'examine_meteorite',
                text: '🔬 Nghiên cứu thiên thạch',
                outcome: {
                    text: 'Bạn tìm thấy một loại khoáng chất lạ trong thiên thạch. Nó có thể dùng để chế tạo vũ khí mạnh!',
                    rewards: [
                        { type: 'xp', amount: 100 },
                        { type: 'item', targetId: 'meteorite_ore', itemName: 'Quặng Thiên Thạch', itemType: 'resource', amount: 3 },
                        { type: 'discovery', targetId: 'meteorite_research' }
                    ]
                }
            },
            {
                id: 'harvest_meteorite',
                text: '⛏️ Thu thập quặng',
                outcome: {
                    text: 'Bạn thu thập quặng thiên thạch từ tảng đá nóng. Đây sẽ là nguyên liệu quý giá!',
                    rewards: [
                        { type: 'xp', amount: 60 },
                        { type: 'item', targetId: 'meteorite_ore', itemName: 'Quặng Thiên Thạch', itemType: 'resource', amount: 5 }
                    ]
                }
            }
        ]
    },

    // --- Thác nước ---
    {
        id: 'waterfall_discovery',
        title: '💧 Phát Hiện Thác Nước',
        description: 'Bạn nghe nói về một thác nước ẩn trong rừng. Nó có thể là lối vào một hang động bí mật...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Rain }
        ],
        choices: [
            {
                id: 'explore_waterfall',
                text: '🏊 Bơi đến thác nước',
                outcome: {
                    text: 'Bạn bơi qua dòng nước mạnh và phát hiện một hang động phía sau thác nước. Bên trong có kho báu!',
                    rewards: [
                        { type: 'xp', amount: 85 },
                        { type: 'currency', amount: 60 },
                        { type: 'discovery', targetId: 'waterfall_cave' }
                    ]
                }
            },
            {
                id: 'collect_water',
                text: '🫙 Thu thập nước',
                outcome: {
                    text: 'Bạn thu thập nước trong vắt từ thác nước. Đây là loại nước tinh khiết nhất mà bạn từng thấy!',
                    rewards: [
                        { type: 'xp', amount: 25 },
                        { type: 'item', targetId: 'pure_water', itemName: 'Nước Tinh Khiết', itemType: 'usable', amount: 3 }
                    ]
                }
            }
        ]
    },

    // --- Thương nhân tinh thể ---
    {
        id: 'crystal_peddler',
        title: '💎 Người Bán Tinh Thể Kì Lạ',
        description: 'Một thương nhân trùm đầu kín mít vẫy gọi bạn từ một con hẻm tối. Ông ta chào bán các tinh thể pha lê lấp lánh với giá 50 Gold.',
        conditions: [
            { type: 'level', operator: 'gte', value: 1 }
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
                    ],
                    nextOpportunityId: 'crystal_crafting'
                }
            },
            {
                id: 'steal_crystal',
                text: '🥷 Lén trộm tinh thể của thương nhân',
                outcome: {
                    text: 'Thương nhân phát hiện ra hành vi trộm cắp của bạn! Ông ta lớn tiếng cảnh cáo và xua đuổi bạn. Người dân xung quanh nhìn bạn bằng ánh mắt thiếu thiện cảm.',
                    rewards: [
                        { type: 'xp', amount: 10 },
                        { type: 'relationship', targetId: 'elias', amount: -10 }
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

    // --- Bài kiểm tra NPC ---
    {
        id: 'npc_test',
        title: '🧩 Bài Kiểm Tra Của NPC',
        description: 'Một NPC bí ẩn xuất hiện và đặt ra cho bạn một câu đố. Nếu trả lời đúng, bạn sẽ nhận được phần thưởng!',
        conditions: [
            { type: 'level', operator: 'gte', value: 2 }
        ],
        choices: [
            {
                id: 'solve_riddle',
                text: '🧠 Trả lời câu đố',
                outcome: {
                    text: 'Bạn suy nghĩ và trả lời đúng! NPC gật đầu và biến mất, để lại trên mặt đất một cuộn sách cổ.',
                    rewards: [
                        { type: 'xp', amount: 70 },
                        { type: 'item', targetId: 'ancient_scroll', itemName: 'Cuộn Sách Cổ', itemType: 'key', amount: 1 }
                    ]
                }
            },
            {
                id: 'give_up',
                text: '🏳️ Bỏ cuộc',
                outcome: {
                    text: 'Bạn không thể trả lời câu đố. NPC lắc đầu và biến mất.',
                    rewards: [
                        { type: 'xp', amount: 10 }
                    ]
                }
            }
        ]
    },

    // --- Rừng ma quái ---
    {
        id: 'haunted_forest',
        title: '👻 Rừng Ma Quái',
        description: 'Đêm khuya, bạn nghe thấy những tiếng động kỳ lạ phát ra từ khu rừng. Dường như có ai đó đang gọi tên bạn...',
        conditions: [
            { type: 'weather', operator: 'eq', value: Weather.Fog }
        ],
        choices: [
            {
                id: 'investigate',
                text: '🔦 Điều tra',
                outcome: {
                    text: 'Bạn lần theo tiếng động và phát hiện một oan hồn đang lang thang. Bạn giúp nó siêu thoát và nhận được sự biết ơn!',
                    rewards: [
                        { type: 'xp', amount: 80 },
                        { type: 'item', targetId: 'spirit_blessing', itemName: 'Lời Chúc Của Thần Linh', itemType: 'equipment', amount: 1 }
                    ]
                }
            },
            {
                id: 'flee',
                text: '🏃 Chạy khỏi rừng',
                outcome: {
                    text: 'Bạn sợ hãi chạy khỏi rừng. Tiếng động vẫn tiếp tục phía sau bạn...',
                    rewards: [
                        { type: 'xp', amount: 10 }
                    ]
                }
            }
        ]
    },

    // ================================================================
    // 8. MULTI-STEP CHAINS (3-5+ steps)
    // ================================================================

    // --- Ancient Mystery Chain: Step 2 of 3 ---
    {
        id: 'riddle_stone_mystery',
        title: '🔮 Bí ẩn Đá Kỳ Bí',
        description: 'Viên Đá Kỳ Bí trên tay bạn đang phát ra ánh sáng dịu nhẹ. Dường như nó đang muốn dẫn bạn đến một nơi nào đó trong rừng...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'riddle_stone' }
        ],
        choices: [
            {
                id: 'follow_glow',
                text: '✨ Theo ánh sáng của viên đá',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 70,
                            text: 'Đá Kỳ Bí đưa bạn đến một hang động ẩn giấu. Bên trong là một căn phòng cổ đại với những biểu tượng kỳ lạ trên tường!',
                            rewards: [
                                { type: 'xp', amount: 80 },
                                { type: 'discovery', targetId: 'hidden_cave' }
                            ],
                            nextOpportunityId: 'ancient_chamber',
                            tag: 'success',
                        },
                        {
                            weight: 30,
                            text: 'Ánh sáng dẫn bạn đến bờ vực. May mắn là bạn dừng lại đúng lúc. Viên đá dường như đang thử thách bạn...',
                            rewards: [
                                { type: 'xp', amount: 30 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            },
            {
                id: 'keep_stone',
                text: '🔐 Giữ viên đá làm kỷ niệm',
                revealRewards: true,
                outcome: {
                    results: [
                        {
                            weight: 100,
                            text: 'Bạn quyết định giữ viên đá bên mình. Dù không khám phá ra gì mới, nhưng bạn cảm nhận được năng lượng kỳ lạ từ nó.',
                            rewards: [
                                { type: 'xp', amount: 20 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            }
        ]
    },

    // --- Ancient Mystery Chain: Step 3 of 3 (Final) ---
    {
        id: 'ancient_chamber',
        title: '🏛️ Căn Phòng Cổ Đại',
        description: 'Bạn bước vào căn phòng cổ đại. Ở trung tâm là một chiếc altar đá với 3 viên đá quý missing. Viên Đá Kỳ Bí trên tay bạn đang phát sáng mạnh hơn...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'riddle_stone' }
        ],
        choices: [
            {
                id: 'place_stone',
                text: '💎 Đặt Đá Kỳ Bí lên altar',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 60,
                            text: 'Khi bạn đặt viên đá lên, cả căn phòng sáng bừng lên! Một cánh cửa bí mật mở ra, reveals một kho báu cổ đại với hàng ngàn đồng xu và báu vật!',
                            rewards: [
                                { type: 'xp', amount: 200 },
                                { type: 'currency', amount: 500 },
                                { type: 'item', targetId: 'ancient_crown', itemName: 'Vương Miện Cổ Đại', itemType: 'equipment', amount: 1 },
                                { type: 'item', targetId: 'riddle_stone', itemName: 'Đá Kỳ Bí', itemType: 'key', amount: -1 },
                                { type: 'discovery', targetId: 'ancient_treasure_chamber' }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 25,
                            text: 'Viên đá phát sáng nhưng không có gì xảy ra. Có vẻ như còn thiếu thứ gì đó...',
                            rewards: [
                                { type: 'xp', amount: 50 },
                                { type: 'discovery', targetId: 'altar_incomplete' }
                            ],
                            tag: 'partial',
                        },
                        {
                            weight: 15,
                            text: 'Một cái bẫy sụp xuống! Bạn may mắn thoát ra được nhưng mất một ít vàng.',
                            rewards: [
                                { type: 'xp', amount: -30 },
                                { type: 'currency', amount: -100 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            },
            {
                id: 'examine_symbols',
                text: '🔍 Thử giải mã biểu tượng',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 50,
                            text: 'Bạn nghiên cứu các biểu tượng và phát hiện đây là bản đồ kho báu! Bạn ghi nhớ vị trí và hứa sẽ quay lại sau.',
                            rewards: [
                                { type: 'xp', amount: 100 },
                                { type: 'discovery', targetId: 'ancient_map_decoded' }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 50,
                            text: 'Các biểu tượng quá phức tạp. Bạn quyết định rời đi mà không giải được.',
                            rewards: [
                                { type: 'xp', amount: 30 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            }
        ]
    },

    // --- Crystal Crafting Chain: Step 2 of 3 ---
    {
        id: 'crystal_crafting',
        title: '⚗️ Chế Tạo Pha Lê',
        description: 'Bạn mang viên Pha Lê Đỏ về phòng thí nghiệm. Dường như nó có thể được sử dụng để chế tạo một vật phẩm đặc biệt...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'red_crystal' }
        ],
        choices: [
            {
                id: 'craft_amulet',
                text: '🛡️ Chế tạo Bùa hộ mệnh',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 75,
                            text: 'Bạn sử dụng Pha Lê Đỏ để tạo ra một Bùa hộ mệnh phát sáng. Nó sẽ bảo vệ bạn khỏi nguy hiểm!',
                            rewards: [
                                { type: 'currency', amount: -50 },
                                { type: 'item', targetId: 'red_crystal', itemName: 'Pha Lê Đỏ', itemType: 'resource', amount: -1 },
                                { type: 'item', targetId: 'protection_amulet', itemName: 'Bùa Hộ Mệnh', itemType: 'equipment', amount: 1 },
                                { type: 'xp', amount: 60 }
                            ],
                            nextOpportunityId: 'crystal_power',
                            tag: 'success',
                        },
                        {
                            weight: 25,
                            text: 'Viên pha le bị vỡ trong quá trình chế tạo. Bạn chỉ còn lại những mảnh nhỏ...',
                            rewards: [
                                { type: 'item', targetId: 'red_crystal', itemName: 'Pha Lê Đỏ', itemType: 'resource', amount: -1 },
                                { type: 'xp', amount: 20 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            },
            {
                id: 'keep_crystal',
                text: '💎 Giữ nguyên Pha Lê',
                revealRewards: true,
                outcome: {
                    results: [
                        {
                            weight: 100,
                            text: 'Bạn quyết định giữ viên Pha Lê Đỏ. Có lẽ sẽ có lúc bạn cần nó.',
                            rewards: [
                                { type: 'xp', amount: 10 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            }
        ]
    },

    // --- Crystal Crafting Chain: Step 3 of 3 (Final) ---
    {
        id: 'crystal_power',
        title: '⚡ Sức Mạnh Pha Lê',
        description: 'Bùa hộ mệnh trên tay bạn đang phát ra ánh sáng mạnh. Dường như nó có thể được kích hoạt để释放 một sức mạnh đặc biệt...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'protection_amulet' }
        ],
        choices: [
            {
                id: 'activate_amulet',
                text: '🔥 Kích hoạt Bùa hộ mệnh',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 65,
                            text: 'Bạn kích hoạt bùa hộ mệnh! Một lá chắn ánh sáng bao quanh bạn, bảo vệ bạn khỏi mọi nguy hiểm trong 24h!',
                            rewards: [
                                { type: 'xp', amount: 150 },
                                { type: 'item', targetId: 'protection_amulet', itemName: 'Bùa Hộ Mệnh', itemType: 'equipment', amount: -1 },
                                { type: 'item', targetId: 'shield_scroll', itemName: 'Cuộn Lá Chắn', itemType: 'usable', amount: 3 },
                                { type: 'discovery', targetId: 'amulet_power_used' }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 35,
                            text: 'Bùa hộ mệnh không hoạt động như mong đợi. Bạn cảm thấy một chút thất vọng...',
                            rewards: [
                                { type: 'xp', amount: 40 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            },
            {
                id: 'sell_amulet',
                text: '💰 Bán Bùa hộ mệnh',
                revealRewards: true,
                outcome: {
                    results: [
                        {
                            weight: 100,
                            text: 'Bạn bán bùa hộ mệnh cho một thương nhân với giá 200 Gold. Một thương vụ hời!',
                            rewards: [
                                { type: 'currency', amount: 200 },
                                { type: 'item', targetId: 'protection_amulet', itemName: 'Bùa Hộ Mệnh', itemType: 'equipment', amount: -1 },
                                { type: 'xp', amount: 30 }
                            ],
                            tag: 'success',
                        }
                    ]
                }
            }
        ]
    },

    // --- Treasure Hunt Chain: Step 2 of 4 ---
    {
        id: 'map_treasure_hunt',
        title: '🗺️ Săn Kho Báu',
        description: 'Bản Đồ Rách chỉ đến một vị trí trong khu rừng. Dù bị rách một phần, bạn vẫn có thể lần theo dấu vết...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'torn_map' }
        ],
        choices: [
            {
                id: 'follow_map',
                text: '🧭 Theo bản đồ tìm kho báu',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 65,
                            text: 'Bạn lần theo bản đồ và đến một ngã ba đường. Một lối đi an toàn nhưng dài hơn, lối kia ngắn hơn nhưng nguy hiểm...',
                            rewards: [
                                { type: 'xp', amount: 40 }
                            ],
                            nextOpportunityId: 'treacherous_path',
                            tag: 'success',
                        },
                        {
                            weight: 35,
                            text: 'Bạn bị lạc đường. Bản đồ quá rách để đọc chính xác.',
                            rewards: [
                                { type: 'xp', amount: 15 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            },
            {
                id: 'sell_map',
                text: '💰 Bán bản đồ cho thương nhân',
                revealRewards: true,
                outcome: {
                    results: [
                        {
                            weight: 100,
                            text: 'Một thương nhân trong thị trấn mua bản đồ của bạn với giá 50 Gold. Bạn không biết kho báu thực sự đáng giá bao nhiêu...',
                            rewards: [
                                { type: 'currency', amount: 50 },
                                { type: 'xp', amount: 15 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            }
        ]
    },

    // --- Treasure Hunt Chain: Step 3 of 4 ---
    {
        id: 'treacherous_path',
        title: '⚔️ Con Đường Nguy Hiểm',
        description: 'Bạn đứng trước hai lối đi. Một lốiThrough deep, winding path leads to mysterious ruins, while a treacherous cliffside offers a shortcuts but with dangerous drops.',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'torn_map' }
        ],
        choices: [
            {
                id: 'safe_path',
                text: '🌿 Lối đi an toàn (dài hơn)',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 85,
                            text: 'Bạn chọn lối đi an toàn. Sau một hành trình dài, bạn đến được khu vực được chỉ trên bản đồ.',
                            rewards: [
                                { type: 'xp', amount: 50 }
                            ],
                            nextOpportunityId: 'treasure_chamber',
                            tag: 'success',
                        },
                        {
                            weight: 15,
                            text: 'Bạn gặp bầy sói trên đường đi. May mắn là bạn chạy thoát được.',
                            rewards: [
                                { type: 'xp', amount: 20 }
                            ],
                            tag: 'partial',
                        }
                    ]
                }
            },
            {
                id: 'dangerous_path',
                text: '🏔️ Lối tắt qua vách núi',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 45,
                            text: 'Bạn liều lĩnh leo qua vách núi. Bạn đến nơi nhanh hơn nhiều!',
                            rewards: [
                                { type: 'xp', amount: 80 },
                                { type: 'item', targetId: 'mountain_herbs', itemName: 'Thuốc Núi', itemType: 'usable', amount: 2 }
                            ],
                            nextOpportunityId: 'treasure_chamber',
                            tag: 'success',
                        },
                        {
                            weight: 35,
                            text: 'Bạn bị trượt ngã và bị thương nhẹ. Nhưng bạn vẫn tiếp tục được.',
                            rewards: [
                                { type: 'xp', amount: 30 },
                                { type: 'currency', amount: -20 }
                            ],
                            nextOpportunityId: 'treasure_chamber',
                            tag: 'partial',
                        },
                        {
                            weight: 20,
                            text: 'Bạn trượt ngã nghiêm trọng và phải quay lại!',
                            rewards: [
                                { type: 'xp', amount: -20 },
                                { type: 'currency', amount: -50 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            }
        ]
    },

    // --- Treasure Hunt Chain: Step 4 of 4 (Final) ---
    {
        id: 'treasure_chamber',
        title: '💰 Phòng Kho Báu',
        description: 'Bạn đã đến được vị trí cuối cùng trên bản đồ. Trước mặt bạn là một rương gỗ lớn埋 dưới đất, nhưng có một cái bẫy bảo vệ nó...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'torn_map' }
        ],
        choices: [
            {
                id: 'disarm_trap',
                text: '🔧 Thửdisable cái bẫy',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 55,
                            text: 'Bạn cẩn thận tháoActivate cái bẫy thành công! Rương mở ra revealing những kho báu tuyệt vời!',
                            rewards: [
                                { type: 'xp', amount: 150 },
                                { type: 'currency', amount: 300 },
                                { type: 'item', targetId: 'golden_sword', itemName: 'Kiếm Vàng', itemType: 'equipment', amount: 1 },
                                { type: 'item', targetId: 'torn_map', itemName: 'Bản Đồ Rách', itemType: 'key', amount: -1 },
                                { type: 'discovery', targetId: 'treasure_found' }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 25,
                            text: 'Cái bẫyActivate nhưng bạn kịp thời tránh. Rương vẫn mở nhưng một phần kho báu đã bị hủy.',
                            rewards: [
                                { type: 'xp', amount: 80 },
                                { type: 'currency', amount: 100 },
                                { type: 'item', targetId: 'torn_map', itemName: 'Bản Đồ Rách', itemType: 'key', amount: -1 }
                            ],
                            tag: 'partial',
                        },
                        {
                            weight: 20,
                            text: 'Cái bẫy sập xuống và hủy几乎 toàn bộ kho báu!',
                            rewards: [
                                { type: 'xp', amount: 30 },
                                { type: 'item', targetId: 'torn_map', itemName: 'Bản Đồ Rách', itemType: 'key', amount: -1 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            },
            {
                id: 'force_open',
                text: '💪 Bắt rương bằng sức mạnh',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 40,
                            text: 'Bạn dùng sức mạnh phá vỡ cái bẫy và mở rương! Một số vật phẩm bị hư hại nhưng bạn vẫn có nhiều kho báu!',
                            rewards: [
                                { type: 'xp', amount: 100 },
                                { type: 'currency', amount: 150 },
                                { type: 'item', targetId: 'torn_map', itemName: 'Bản Đồ Rách', itemType: 'key', amount: -1 }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 60,
                            text: 'Cái bẫy sập xuống và几乎 hủy toàn bộ kho báu!',
                            rewards: [
                                { type: 'xp', amount: 20 },
                                { type: 'item', targetId: 'torn_map', itemName: 'Bản Đồ Rách', itemType: 'key', amount: -1 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            }
        ]
    },

    // --- Bandit Quest Chain: Step 2 of 3 ---
    {
        id: 'bandit_camp',
        title: '🏕️ Trại Cướp',
        description: 'Sau khi đánh bại kẻ trộm, bạn lần theo dấu vết đến một trại cướp ẩn trong rừng. Có vẻ như đây là nơi chúng cất giấu hàng ăn cắp...',
        conditions: [
            { type: 'item', operator: 'has', targetId: 'stolen_goods' }
        ],
        choices: [
            {
                id: 'sneak_in',
                text: '🥷 Lén đột nhập trại',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 60,
                            text: 'Bạn lén đột nhập và tìm thấy kho hàng ăn cắp. Bạn lấy lại được nhiều vật phẩm quý giá!',
                            rewards: [
                                { type: 'xp', amount: 80 },
                                { type: 'currency', amount: 120 },
                                { type: 'item', targetId: 'stolen_goods', itemName: 'Hàng Ăn Cắp', itemType: 'resource', amount: -1 },
                                { type: 'item', targetId: 'bandit_map', itemName: 'Bản Đồ Trại Cướp', itemType: 'key', amount: 1 },
                                { type: 'discovery', targetId: 'bandit_camp_discovered' }
                            ],
                            nextOpportunityId: 'bandit_leader',
                            tag: 'success',
                        },
                        {
                            weight: 25,
                            text: 'Bạn bị phát hiện nhưng chạy thoát được!',
                            rewards: [
                                { type: 'xp', amount: 40 },
                                { type: 'item', targetId: 'stolen_goods', itemName: 'Hàng Ăn Cắp', itemType: 'resource', amount: -1 }
                            ],
                            nextOpportunityId: 'bandit_leader',
                            tag: 'partial',
                        },
                        {
                            weight: 15,
                            text: 'Bạn bị bắt và đánh đập! May mắn là bạn thoát được sau đó.',
                            rewards: [
                                { type: 'xp', amount: -20 },
                                { type: 'currency', amount: -30 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            },
            {
                id: 'frontal_assault',
                text: '⚔️ Tấn công trực diện',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 50,
                            text: 'Bạn chiến đấu dũng cảm và đánh bại các cướp biển! Bạn chiếm được trại và toàn bộ kho báu!',
                            rewards: [
                                { type: 'xp', amount: 100 },
                                { type: 'currency', amount: 200 },
                                { type: 'item', targetId: 'stolen_goods', itemName: 'Hàng Ăn Cắp', itemType: 'resource', amount: -1 },
                                { type: 'item', targetId: 'bandit_sword', itemName: 'Kiếm Cướp', itemType: 'equipment', amount: 1 },
                                { type: 'discovery', targetId: 'bandit_camp_cleared' }
                            ],
                            nextOpportunityId: 'bandit_leader',
                            tag: 'success',
                        },
                        {
                            weight: 30,
                            text: 'Cuộc chiến cân bằng. Bạn đánh đuổi được nhưng không chiếm được kho.',
                            rewards: [
                                { type: 'xp', amount: 60 },
                                { type: 'item', targetId: 'stolen_goods', itemName: 'Hàng Ăn Cắp', itemType: 'resource', amount: -1 }
                            ],
                            nextOpportunityId: 'bandit_leader',
                            tag: 'partial',
                        },
                        {
                            weight: 20,
                            text: 'Bạn bị thương nặng và phải rút lui!',
                            rewards: [
                                { type: 'xp', amount: -30 },
                                { type: 'currency', amount: -50 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            }
        ]
    },

    // --- Bandit Quest Chain: Step 3 of 3 (Final) ---
    {
        id: 'bandit_leader',
        title: '👑 Thủ Lĩnh Băng Cướp',
        description: 'Bạn đã đối mặt với băng cướp. Giờ là lúc đối mặt với thủ lĩnh của chúng - một chiến binh khét tiếng trong vùng...',
        conditions: [
            { type: 'level', operator: 'gte', value: 5 }
        ],
        choices: [
            {
                id: 'challenge_leader',
                text: '⚔️ Thách đấu thủ lĩnh',
                revealRewards: false,
                outcome: {
                    results: [
                        {
                            weight: 55,
                            text: 'Cuộc chiến khốc liệt diễn ra. Sau những đòn đánh quyết liệt, bạn đã chiến thắng! Thủ lĩnh băng cướp chịu thua và tuyên bố giải thể băng nhóm.',
                            rewards: [
                                { type: 'xp', amount: 200 },
                                { type: 'currency', amount: 500 },
                                { type: 'item', targetId: 'bandit_leader_sword', itemName: 'Kiếm Thủ Lĩnh', itemType: 'equipment', amount: 1 },
                                { type: 'discovery', targetId: 'bandit_leader_defeated' }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 25,
                            text: 'Bạn và thủ lĩnh bất phân thắng bại. Ông ta đề nghị một thỏa thuận.',
                            rewards: [
                                { type: 'xp', amount: 100 },
                                { type: 'currency', amount: 200 },
                                { type: 'discovery', targetId: 'bandit_negotiation' }
                            ],
                            tag: 'partial',
                        },
                        {
                            weight: 20,
                            text: 'Bạn bị đánh bại! Thủ lĩnh tha thứ nhưng lấy hết tài sản của bạn.',
                            rewards: [
                                { type: 'xp', amount: -50 },
                                { type: 'currency', amount: -300 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            },
            {
                id: 'negotiate_leader',
                text: '🤝 Đàm phán với thủ lĩnh',
                revealRewards: true,
                outcome: {
                    results: [
                        {
                            weight: 70,
                            text: 'Bạn đề nghị một thỏa thuận: thủ lĩnh rời đi và không bao giờ trở lại, đổi lấy sự tha thứ. Ông ta chấp nhận và để lại một ít vàng.',
                            rewards: [
                                { type: 'xp', amount: 80 },
                                { type: 'currency', amount: 150 },
                                { type: 'relationship', targetId: 'bandit_leader', amount: -20 }
                            ],
                            tag: 'success',
                        },
                        {
                            weight: 30,
                            text: 'Thủ lĩnh từ chối và tấn công bạn!',
                            rewards: [
                                { type: 'xp', amount: 30 }
                            ],
                            tag: 'failure',
                        }
                    ]
                }
            }
        ]
    }
];
