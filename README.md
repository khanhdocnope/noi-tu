# Nuôi Một Thứ

Discord bot game theo mô hình **virtual pet + progression + economy + exploration**.

> Người chơi không chỉ "nuôi pet", mà đang nuôi một sinh vật dần thay đổi theo thời gian.

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript (strict mode)
- **Bot Framework:** discord.js v14
- **Database:** Supabase (PostgreSQL)
- **Artwork Storage:** Hugging Face Datasets
- **Web Admin:** Express.js

## Cài đặt

```bash
git clone https://github.com/dobietdc/nuoi-mot-thu.git
cd nuoi-mot-thu
npm install
```

## Cấu hình

Copy `.env.example` thành `.env` và điền:

```env
# Discord
DISCORD_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Hugging Face
HF_TOKEN=hf_xxx
HF_REPO=dobietdc/bot-artwork
```

### Supabase Setup

Tạo SQL trên Supabase Dashboard → SQL Editor (copy toàn bộ chạy 1 lần):

```sql
-- Users
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  coin INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets
CREATE TABLE pets (
  user_id TEXT PRIMARY KEY,
  species TEXT NOT NULL,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  health INTEGER DEFAULT 100,
  hunger INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  mood INTEGER DEFAULT 50,
  bond INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Species
CREATE TABLE species (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT DEFAULT 'common',
  spawn_weight INTEGER DEFAULT 50,
  base_stats JSONB DEFAULT '{"health": 100, "hunger": 100, "energy": 100, "mood": 50}'
);

-- Inventory
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Hunt Encounters
CREATE TABLE hunt_encounters (
  encounter_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area_id TEXT NOT NULL,
  min_level INTEGER DEFAULT 1,
  weight INTEGER DEFAULT 50,
  coin_min INTEGER DEFAULT 10,
  coin_max INTEGER DEFAULT 30,
  xp_min INTEGER DEFAULT 5,
  xp_max INTEGER DEFAULT 15,
  drops JSONB DEFAULT '{}',
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Items
CREATE TABLE shop_items (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT DEFAULT 'food',
  effect JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Claims
CREATE TABLE daily_claims (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS cho tất cả
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE species DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_encounters DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_claims DISABLE ROW LEVEL SECURITY;

-- Seed hunt encounters
INSERT INTO hunt_encounters (encounter_id, name, area_id, min_level, weight, coin_min, coin_max, xp_min, xp_max, drops, text) VALUES
('rabbit', '🐰 Thỏ rừng', 'misty_forest', 1, 50, 10, 30, 5, 15, '{"apple": 1}', 'Bạn tìm thấy một con thỏ nhỏ đang ăn cỏ!'),
('squirrel', '🐿️ Sóc nhỏ', 'misty_forest', 1, 40, 5, 20, 3, 10, '{"berry": 1}', 'Một con sóc nhảy từ cành này sang cành khác!'),
('deer', '🦌 Hươu con', 'misty_forest', 2, 30, 20, 50, 10, 25, '{"meat": 1}', 'Bạn phát hiện một con hươu con bên bờ suối!'),
('boar', '🐗 Lợn lòi', 'misty_forest', 3, 20, 30, 80, 15, 40, '{"meat": 2}', 'Một con lợn lòi hung dữ đang tìm thức ăn!'),
('wolf', '🐺 Sói xám', 'misty_forest', 5, 10, 50, 120, 25, 60, '{"meat": 3}', 'Bạn nghe thấy tiếng hú của đàn sói...'),
('treasure', '💰 Kho báu', 'misty_forest', 1, 5, 100, 200, 50, 100, '{}', 'Bạn tìm thấy một chiếc hộp gỗ cũ kỹ!');

-- Seed shop items
INSERT INTO shop_items (item_id, name, description, price, category, effect) VALUES
('apple', '🍎 Táo', 'Tăng 10 Hunger', 10, 'food', '{"hunger": 10}'),
('meat', '🥩 Thịt', 'Tăng 25 Hunger', 25, 'food', '{"hunger": 25}'),
('berry', '🫐 Quả mọng', 'Tăng 5 Hunger', 5, 'food', '{"hunger": 5}'),
('bone', '🦴 Xương', 'Tăng 10 Bond', 30, 'toy', '{"bond": 10}'),
('fish', '🐟 Cá', 'Tăng 15 Health', 20, 'food', '{"health": 15}');
```

## Chạy

```bash
# Chạy bot
npm run dev

# Web admin
http://localhost:3000/login
```

## Commands

| Command | Mô tả |
|---------|-------|
| `/start` | Random nhận pet |
| `/profile` | Xem profile pet với stats, progress bar, action buttons |
| `/inventory` | Xem túi đồ |
| `/feed` | Cho pet ăn |
| `/play` | Chơi với pet |
| `/rest` | Pet nghỉ ngơi |
| `/hunt` | Pet đi săn |
| `/daily` | Nhận daily reward |
| `/shop` | Mua items (Select Menu + Modal) |

## Profile Buttons

- **🍖 Cho ăn** — Select Menu chọn đồ ăn trong túi
- **🎮 Chơi đùa** — +15 XP, +1 Bond, +10 Mood, -15 Energy
- **⚔️ Săn bắn** — +20 XP, random coin, -20 Energy
- **🎒 Túi đồ** — Xem items

## Rarity System

| Rarity | Color | Hex |
|--------|-------|-----|
| Common | Gray | #99AAB5 |
| Uncommon | Green | #2ECC71 |
| Rare | Blue | #3498DB |
| Epic | Purple | #9B59B6 |
| Legendary | Gold | #F1C40F |

## Database Tables

| Table | Mô tả |
|-------|-------|
| `users` | User info, coin |
| `pets` | Pet stats, level, XP |
| `species` | Loài vật, rarity, base stats |
| `inventory` | Túi đồ user |
| `hunt_encounters` | Con mồi theo area/level |
| `shop_items` | Items bán trong shop |
| `daily_claims` | Lịch sử nhận daily |

## Cấu trúc

```
src/
├── index.ts              # Entry point (Bot + Express)
├── client/               # Discord bot client
├── commands/             # Slash commands
├── modules/              # Gameplay logic
├── database/supabase/    # Supabase client
├── storage/              # Artwork service (HF)
├── web/                  # Web admin
└── config/               # Env config
```

## Artwork

Ảnh pet được lưu trên [Hugging Face Datasets](https://huggingface.co/datasets/dobietdc/bot-artwork).

Upload trực tiếp từ Web Admin tab **Artwork**.

## License

MIT
