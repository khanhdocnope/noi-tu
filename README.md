# Bot Nối Từ Discord

Bot Discord **chính chủ** (dùng bot token hợp pháp qua Discord Developer Portal, không phải self-bot) chơi trò Nối Từ tiếng Việt, dựa trên kho từ vựng `words.txt`.

## Luật chơi

1. Từ người chơi gõ phải **tồn tại nguyên văn trong kho từ vựng** (`words.txt`) — so khớp chuỗi trực tiếp, không tự suy diễn ngữ pháp.
2. Âm tiết đầu của từ mới phải trùng với âm tiết cuối của từ trước đó.
   - Ví dụ: `"con mèo"` → từ tiếp theo phải bắt đầu bằng `"mèo"`.
3. Một từ đã dùng trong ván thì không được dùng lại.

## Cấu trúc project

```
noitu_bot/
├── bot.py            # Bot chính, xử lý Discord events & slash commands
├── game.py           # Logic ván chơi (GameState, GameManager, luật nối từ)
├── dictionary.py      # Nạp và tra cứu kho từ vựng
├── words.txt          # Kho từ vựng đã làm sạch (từ TuVung.txt gốc)
├── requirements.txt
└── .env                # Bạn tự tạo, chứa DISCORD_BOT_TOKEN (không commit lên git)
```

**Về `words.txt`**: được xử lý từ `TuVung.txt` gốc — loại bỏ 15 dòng lỗi định dạng (không phải cụm 2 âm tiết, ví dụ đơn vị đo như "kilo", "centi") và 965 dòng trùng lặp. Còn lại **52,882 cụm từ** hợp lệ.

## Bước 1: Tạo bot trên Discord Developer Portal

1. Vào https://discord.com/developers/applications → **New Application**.
2. Đặt tên bot (vd: "Bot Nối Từ").
3. Vào tab **Bot** → **Add Bot**.
4. Bật **MESSAGE CONTENT INTENT** (bắt buộc để bot đọc tin nhắn thường trong game).
5. Copy **Token** (nút "Reset Token" nếu cần) — đây là token bí mật, không chia sẻ với ai.
6. Vào tab **OAuth2 → URL Generator**:
   - Scopes: chọn `bot` và `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Add Reactions`, `Use Slash Commands`
   - Copy URL sinh ra, mở trong trình duyệt để mời bot vào server của bạn.

## Bước 2: Cài đặt môi trường

```bash
cd noitu_bot
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Tạo file `.env` trong cùng thư mục:

```
DISCORD_BOT_TOKEN=token_ban_vua_copy_o_buoc_1
```

## Bước 3: Chạy bot

```bash
python bot.py
```

Nếu thành công, terminal sẽ hiện log kiểu:
```
Đã nạp 52882 cụm từ vào kho từ vựng.
Đăng nhập thành công: BotNốiTừ#1234 (id=...)
Đã đồng bộ 4 slash command(s).
```

## Cách chơi trên Discord

| Lệnh | Chức năng |
|---|---|
| `/noitu_batdau` | Bắt đầu ván mới (có thể kèm từ đầu tiên) |
| `/noitu_ketthuc` | Kết thúc ván hiện tại |
| `/noitu_trangthai` | Xem từ cuối cùng và số từ đã dùng |
| `/noitu_tra <từ>` | Tra cứu 1 từ có trong kho từ vựng không |

Sau khi `/noitu_batdau`, chỉ cần gõ tin nhắn thường (2 từ, ví dụ `mèo con`) trong kênh đó — bot tự động kiểm tra và phản hồi bằng reaction ✅/❌ kèm giải thích nếu sai.

## Deploy lên server (tùy chọn)

Bot này chạy liên tục (long-running process), phù hợp deploy trên các nền tảng như Render, Railway, hoặc VPS — tương tự cách bạn từng deploy self-bot cũ trên Render, nhưng lần này **không cần Flask control panel** vì đây là bot chính chủ dùng slash command chuẩn, không cần giao diện web riêng để điều khiển.

Nếu muốn mình dựng thêm:
- Deploy config cho Render (Procfile / render.yaml)
- Web dashboard xem thống kê ván chơi
- Chế độ nhiều người chơi theo lượt (turn-based, không cho người vừa đi lại đi tiếp)

cứ nói mình biết.
