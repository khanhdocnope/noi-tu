# ECHO — The World That Remembers

> *Mỗi ngày mang đến một cơ hội mới. Mỗi lựa chọn để lại dấu vết.*

Discord bot game với hệ thống thế giới động, progression, mysteries, và world memory.

---

## Features

### 🌍 Thế Giới Động
- **Weather System** — Thời tiết thay đổi mỗi ngày (Clear, Rain, Storm, Fog, Snow, Eclipse, Heatwave)
- **Season System** — Bốn mùa luân phiên (30 ngày/mùa): Xuân → Hạ → Thu → Đông
- **World Level** — Thế giới phát triển dựa trên hành động của người chơi
- **World Memory** — Thế giới ghi nhớ và phản ứng với hành động

### 🎮 Gameplay
- **Daily Opportunities** — 1-3+ cơ hội/ngày (tùy level)
- **Chain Opportunities** — Một số lựa chọn mở ra cơ hội tiếp theo
- **Risk vs Reward** — Hệ thống xác suất, hidden rewards
- **Curiosity Hooks** — Mysteries, Secrets, Clues, Discovery Chains

### 👤 Player Progression
- **Level & XP** — Hệ thống level với XP scaling
- **Streak** — Đăng nhập hàng ngày (tính theo ngày thực)
- **Inventory** — Quản lý items
- **Discoveries** — Khám phá bí ẩn thế giới

### ⚙️ Technical
- **6x World Speed** — Thế giới trôi nhanh 6 lần (mỗi 4 tiếng advance 1 ngày)
- **Auto-Announce** — Bot tự động thông báo khi thế giới chuyển ngày
- **Per-Guild Config** — Mỗi server có timezone, speed riêng
- **SQLite Database** — Persistence-first, dễ migrate sang Supabase

---

## Cài Đặt

```bash
# Clone repo
git clone https://github.com/your-repo/echo.git
cd echo

# Install dependencies
npm install

# Tạo file .env từ .env.example
cp .env.example .env

# Chỉnh sửa .env với giá trị thực
```

---

## Cấu Hình

Tạo file `.env`:

```env
# Discord Bot Token (bắt buộc)
DISCORD_TOKEN=your_bot_token_here

# Guild ID (tùy chọn) — Nếu set, commands chỉ đăng ký cho server này
guildId=

# Privileged Users (tùy chọn) — Danh sách User IDs được dùng lệnh admin
# Format: ID1,ID2,ID3
ALLOWED_USERS=
```

Xem `.env.example` để biết tất cả biến môi trường.

---

## Chạy

```bash
# Development
npm start

# Build
npm run build
```

---

## Cấu Trúc Dự Án

```
src/
├── bootstrap.ts              # Khởi tạo services, dependency injection
├── index.ts                  # Entry point
├── core/                     # Business logic
│   ├── curiosity/            # Mysteries, Secrets, Clues, Discovery Chains
│   ├── opportunity/          # Daily opportunities, choices, outcomes
│   ├── player/               # Player state, XP, level, inventory, streak
│   └── world/                # World state, weather, season, regions
└── infrastructure/           # Hạ tầng kỹ thuật
    ├── config.ts             # Environment variables, privileged users
    ├── database/             # SQLite (better-sqlite3)
    ├── discord/              # Discord commands & events
    ├── notification/         # DM notifications (level-up, etc.)
    └── scheduler/            # Cron jobs, auto-announce, season engine
```

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Discord:** discord.js v14
- **Database:** SQLite (better-sqlite3)
- **Scheduler:** node-cron

---

## Discord Commands

### Cơ Bản
| Command | Mô tả | Permission |
|---------|-------|------------|
| `/help` | Hướng dẫn chơi | Everyone |
| `/ping` | Kiểm tra latency | Everyone |
| `/profile` | Xem hồ sơ nhân vật | Everyone |
| `/inventory` | Xem hành trang | Everyone |

### Thế Giới
| Command | Mô tả | Permission |
|---------|-------|------------|
| `/world` | Xem trạng thái thế giới | Everyone |
| `/world-memory` | Xem ký ức thế giới | Everyone |
| `/interact` | Tương tác (nhận cơ hội) | Everyone |

### Curiosity
| Command | Mô tả | Permission |
|---------|-------|------------|
| `/secrets` | Xem mysteries & secrets | Everyone |
| `/clues` | Xem manh mối | Everyone |
| `/curiosity` | Thống kê tò mò & rank | Everyone |

### Quản Lý
| Command | Mô tả | Permission |
|---------|-------|------------|
| `/schedule status` | Xem lịch trình | ManageGuild |
| `/schedule timezone <tz>` | Đặt timezone | **Privileged** |
| `/schedule speed <1-24>` | Đặt world speed | ManageGuild |
| `/schedule channel <#ch>` | Đặt kênh thông báo | **Privileged** |
| `/schedule toggle <on\|off>` | Bật/tắt scheduler | ManageGuild |
| `/skip-day` | Bỏ qua ngày (test) | **Admin + Privileged** |

---

## Quyền Hạn

### ManageGuild (Discord Permission)
- `/schedule status`, `/schedule speed`, `/schedule toggle`

### Privileged Users (Env: `ALLOWED_USERS`)
- `/schedule timezone`, `/schedule channel`
- `/skip-day` (cần thêm Administrator)

### Dev Mode
Nếu `ALLOWED_USERS` không được set → tất cả user đều dùng được lệnh privileged.

---

## World Speed

Thế giới ECHO trôi nhanh hơn thực tế:

| Speed | Interval | Giải thích |
|-------|----------|------------|
| 1x | 24 tiếng | 1 ngày thực = 1 ngày ECHO |
| 6x (default) | 4 tiếng | 1 ngày thực = 6 ngày ECHO |
| 12x | 2 tiếng | 1 ngày thực = 12 ngày ECHO |
| 24x | 1 tiếng | 1 ngày thực = 24 ngày ECHO |

**Streak** vẫn tính theo ngày thực (real-world days).

---

## Season System

| Season | Số ngày | Emoji |
|--------|---------|-------|
| Spring | 30 | 🌸 |
| Summer | 30 | ☀️ |
| Autumn | 30 | 🍂 |
| Winter | 30 | ⛄ |

---

## Curiosity Ranks

| Rank | Score | Emoji |
|------|-------|-------|
| Indifferent | 0+ | 😐 |
| Curious | 10+ | 🤔 |
| Inquisitive | 50+ | 🔍 |
| Explorer | 150+ | 🧭 |
| SecretHunter | 400+ | 🗝️ |
| Codebreaker | 800+ | 🔓 |
| CuriosityMaster | 1500+ | 👁️ |

---

## License

MIT
