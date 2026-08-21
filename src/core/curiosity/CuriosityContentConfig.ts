// ============================================================
// ECHO — Curiosity Content Configuration
// Định nghĩa Mysteries, Secrets, Clues, Locked Content.
// Spec ref: doc/Curiosity Hooks.md
//
// Nguyên tắc:
// - Signal, Don't Explain
// - Mystery Must Lead Somewhere
// - No Fake Curiosity
// - Delayed Payoff
// ============================================================

import {
    Mystery,
    MysteryType,
    MysteryScale,
    Secret,
    SecretType,
    DiscoveryMethod,
    Clue,
    ClueSource,
    LockedContent,
    LockedContentType,
    RequirementType,
    DiscoveryChain,
    ChainStepType,
} from './CuriosityHooksTypes';

// ============================================================
// 1. MYSTERIES — Những thứ chưa hiểu hoàn toàn
// ============================================================

export const MYSTERIES: Mystery[] = [
    // --- Micro Mysteries (Item-based) ---
    {
        id: 'mystery_strange_key',
        type: MysteryType.StrangeItem,
        scale: MysteryScale.Micro,
        name: '🔑 Chìa Khóa Kỳ Lạ',
        signal: 'Bạn tìm thấy một chiếc chìa khóa với hình dáng kỳ lạ. Nó có vẻ thuộc về một thứ gì đó cổ xưa...',
        initialHint: 'Chiếc chìa khóa có khắc một biểu tượng giống như một tòa tháp.',
        requiredClues: ['clue_key_origin', 'clue_key_location'],
        solvingReward: {
            type: 'unlock',
            targetId: 'old_tower',
            description: 'Mở khóa Tháp Cổ',
        },
        relatedMysteries: ['mystery_old_tower'],
        solvable: true,
        appearConditions: [],
        createdAt: new Date(),
    },
    {
        id: 'mystery_riddle_stone',
        type: MysteryType.StrangeItem,
        scale: MysteryScale.ShortTerm,
        name: '🔮 Bí Ẩn Đá Kỳ Bí',
        signal: 'Viên Đá Kỳ Bí trên tay bạn đang phát ra ánh sáng dịu nhẹ. Dường như nó đang muốn dẫn bạn đến một nơi nào đó...',
        initialHint: 'Đá phát sáng mạnh hơn khi bạn ở gần khu rừng phía Bắc.',
        requiredClues: ['clue_stone_glow', 'clue_stone_origin'],
        solvingReward: {
            type: 'discovery',
            targetId: 'hidden_cave',
            description: 'Phát hiện Hang Ẩn',
        },
        relatedMysteries: [],
        solvable: true,
        appearConditions: [{ type: 'item', targetId: 'riddle_stone', operator: 'has' }],
        createdAt: new Date(),
    },

    // --- Short-term Mysteries (NPC-based) ---
    {
        id: 'mystery_elias_past',
        type: MysteryType.UnusualNPC,
        scale: MysteryScale.ShortTerm,
        name: '🤫 Quá Khứ Của Elias',
        signal: 'Elias có vẻ lo lắng hơn bình thường. Ông ấy liên tục nhìn về phía khu rừng và thì thầm những từ khó hiểu...',
        initialHint: 'Elias từng nhắc đến "ngày hôm đó" với ánh mắt xa xăm.',
        requiredClues: ['clue_elias_fear', 'clue_elias_letter'],
        solvingReward: {
            type: 'lore',
            targetId: 'elias_backstory',
            description: 'Tìm ra quá khứ của Elias',
        },
        relatedMysteries: ['mystery_forest_secret'],
        solvable: true,
        appearConditions: [{ type: 'relationship', targetId: 'elias', operator: 'gte', value: 30 }],
        createdAt: new Date(),
    },
    {
        id: 'mystery_mysterious_trader',
        type: MysteryType.UnusualNPC,
        scale: MysteryScale.ShortTerm,
        name: '🎭 Thương Nhân Bí Ẩn',
        signal: 'Một thương nhân lạ mặt xuất hiện ở thị trấn. Ông ta biến mất ngay sau khi bạn mua hàng, như một làn khói...',
        initialHint: 'Thương nhân để lại một chiếc khăn mùi sons với biểu tượng lạ.',
        requiredClues: ['clue_trader_cipher', 'clue_trader_item'],
        solvingReward: {
            type: 'item',
            targetId: 'trader_medallion',
            amount: 1,
            description: 'Nhận Huy Hiệu Thương Nhân',
        },
        relatedMysteries: [],
        solvable: true,
        appearConditions: [{ type: 'level', targetId: '', operator: 'gte', value: 3 }],
        createdAt: new Date(),
    },

    // --- Medium-term Mysteries (Location-based) ---
    {
        id: 'mystery_old_tower',
        type: MysteryType.HiddenLocation,
        scale: MysteryScale.MediumTerm,
        name: '🗼 Tháp Cổ',
        signal: 'Trong rừng có một tòa tháp cổ被che khuất bởi dây leo. Cánh cửa bị khóa bằng một cơ chế kỳ lạ...',
        initialHint: 'Tháp có 3 tầng, mỗi tầng có một biểu tượng khác nhau.',
        requiredClues: ['clue_tower_location', 'clue_tower_mechanism', 'clue_tower_key'],
        solvingReward: {
            type: 'discovery',
            targetId: 'tower_chamber',
            description: 'Phát hiện Phòng Bí Mật trong Tháp',
        },
        relatedMysteries: ['mystery_strange_key'],
        solvable: true,
        appearConditions: [{ type: 'discovery', targetId: 'tower_location', operator: 'has' }],
        createdAt: new Date(),
    },
    {
        id: 'mystery_well_mystery',
        type: MysteryType.UnexplainedEvent,
        scale: MysteryScale.MediumTerm,
        name: '🕳️ Bí Ẩn Giếng Cổ',
        signal: 'Chiếc giếng cổ phát ra ánh sáng kỳ lạ vào ban đêm. Có vẻ như có thứ gì đó ở bên dưới đang mời gọi...',
        initialHint: 'Ánh sáng phát ra từ một tinh thể lớn ở dưới đáy giếng.',
        requiredClues: ['clue_well_light', 'clue_well_history'],
        solvingReward: {
            type: 'unlock',
            targetId: 'well_chamber',
            description: 'Mở khóa Phòng Giếng',
        },
        relatedMysteries: [],
        solvable: true,
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'clear' }],
        createdAt: new Date(),
    },

    // --- Long-term Mysteries (World-based) ---
    {
        id: 'mystery_world_symbol',
        type: MysteryType.RepeatedSymbol,
        scale: MysteryScale.LongTerm,
        name: '🌍 Biểu Tượng Thế Giới',
        signal: 'Bạn thấy một biểu tượng lạ mắt xuất hiện ở nhiều nơi: trên tường cổ, trong sách cũ, trên vật phẩm... Nó có nghĩa gì?',
        initialHint: 'Biểu tượng có 3 phần: một vòng tròn, một tam giác, và một đường thẳng.',
        requiredClues: ['clue_symbol_forest', 'clue_symbol_library', 'clue_symbol_well', 'clue_symbol_tower'],
        solvingReward: {
            type: 'lore',
            targetId: 'world_symbol_meaning',
            description: 'Hiểu ý nghĩa Biểu Tượng Thế Giới',
        },
        relatedMysteries: ['mystery_old_tower', 'mystery_well_mystery'],
        solvable: true,
        appearConditions: [],
        createdAt: new Date(),
    },
    {
        id: 'mystery_forest_secret',
        type: MysteryType.HiddenLocation,
        scale: MysteryScale.LongTerm,
        name: '🌲 Bí Mật Rừng Xưa',
        signal: 'Khu rừng phía Bắc có một vùng đất mà không bản đồ nào hiển thị. Người dân địa phương tránh xa nơi đó...',
        initialHint: 'Elias từng nói: "Có những thứ tốt nhất nên để nguyên."',
        requiredClues: ['clue_forest_map', 'clue_forest_warning', 'clue_forest_artifact'],
        solvingReward: {
            type: 'discovery',
            targetId: 'ancient_shrine',
            description: 'Phát hiện Đền Thờ Cổ',
        },
        relatedMysteries: ['mystery_elias_past'],
        solvable: true,
        appearConditions: [{ type: 'level', targetId: '', operator: 'gte', value: 10 }],
        createdAt: new Date(),
    },

    // --- Community Mysteries ---
    {
        id: 'mystery_eclipse_prophecy',
        type: MysteryType.UnexplainedEvent,
        scale: MysteryScale.Community,
        name: '🌑 Lời Tiên Đo Nguyệt Thực',
        signal: 'Khi nguyệt thực xảy ra, những biểu tượng kỳ lạ xuất hiện ở khắp thị trấn. Chúng đang cố nói điều gì đó...',
        initialHint: 'Có 5 biểu tượng khác nhau, mỗi cái ở một vị trí khác nhau trong town.',
        requiredClues: ['clue_eclipse_1', 'clue_eclipse_2', 'clue_eclipse_3', 'clue_eclipse_4', 'clue_eclipse_5'],
        solvingReward: {
            type: 'unlock',
            targetId: 'eclipse_portal',
            description: 'Mở Cổng Nguyệt Thực',
        },
        relatedMysteries: [],
        solvable: true,
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'eclipse' }],
        createdAt: new Date(),
    },

    // --- Eternal Mysteries (Không bao giờ được giải) ---
    {
        id: 'mystery_world_origin',
        type: MysteryType.RepeatedSymbol,
        scale: MysteryScale.LongTerm,
        name: '🌐 Nguồn Gốc Thế Giới',
        signal: 'Thế giới ECHO tồn tại từ bao giờ? Tại sao nó lại như thế này? Có những thứ vượt xa hiểu biết của con người...',
        initialHint: 'Những bức tường cổ nhất trong tháp có khắc hình ảnh về "Người Sáng Tạo".',
        requiredClues: [],
        solvingReward: {
            type: 'lore',
            targetId: 'world_origin_lore',
            description: 'Hiểu về nguồn gốc thế giới',
        },
        relatedMysteries: [],
        solvable: false, // Eternal mystery
        appearConditions: [],
        createdAt: new Date(),
    },
];

