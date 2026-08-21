# ECHO — Curiosity Hooks Implementation Plan

## Mục tiêu
Triển khai hệ thống Curiosity Hooks theo tài liệu `doc/Curiosity Hooks.md`, bao gồm:
- Mysteries (bí ẩn)
- Secrets (ẩn chứa)
- Locked Content (nội dung bị khóa)
- Clue Chains (chuỗi manh mối)
- Delayed Payoff (phần thưởng trì hoãn)
- Persistent Curiosity (tò mò bền vững)
- Community Curiosity (tò mò cộng đồng)

---

## Phần 1: CuriosityHooksTypes.ts

### Mystery Types
```typescript
enum MysteryType {
    StrangeItem = 'strange_item',           // Item không rõ công dụng
    UnusualNPC = 'unusual_npc',             // NPC hành vi bất thường
    HiddenLocation = 'hidden_location',     // Địa điểm không trên bản đồ
    UnexplainedEvent = 'unexplained_event', // Sự kiện không giải thích
    RepeatedSymbol = 'repeated_symbol',     // Symbol xuất hiện nhiều nơi
    UnfinishedDialogue = 'unfinished_dialogue' // Hội thoại bị bỏ dở
}
```

### Secret Types
```typescript
enum SecretType {
    SecretNPC = 'secret_npc',
    SecretLocation = 'secret_location',
    SecretQuest = 'secret_quest',
    SecretItem = 'secret_item',
    SecretEvent = 'secret_event',
    SecretOutcome = 'secret_outcome'
}
```

### Clue Types
```typescript
interface Clue {
    id: string;
    mysteryId: string;           // Mystery mà clue này liên quan
    description: string;         // Mô tả manh mối
    source: 'npc' | 'item' | 'location' | 'event' | 'choice';
    requiredClues: string[];     // Các clue cần thiết trước khi thấy clue này
    unlockCondition?: Condition; // Điều kiện để thấy clue
}
```

### Discovery Chain
```typescript
interface DiscoveryChain {
    id: string;
    name: string;
    steps: DiscoveryStep[];
    currentStep: number;
    startedAt?: Date;
    completedAt?: Date;
}

interface DiscoveryStep {
    id: string;
    type: 'clue' | 'discovery' | 'unlock' | 'mystery';
    targetId: string;           // ID của clue/discovery/mystery
    description: string;
    completed: boolean;
    completedAt?: Date;
}
```

### Locked Content
```typescript
interface LockedContent {
    id: string;
    type: 'region' | 'item' | 'quest' | 'npc' | 'event';
    name: string;
    description: string;        // Mô tả (có thể ẩn)
    requirements: Requirement[];
    hints: string[];            // Manh mối để mở khóa
    unlockedBy: string[];       // Player đã mở khóa
}

interface Requirement {
    type: 'item' | 'discovery' | 'relationship' | 'level' | 'clue';
    targetId: string;
    amount?: number;
}
```

### Player Curiosity State
```typescript
interface PlayerCuriosityState {
    playerId: string;
    
    // Mysteries đã phát hiện
    discoveredMysteries: DiscoveredMystery[];
    
    // Secrets đã tìm thấy
    foundSecrets: FoundSecret[];
    
    // Clues đã thu thập
    collectedClues: CollectedClue[];
    
    // Discovery chains đang thực hiện
    activeChains: DiscoveryChain[];
    
    // Locked content đã thấy (biết là có tồn tại)
    seenLockedContent: string[];
    
    // Curiosity score (đo lường tò mò)
    curiosityScore: number;
}

interface DiscoveredMystery {
    mysteryId: string;
    discoveredAt: Date;
    cluesFound: number;
    totalClues: number;
    solved: boolean;
    solvedAt?: Date;
}

interface FoundSecret {
    secretId: string;
    foundAt: Date;
    sharedWith: string[];       // Đã chia sẻ với ai
}

interface CollectedClue {
    clueId: string;
    collectedAt: Date;
    source: string;             // Từ đâu có được
}
```

---

## Phần 2: CuriosityService.ts

### Core Methods

```typescript
class CuriosityService {
    // --- Mystery Management ---
    async discoverMystery(playerId, mysteryId): Promise<MysteryResult>
    async addClueToMystery(playerId, mysteryId, clueId): Promise<void>
    async solveMystery(playerId, mysteryId): Promise<SolutionResult>
    
    // --- Secret Management ---
    async findSecret(playerId, secretId): Promise<SecretResult>
    async shareSecret(playerId, secretId, targetPlayerId): Promise<void>
    
    // --- Clue Management ---
    async collectClue(playerId, clueId): Promise<ClueResult>
    async getAvailableClues(playerId): Promise<Clue[]>
    
    // --- Discovery Chain ---
    async startChain(playerId, chainId): Promise<void>
    async advanceChain(playerId, chainId): Promise<ChainResult>
    async getActiveChains(playerId): Promise<DiscoveryChain[]>
    
    // --- Locked Content ---
    async seeLockedContent(playerId, contentId): Promise<void>
    async checkUnlockRequirements(playerId, contentId): Promise<UnlockCheck>
    async unlockContent(playerId, contentId): Promise<UnlockResult>
    
    // --- Curiosity Score ---
    async updateCuriosityScore(playerId, amount): Promise<void>
    async getCuriosityRank(playerId): Promise<CuriosityRank>
}
```

