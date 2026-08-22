# 🐾 Nuôi Một Thứ

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

Tạo SQL trên Supabase Dashboard → SQL Editor:

```sql
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  coin INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE species (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT DEFAULT 'common',
  spawn_weight INTEGER DEFAULT 50,
  base_stats JSONB DEFAULT '{"health": 100, "hunger": 100, "energy": 100, "mood": 50}'
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE species DISABLE ROW LEVEL SECURITY;
```

## Chạy

```bash
# Chạy bot
npm run dev

# Chạy web admin
npm run dev:web

# Chạy cả hai
npm run dev:all
```

Web admin: http://localhost:3000

## Commands

| Command | Mô tả |
|---------|-------|
| `/start` | Random nhận pet |
| `/profile` | Xem profile pet |
| `/feed` | Cho pet ăn (coming soon) |
| `/play` | Chơi với pet (coming soon) |
| `/hunt` | Pet đi săn (coming soon) |
| `/daily` | Nhận daily reward (coming soon) |

## Web Admin

- 🐱 **Pets** - Xem & quản lý tất cả pet
- 🧬 **Species** - CRUD species
- 👥 **Users** - Xem users & transactions
- 🎨 **Artwork** - Upload ảnh lên Hugging Face

## Cấu trúc

```
src/
├── index.ts              # Entry point
├── client/               # Discord bot client
├── commands/             # Slash commands
├── modules/              # Gameplay logic
├── database/supabase/    # Supabase client
├── storage/              # Artwork service (HF)
├── web/                  # Web admin
├── data/                 # Game data
├── utils/                # Utilities
└── config/               # Env config
```

## Artwork

Ảnh pet được lưu trên [Hugging Face Datasets](https://huggingface.co/datasets/dobietdc/bot-artwork).

Cấu trúc:
```
bot-artwork/
├── fox/
│   ├── lv01.png
│   ├── lv05.png
│   └── ...
├── cat/
│   └── ...
└── ...
```

Upload trực tiếp từ Web Admin tab **Artwork**.

## License

MIT