// ============================================================
// 2. SECRETS — Content ẩn không hiển thị trực tiếp
// ============================================================

export const SECRETS: Secret[] = [
    // --- Secret Outcomes trong Choices ---
    {
        id: 'secret_well_chamber',
        type: SecretType.SecretLocation,
        name: '🕳️ Phòng Bí Mật Dưới Giếng',
        description: 'Phía sau thác nước trong giếng có một cánh cửa bí mật dẫn đến căn phòng cổ.',
        discoveryMethod: DiscoveryMethod.Exploration,
        conditions: [
            { type: 'item', targetId: 'riddle_stone', operator: 'has' },
            { type: 'random', probability: 0.05 },
        ],
        rarity: 0.05,
        reward: {
            type: 'discovery',
            targetId: 'well_secret_room',
            description: 'Phát hiện Phòng Bí Mật',
        },
        relatedSecrets: ['secret_well_treasure'],
        shareable: true,
        isCommunity: false,
    },
    {
        id: 'secret_elias_letter',
        type: SecretType.SecretItem,
        name: '📜 Thư Của Elias',
        description: 'Bạn tìm thấy một bức thư bị rách trong túi của Elias. Nó đề cập đến "kho báu bị thất lạc".',
        discoveryMethod: DiscoveryMethod.NPC,
        conditions: [
            { type: 'relationship', targetId: 'elias', operator: 'gte', value: 50 },
            { type: 'random', probability: 0.1 },
        ],
        rarity: 0.1,
        reward: {
            type: 'clue',
            targetId: 'clue_elias_letter',
            description: 'Nhận manh mối về quá khứ Elias',
        },
        relatedSecrets: [],
        shareable: true,
        isCommunity: false,
    },
    {
        id: 'secret_forest_path',
        type: SecretType.SecretLocation,
        name: '🌿 Lối Đi Ẩn Trong Rừng',
        description: 'Một con đường nhỏ bị che khuất bởi lá cây dẫn sâu vào rừng.',
        discoveryMethod: DiscoveryMethod.Exploration,
        conditions: [
            { type: 'weather', targetId: '', operator: 'eq', value: 'fog' },
            { type: 'random', probability: 0.08 },
        ],
        rarity: 0.08,
        reward: {
            type: 'discovery',
            targetId: 'hidden_forest_path',
            description: 'Phát hiện Lối Đi Ẩn',
        },
        relatedSecrets: ['secret_forest_shrine'],
        shareable: true,
        isCommunity: false,
    },
    {
        id: 'secret_trader_identity',
        type: SecretType.SecretNPC,
        name: '🎭 Danh Tính Thương Nhân',
        description: 'Thương nhân bí ẩn thực ra là một cựu thám hiểm nổi tiếng đã biến mất cách đây 10 năm.',
        discoveryMethod: DiscoveryMethod.Clue,
        conditions: [
            { type: 'clue', targetId: 'clue_trader_cipher', operator: 'has' },
            { type: 'clue', targetId: 'clue_trader_item', operator: 'has' },
        ],
        rarity: 1, // Always found when conditions met
        reward: {
            type: 'lore',
            targetId: 'trader_backstory',
            description: 'Tìm ra danh tính thật của Thương Nhân',
        },
        relatedSecrets: [],
        shareable: true,
        isCommunity: false,
    },

    // --- Secret Items ---
    {
        id: 'secret_moonlight_elixir',
        type: SecretType.SecretItem,
        name: '💧 Tinh Chất Ánh Trăng',
        description: 'Một lọ nước phát sáng ánh trăng, được tìm thấy trong hang động bí mật.',
        discoveryMethod: DiscoveryMethod.RareEncounter,
        conditions: [
            { type: 'weather', targetId: '', operator: 'eq', value: 'eclipse' },
            { type: 'random', probability: 0.02 },
        ],
        rarity: 0.02,
        reward: {
            type: 'item',
            targetId: 'moonlight_elixir',
            amount: 1,
            description: 'Nhận Tinh Chất Ánh Trăng',
        },
        relatedSecrets: [],
        shareable: false,
        isCommunity: false,
    },

    // --- Secret Quests ---
    {
        id: 'secret_lost_relics',
        type: SecretType.SecretQuest,
        name: '⚔️ Nhiệm Vụ Relic Mất Tích',
        description: 'Một người lạ mặt nhờ bạn tìm kiếm những relic cổ đã mất tích từ lâu.',
        discoveryMethod: DiscoveryMethod.NPC,
        conditions: [
            { type: 'level', targetId: '', operator: 'gte', value: 8 },
            { type: 'random', probability: 0.15 },
        ],
        rarity: 0.15,
        reward: {
            type: 'opportunity',
            targetId: 'quest_lost_relics',
            description: 'Mở nhiệm vụ mới',
        },
        relatedSecrets: [],
        shareable: false,
        isCommunity: false,
    },

    // --- Community Secrets ---
    {
        id: 'secret_ancient_ritual',
        type: SecretType.SecretEvent,
        name: '🕯️ Nghi Lễ Cổ Đại',
        description: 'Có một nghi lễ cổ đại có thể được thực hiện khi tất cả 5 biểu tượng được ghép lại.',
        discoveryMethod: DiscoveryMethod.CommunityDiscovery,
        conditions: [
            { type: 'random', probability: 0.01 },
        ],
        rarity: 0.01,
        reward: {
            type: 'unlock',
            targetId: 'ritual_chamber',
            description: 'Mở Phòng Nghi Lễ',
        },
        relatedSecrets: [],
        shareable: true,
        isCommunity: true,
        communityRequired: 5,
        communityFound: 0,
    },
];

