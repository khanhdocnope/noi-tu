# Commands

## MVP Commands

| Command | Mô tả | Cooldown |
|---------|-------|----------|
| `/start` | Random nhận pet | - |
| `/profile` | Xem profile pet | - |
| `/feed` | Cho pet ăn | 30 phút |
| `/play` | Chơi với pet | 1 giờ |
| `/rest` | Cho pet nghỉ ngơi | 1 giờ |
| `/hunt` | Pet đi săn | 30 phút |
| `/daily` | Nhận daily reward | 24 giờ |
| `/shop` | Xem shop | - |
| `/buy` | Mua vật phẩm | - |
| `/inventory` | Xem inventory | - |
| `/quests` | Xem nhiệm vụ | - |
| `/memories` | Xem ký ức pet | - |

## Phase 2

- Quests
- Memories
- Rare items
- Random events
- Pet personality
- Evolution
- More hunting areas

## Phase 3

- Pet House
- Equipment
- Crafting
- Collections
- Achievements
- Trading
- Seasonal events

## Phase 4 (chỉ khi có người chơi)

- Guild
- Party
- World boss
- Global events
- Market
- Breeding
- Multiple pets

## Command Structure

```ts
export async function execute(interaction: ChatInputCommandInteraction) {
  const result = await huntingService.hunt(interaction.user.id, "misty_forest");
  await interaction.reply(buildHuntEmbed(result));
}
```

Command chỉ là lớp giao tiếp. Không đặt logic trong command.
