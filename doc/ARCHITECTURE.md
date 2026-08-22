# Kiến trúc Modular

## Cấu trúc thư mục

```
src/
├── index.ts
├── client/
│   ├── bot.ts
│   ├── command-handler.ts
│   └── event-handler.ts
│
├── commands/
│   ├── start.ts
│   ├── profile.ts
│   ├── feed.ts
│   ├── play.ts
│   ├── rest.ts
│   ├── hunt.ts
│   ├── daily.ts
│   ├── shop.ts
│   ├── buy.ts
│   ├── inventory.ts
│   ├── quests.ts
│   └── memories.ts
│
├── modules/
│   ├── pet/
│   │   ├── pet.service.ts
│   │   ├── pet.types.ts
│   │   ├── pet.repository.ts
│   │   └── pet-artwork.service.ts
│   │
│   ├── economy/
│   │   ├── economy.service.ts
│   │   ├── economy.types.ts
│   │   └── economy.repository.ts
│   │
│   ├── hunting/
│   │   ├── hunting.service.ts
│   │   ├── hunting.types.ts
│   │   └── hunting.data.ts
│   │
│   ├── quests/
│   ├── inventory/
│   ├── progression/
│   ├── events/
│   └── memories/
│
├── database/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── repositories/
│   └── migrations/
│
├── storage/
│   └── artwork.service.ts    # Hugging Face integration
│
├── data/
│   ├── species/
│   ├── items/
│   ├── shop/
│   ├── quests/
│   ├── hunting/
│   └── events/
│
├── utils/
│   ├── random.ts
│   ├── cooldown.ts
│   ├── time.ts
│   └── format.ts
│
└── config/
    └── env.ts
```

## Flow chính

```
Slash Command → Service → Repository → Supabase (PostgreSQL)
                         ↓
                       Result
                         ↓
                  Artwork Service → Hugging Face Dataset
                         ↓
                    Discord Embed (with image)
```

## Nguyên tắc

1. **commands/** chỉ nhận input từ Discord, kiểm tra quyền/cooldown cơ bản và gọi service
2. **modules/** chứa toàn bộ gameplay logic
3. **database/** chỉ chịu trách nhiệm lưu/truy xuất dữ liệu
4. **data/** chứa cấu hình game, loot table, species, item, quest và reward
5. **assets/** chứa artwork và tài nguyên tĩnh
6. Các module không được phụ thuộc vòng tròn vào nhau
7. Logic quan trọng phải có thể gọi từ service mà không cần Discord context để dễ test

## Service Layer

```ts
await petService.feed(userId, itemId);
await huntingService.hunt(userId, areaId);
await economyService.addCoins(userId, 100, "daily_reward");
await questService.claimReward(userId, questId);
```

Command chỉ là lớp giao tiếp:

```ts
export async function execute(interaction: ChatInputCommandInteraction) {
  const result = await huntingService.hunt(interaction.user.id, "misty_forest");
  await interaction.reply(buildHuntEmbed(result));
}
```

Không đặt logic random reward, tính EXP, trừ Coin hoặc cập nhật pet trực tiếp trong command.

## TypeScript Config

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Không dùng `any` cho gameplay data. Các loại như `Species`, `Item`, `HuntResult`, `PetStats` và `EconomyTransaction` phải có type/interface rõ ràng.