// ============================================================
// 3. CLUES — Manh mối
// ============================================================

export const CLUES: Clue[] = [
    // --- Clues cho Mystery: Chìa Khóa Kỳ Lạ ---
    {
        id: 'clue_key_origin',
        mysteryId: 'mystery_strange_key',
        description: 'Chìa khóa có khắc biểu tượng tòa tháp. Có lẽ nó mở cánh cửa nào đó trong Tháp Cổ.',
        source: ClueSource.Item,
        sourceId: 'strange_key',
        requiredClues: [],
        appearConditions: [],
        visible: true,
        order: 1,
        isFinalClue: false,
    },
    {
        id: 'clue_key_location',
        mysteryId: 'mystery_strange_key',
        description: 'Bạn thấy Tháp Cổ ở cuối con đường mòn phía Đông. Cánh cửa có lỗ khóa hình dạng kỳ lạ.',
        source: ClueSource.Location,
        sourceId: 'old_tower',
        requiredClues: ['clue_key_origin'],
        appearConditions: [],
        visible: true,
        order: 2,
        isFinalClue: true,
    },

    // --- Clues cho Mystery: Bí Ẩn Đá Kỳ Bí ---
    {
        id: 'clue_stone_glow',
        mysteryId: 'mystery_riddle_stone',
        description: 'Đá phát sáng mạnh hơn khi bạn ở gần khu rừng phía Bắc. Có lẽ có liên quan đến thứ gì đó ở đó.',
        source: ClueSource.Discovery,
        sourceId: 'riddle_stone',
        requiredClues: [],
        appearConditions: [{ type: 'item', targetId: 'riddle_stone', operator: 'has' }],
        visible: true,
        order: 1,
        isFinalClue: false,
    },
    {
        id: 'clue_stone_origin',
        mysteryId: 'mystery_riddle_stone',
        description: 'Elias kể rằng đá từng thuộc về một nhà thám hiểm cổ. Ông ấy rời đi và không bao giờ quay lại.',
        source: ClueSource.NPC,
        sourceId: 'elias',
        requiredClues: ['clue_stone_glow'],
        appearConditions: [{ type: 'relationship', targetId: 'elias', operator: 'gte', value: 20 }],
        visible: true,
        order: 2,
        isFinalClue: true,
    },

    // --- Clues cho Mystery: Quá Khứ Của Elias ---
    {
        id: 'clue_elias_fear',
        mysteryId: 'mystery_elias_past',
        description: 'Elias thường nhìn về phía khu rừng với ánh mắt sợ hãi. Ông ấy tránh xa nơi đó.',
        source: ClueSource.NPC,
        sourceId: 'elias',
        requiredClues: [],
        appearConditions: [{ type: 'relationship', targetId: 'elias', operator: 'gte', value: 30 }],
        visible: true,
        order: 1,
        isFinalClue: false,
    },
    {
        id: 'clue_elias_letter',
        mysteryId: 'mystery_elias_past',
        description: 'Bạn tìm thấy một bức thư bị rách trong túi của Elias. Nó đề cập đến "ngày hôm đó" và "kho báu".',
        source: ClueSource.Item,
        sourceId: 'elias_letter',
        requiredClues: ['clue_elias_fear'],
        appearConditions: [{ type: 'random', probability: 0.1 }],
        visible: false,
        order: 2,
        isFinalClue: true,
    },

    // --- Clues cho Mystery: Tháp Cổ ---
    {
        id: 'clue_tower_location',
        mysteryId: 'mystery_old_tower',
        description: 'Bạn thấy Tháp Cổ ở cuối con đường mòn phía Đông. Nó bị che khuất bởi dây leo.',
        source: ClueSource.Location,
        sourceId: 'old_tower',
        requiredClues: [],
        appearConditions: [],
        visible: true,
        order: 1,
        isFinalClue: false,
    },
    {
        id: 'clue_tower_mechanism',
        mysteryId: 'mystery_old_tower',
        description: 'Cánh cửa tháp có 3 lỗ khóa, mỗi cái có biểu tượng khác nhau: Mặt Trăng, Mặt Trời, và Ngôi Sao.',
        source: ClueSource.Location,
        sourceId: 'old_tower_door',
        requiredClues: ['clue_tower_location'],
        appearConditions: [],
        visible: true,
        order: 2,
        isFinalClue: false,
    },
    {
        id: 'clue_tower_key',
        mysteryId: 'mystery_old_tower',
        description: 'Bạn cần tìm 3 chìa khóa: Chìa Mặt Trăng, Chìa Mặt Trời, và Chìa Ngôi Sao.',
        source: ClueSource.Discovery,
        sourceId: 'tower_mechanism',
        requiredClues: ['clue_tower_mechanism'],
        appearConditions: [],
        visible: true,
        order: 3,
        isFinalClue: true,
    },

    // --- Clues cho Mystery: Bí Ẩn Giếng Cổ ---
    {
        id: 'clue_well_light',
        mysteryId: 'mystery_well_mystery',
        description: 'Ánh sáng phát ra từ một tinh thể lớn ở dưới đáy giếng. Nó phát sáng mạnh hơn vào ban đêm.',
        source: ClueSource.Location,
        sourceId: 'old_well',
        requiredClues: [],
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'clear' }],
        visible: true,
        order: 1,
        isFinalClue: false,
    },
    {
        id: 'clue_well_history',
        mysteryId: 'mystery_well_mystery',
        description: 'Sách cổ kể rằng giếng được xây bởi một nhà thám hiểm cổ. Ông ấy giấu thứ gì đó quan trọng ở dưới đáy.',
        source: ClueSource.Item,
        sourceId: 'ancient_book',
        requiredClues: ['clue_well_light'],
        appearConditions: [],
        visible: true,
        order: 2,
        isFinalClue: true,
    },

    // --- Clues cho Mystery: Biểu Tượng Thế Giới ---
    {
        id: 'clue_symbol_forest',
        mysteryId: 'mystery_world_symbol',
        description: 'Bạn thấy biểu tượng được khắc trên một tảng đá cổ trong rừng.',
        source: ClueSource.Location,
        sourceId: 'forest_rock',
        requiredClues: [],
        appearConditions: [],
        visible: true,
        order: 1,
        isFinalClue: false,
    },
    {
        id: 'clue_symbol_library',
        mysteryId: 'mystery_world_symbol',
        description: 'Trong thư viện cổ, bạn thấy biểu tượng trong một cuốn sách cũ về lịch sử thế giới.',
        source: ClueSource.Item,
        sourceId: 'ancient_history_book',
        requiredClues: ['clue_symbol_forest'],
        appearConditions: [{ type: 'level', targetId: '', operator: 'gte', value: 5 }],
        visible: true,
        order: 2,
        isFinalClue: false,
    },
    {
        id: 'clue_symbol_well',
        mysteryId: 'mystery_world_symbol',
        description: 'Biểu tượng xuất hiện trên thành giếng cổ, phát sáng khi trăng tròn.',
        source: ClueSource.Location,
        sourceId: 'old_well',
        requiredClues: ['clue_symbol_library'],
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'clear' }],
        visible: true,
        order: 3,
        isFinalClue: false,
    },
    {
        id: 'clue_symbol_tower',
        mysteryId: 'mystery_world_symbol',
        description: 'Ở tầng trên cùng của Tháp Cổ, biểu tượng lớn nhất xuất hiện trên trần nhà.',
        source: ClueSource.Location,
        sourceId: 'old_tower_top',
        requiredClues: ['clue_symbol_well'],
        appearConditions: [{ type: 'discovery', targetId: 'tower_chamber', operator: 'has' }],
        visible: true,
        order: 4,
        isFinalClue: true,
    },

    // --- Clues cho Mystery: Lời Tiên Đo Nguyệt Thực ---
    {
        id: 'clue_eclipse_1',
        mysteryId: 'mystery_eclipse_prophecy',
        description: 'Biểu tượng đầu tiên: Một vòng tròn với điểm ở trung tâm, xuất hiện trên tường giếng cổ.',
        source: ClueSource.Location,
        sourceId: 'well_symbol',
        requiredClues: [],
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'eclipse' }],
        visible: true,
        order: 1,
        isFinalClue: false,
    },
    {
        id: 'clue_eclipse_2',
        mysteryId: 'mystery_eclipse_prophecy',
        description: 'Biểu tượng thứ hai: Một tam giác ngược với đường thẳng xuyên qua, ở cửa tháp.',
        source: ClueSource.Location,
        sourceId: 'tower_symbol',
        requiredClues: ['clue_eclipse_1'],
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'eclipse' }],
        visible: true,
        order: 2,
        isFinalClue: false,
    },
    {
        id: 'clue_eclipse_3',
        mysteryId: 'mystery_eclipse_prophecy',
        description: 'Biểu tượng thứ ba: Bốn chấm xếp thành hình vuông, trong rừng.',
        source: ClueSource.Location,
        sourceId: 'forest_symbol',
        requiredClues: ['clue_eclipse_2'],
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'eclipse' }],
        visible: true,
        order: 3,
        isFinalClue: false,
    },
    {
        id: 'clue_eclipse_4',
        mysteryId: 'mystery_eclipse_prophecy',
        description: 'Biểu tượng thứ tư: Một ngôi sao 6 cánh, ở chợ thị trấn.',
        source: ClueSource.Location,
        sourceId: 'market_symbol',
        requiredClues: ['clue_eclipse_3'],
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'eclipse' }],
        visible: true,
        order: 4,
        isFinalClue: false,
    },
    {
        id: 'clue_eclipse_5',
        mysteryId: 'mystery_eclipse_prophecy',
        description: 'Biểu tượng thứ năm: Một con mắt mở, ở nghĩa trang cổ.',
        source: ClueSource.Location,
        sourceId: 'cemetery_symbol',
        requiredClues: ['clue_eclipse_4'],
        appearConditions: [{ type: 'weather', targetId: '', operator: 'eq', value: 'eclipse' }],
        visible: true,
        order: 5,
        isFinalClue: true,
    },
];