### Integration Points

1. **OpportunityService** - Khi player chọn choice:
   - Có thể trigger mystery discovery
   - Có thể unlock clue
   - Có thể tìm secret

2. **WorldMemoryService** - Khi tạo memory:
   - Mystery discovery tạo world memory
   - Secret finding tạo community clue

3. **PlayerService** - Khi cập nhật player:
   - Curiosity score ảnh hưởng đến rarity roll
   - Discoveries mở khóa content mới

---

## Phần 3: Content Configuration

### Mysteries (trong OpportunityConfig)

```typescript
// Mystery: Strange Symbol
{
    id: 'mystery_strange_symbol',
    title: '🔮 Biểu Tượng Kỳ Lạ',
    description: 'Bạn thấy một biểu tượng lạ mắt trên bức tường cổ. Nó có vẻ không thuộc về bất kỳ ngôn ngữ nào bạn biết...',
    type: 'mystery',
    mysteryType: MysteryType.RepeatedSymbol,
    clues: ['clue_symbol_location', 'clue_symbol_meaning'],
    reward: { type: 'discovery', targetId: 'strange_symbol' }
}

// Mystery: NPC Behavior
{
    id: 'mystery_elias_behavior',
    title: '🤫 Hành Vi Bất Thường Của Elias',
    description: 'Elias có vẻ lo lắng hơn bình thường. Ông ấy liên tục nhìn về phía khu rừng...',
    type: 'mystery',
    mysteryType: MysteryType.UnusualNPC,
    clues: ['clue_elias_fear', 'clue_elias_past'],
    reward: { type: 'relationship', targetId: 'elias', amount: 10 }
}
```

### Secrets (ẩn trong choices)

```typescript
// Secret Outcome trong choice
{
    id: 'explore_well',
    text: '⬇️ Xuống giếng khám phá',
    outcome: {
        results: [
            {
                weight: 70,
                text: 'Bạn xuống giếng và tìm thấy kho báu!',
                rewards: [{ type: 'xp', amount: 50 }],
                tag: 'success'
            },
            {
                weight: 5,  // Secret outcome - hiếm
                text: 'Bạn tìm thấy một cánh cửa bí mật phía sau giếng!',
                rewards: [
                    { type: 'discovery', targetId: 'secret_well_door' },
                    { type: 'item', targetId: 'ancient_key', itemName: 'Chìa Khóa Cổ', itemType: 'key', amount: 1 }
                ],
                tag: 'critical',
                nextOpportunityId: 'secret_well_chamber'
            }
        ]
    }
}
```

### Locked Content

```typescript
// Region bị khóa
{
    id: 'region_old_tower',
    name: 'Tháp Cổ',
    status: RegionStatus.Locked,
    requirements: [
        { type: 'item', targetId: 'ancient_key' },
        { type: 'discovery', targetId: 'tower_location' }
    ],
    hints: [
        'Một tháp cổ được nhắc đến trong truyền thuyết...',
        'Cần tìm chìa khóa và vị trí chính xác'
    ]
}
```

---

## Phần 4: Discord Commands

### /secrets
Hiển thị các mysteries và secrets đã phát hiện:
- Mysteries đang investigate
- Clues đã thu thập
- Secrets đã tìm thấy
- Locked content đã thấy

### /clues
Hiển thị các manh mối hiện có:
- Clues mới nhất
- Clues liên quan đến mystery cụ thể
- Hints để tìm clue tiếp theo

### /curiosity
Thống kê tò mò:
- Curiosity score
- Số mysteries đã solve
- Số secrets đã find
- Rank trong server

---

## Phần 5: Tích hợp với Hệ thống Hiện Tại

### OpportunityService Updates
- Thêm mystery/secret triggers vào outcomes
- Kiểm tra player curiosity state khi roll opportunity
- Unlock content dựa trên discoveries

### WorldMemoryService Updates
- Mystery discovery tạo world memory
- Secret finding tạo community clue
- Curiosity actions ảnh hưởng world state

### PlayerState Updates
- Thêm `curiosityState: PlayerCuriosityState`
- Curiosity score ảnh hưởng rarity roll
- Discoveries mở khóa content mới

---

## Phần 6: Implementation Order

1. **CuriosityHooksTypes.ts** - Types và interfaces
2. **CuriosityService.ts** - Core logic
3. **Update PlayerStateTypes** - Thêm curiosityState
4. **Update OpportunityConfig** - Thêm mystery/secret content
5. **Update OpportunityService** - Tích hợp curiosity triggers
6. **Create /secrets command** - UI cho mysteries
7. **Create /clues command** - UI cho clues
8. **Test curiosity system** - Verify functionality

---

## Design Principles (from Curiosity Hooks.md)

1. **Signal, Don't Explain** - Đưa tín hiệu, không giải thích
2. **Mystery Must Lead Somewhere** - Mystery phải tạo gameplay
3. **No Fake Curiosity** - Không clickbait
4. **Delayed Payoff** - Mystery có thể kéo dài nhiều ngày
5. **Persistent Curiosity** - World nhớ những gì player đã làm
6. **Curiosity Through Choice** - Mỗi lựa chọn mở mystery khác nhau
7. **Curiosity Through Failure** - Thất bại có thể tạo clue mới
8. **Community Curiosity** - Mystery có thể là server-wide