// ============================================================
// 4. LOCKED CONTENT — Nội dung bị khóa
// ============================================================

export const LOCKED_CONTENT: LockedContent[] = [
    // --- Regions ---
    {
        id: 'region_old_tower',
        type: LockedContentType.Region,
        name: 'Tháp Cổ',
        description: 'Một tòa tháp cổ bị che khuất bởi rừng cây. Cánh cửa bị khóa bằng cơ chế kỳ lạ.',
        requirements: [
            { type: RequirementType.Item, targetId: 'moon_key', amount: 1, description: 'Chìa Mặt Trăng' },
            { type: RequirementType.Item, targetId: 'sun_key', amount: 1, description: 'Chìa Mặt Trời' },
            { type: RequirementType.Item, targetId: 'star_key', amount: 1, description: 'Chìa Ngôi Sao' },
        ],
        hints: [
            'Tháp có 3 lỗ khóa với biểu tượng Mặt Trăng, Mặt Trời, và Ngôi Sao.',
            'Cần tìm 3 chìa khóa khác nhau để mở cửa.',
        ],
        unlockedBy: [],
        seenBy: [],
        visibleOnMap: false,
    },
    {
        id: 'region_well_chamber',
        type: LockedContentType.Region,
        name: 'Phòng Giếng',
        description: 'Phía dưới giếng cổ có một phòng bí mật với ánh sáng phát ra từ tinh thể.',
        requirements: [
            { type: RequirementType.Item, targetId: 'riddle_stone', amount: 1, description: 'Đá Kỳ Bí' },
            { type: RequirementType.Clue, targetId: 'clue_well_history', description: 'Manh mối về lịch sử giếng' },
        ],
        hints: [
            'Đá Kỳ Bí có thể kích hoạt cơ chế trong giếng.',
            'Cần tìm hiểu lịch sử của giếng trước.',
        ],
        unlockedBy: [],
        seenBy: [],
        visibleOnMap: false,
    },
    {
        id: 'region_forest_shrine',
        type: LockedContentType.Region,
        name: 'Đền Thờ Rừng Xưa',
        description: 'Một đền thờ cổ ẩn sâu trong rừng, nơi linh thiêng mà người dân tránh xa.',
        requirements: [
            { type: RequirementType.Level, targetId: '', amount: 10, description: 'Level 10' },
            { type: RequirementType.Discovery, targetId: 'hidden_forest_path', description: 'Lối đi ẩn trong rừng' },
            { type: RequirementType.Relationship, targetId: 'elias', amount: 50, description: 'Thân thiết với Elias' },
        ],
        hints: [
            'Cần trở nên mạnh mẽ hơn để đối mặt với nguy hiểm trong rừng.',
            'Elias có thể biết lối vào nếu bạn đủ thân thiết.',
        ],
        unlockedBy: [],
        seenBy: [],
        visibleOnMap: false,
    },
    {
        id: 'region_ritual_chamber',
        type: LockedContentType.Region,
        name: 'Phòng Nghi Lễ',
        description: 'Một phòng nghi lễ cổ đại được mở bằng 5 biểu tượng của Nguyệt Thực.',
        requirements: [
            { type: RequirementType.MysterySolved, targetId: 'mystery_eclipse_prophecy', description: 'Giải lời tiên đoán nguyệt thực' },
        ],
        hints: [
            'Cần tìm tất cả 5 biểu tượng trong lời tiên đoán.',
            'Nghi lễ chỉ có thể thực hiện trong nguyệt thực.',
        ],
        unlockedBy: [],
        seenBy: [],
        visibleOnMap: false,
    },

    // --- Items ---
    {
        id: 'item_moonlight_elixir',
        type: LockedContentType.Item,
        name: 'Tinh Chất Ánh Trăng',
        description: 'Một lọ nước phát sáng ánh trăng, được tìm thấy trong hang động bí mật.',
        requirements: [
            { type: RequirementType.Discovery, targetId: 'well_secret_room', description: 'Phòng bí mật dưới giếng' },
        ],
        hints: [
            'Tinh chất chỉ xuất hiện tronghang động tối.',
            'Cần khám phá bí mật dưới giếng.',
        ],
        unlockedBy: [],
        seenBy: [],
        visibleOnMap: false,
    },

    // --- Quests ---
    {
        id: 'quest_lost_relics',
        type: LockedContentType.Quest,
        name: 'Nhiệm Vụ Relic Mất Tích',
        description: 'Tìm kiếm những relic cổ đã mất tích từ lâu.',
        requirements: [
            { type: RequirementType.Level, targetId: '', amount: 8, description: 'Level 8' },
            { type: RequirementType.Clue, targetId: 'clue_trader_cipher', description: 'Manh mối từ Thương Nhân' },
        ],
        hints: [
            'Thương Nhân bí ẩn có thể biết về các relic.',
            'Cần đạt level cao hơn để tham gia.',
        ],
        unlockedBy: [],
        seenBy: [],
        visibleOnMap: false,
    },
];

// ============================================================
// 5. DISCOVERY CHAINS — Chuỗi khám phá
// ============================================================

export const DISCOVERY_CHAINS: Omit<DiscoveryChain, 'playerId' | 'currentStepIndex' | 'startedAt' | 'completedAt'>[] = [
    // --- Chain: Giải Tháp Cổ ---
    {
        id: 'chain_tower_quest',
        name: '🗼 Cuộc Phiêu Lưu Tháp Cổ',
        description: 'Tìm 3 chìa khóa để mở Tháp Cổ và khám phá bí mật.',
        steps: [
            {
                id: 'step_find_tower',
                type: ChainStepType.Discovery,
                targetId: 'old_tower',
                description: 'Tìm vị trí Tháp Cổ',
                completed: false,
            },
            {
                id: 'step_find_moon_key',
                type: ChainStepType.Secret,
                targetId: 'secret_moon_key',
                description: 'Tìm Chìa Mặt Trăng',
                completed: false,
            },
            {
                id: 'step_find_sun_key',
                type: ChainStepType.Secret,
                targetId: 'secret_sun_key',
                description: 'Tìm Chìa Mặt Trời',
                completed: false,
            },
            {
                id: 'step_find_star_key',
                type: ChainStepType.Secret,
                targetId: 'secret_star_key',
                description: 'Tìm Chìa Ngôi Sao',
                completed: false,
            },
            {
                id: 'step_open_tower',
                type: ChainStepType.Unlock,
                targetId: 'region_old_tower',
                description: 'Mở Tháp Cổ',
                completed: false,
            },
        ],
        completionReward: {
            type: 'discovery',
            targetId: 'tower_chamber',
            description: 'Phát hiện Phòng Bí Mật trong Tháp',
        },
        cancellable: false,
    },

    // --- Chain: Bí Mật Giếng Cổ ---
    {
        id: 'chain_well_quest',
        name: '🕳️ Bí Ẩn Giếng Cổ',
        description: 'Khám phá bí mật ẩn dưới giếng cổ.',
        steps: [
            {
                id: 'step_observe_well',
                type: ChainStepType.Clue,
                targetId: 'clue_well_light',
                description: 'Quan sát ánh sáng từ giếng',
                completed: false,
            },
            {
                id: 'step_research_history',
                type: ChainStepType.Clue,
                targetId: 'clue_well_history',
                description: 'Tìm hiểu lịch sử giếng',
                completed: false,
            },
            {
                id: 'step_enter_well',
                type: ChainStepType.Unlock,
                targetId: 'region_well_chamber',
                description: 'Xuống giếng khám phá',
                completed: false,
            },
        ],
        completionReward: {
            type: 'item',
            targetId: 'moonlight_elixir',
            amount: 1,
            description: 'Nhận Tinh Chất Ánh Trăng',
        },
        cancellable: true,
    },

    // --- Chain: Giải Biểu Tượng ---
    {
        id: 'chain_symbol_quest',
        name: '🌍 Hành Trình Biểu Tượng',
        description: 'Tìm và hiểu ý nghĩa của biểu tượng bí ẩn xuất hiện khắp thế giới.',
        steps: [
            {
                id: 'step_find_forest_symbol',
                type: ChainStepType.Clue,
                targetId: 'clue_symbol_forest',
                description: 'Tìm biểu tượng trong rừng',
                completed: false,
            },
            {
                id: 'step_find_library_symbol',
                type: ChainStepType.Clue,
                targetId: 'clue_symbol_library',
                description: 'Tìm biểu tượng trong thư viện',
                completed: false,
            },
            {
                id: 'step_find_well_symbol',
                type: ChainStepType.Clue,
                targetId: 'clue_symbol_well',
                description: 'Tìm biểu tượng ở giếng',
                completed: false,
            },
            {
                id: 'step_find_tower_symbol',
                type: ChainStepType.Clue,
                targetId: 'clue_symbol_tower',
                description: 'Tìm biểu tượng trên tháp',
                completed: false,
            },
            {
                id: 'step_solve_mystery',
                type: ChainStepType.Mystery,
                targetId: 'mystery_world_symbol',
                description: 'Giải bí ẩn biểu tượng',
                completed: false,
            },
        ],
        completionReward: {
            type: 'lore',
            targetId: 'world_symbol_meaning',
            description: 'Hiểu ý nghĩa Biểu Tượng Thế Giới',
        },
        cancellable: false,
    },
];

// ============================================================
// 6. HELPER FUNCTIONS
// ============================================================

/**
 * Lấy mystery theo ID.
 */
export function getMysteryById(id: string): Mystery | undefined {
    return MYSTERIES.find(m => m.id === id);
}

/**
 * Lấy secret theo ID.
 */
export function getSecretById(id: string): Secret | undefined {
    return SECRETS.find(s => s.id === id);
}

/**
 * Lấy clue theo ID.
 */
export function getClueById(id: string): Clue | undefined {
    return CLUES.find(c => c.id === id);
}

/**
 * Lấy clues cho một mystery.
 */
export function getCluesForMystery(mysteryId: string): Clue[] {
    return CLUES.filter(c => c.mysteryId === mysteryId).sort((a, b) => a.order - b.order);
}

/**
 * Lấy locked content theo ID.
 */
export function getLockedContentById(id: string): LockedContent | undefined {
    return LOCKED_CONTENT.find(lc => lc.id === id);
}

/**
 * Lấy chain definition theo ID.
 */
export function getChainById(id: string): DiscoveryChain | undefined {
    return DISCOVERY_CHAINS.find(c => c.id === id) as DiscoveryChain | undefined;
}
