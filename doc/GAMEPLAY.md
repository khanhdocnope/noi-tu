# Gameplay Loop

## Flow chính

```
🎲 Random nhận một pet
   ↓
Chăm sóc pet
   ↓
Làm hoạt động
   ↓
Kiếm Coin
   ↓
Mua thức ăn / vật phẩm
   ↓
Khám phá / săn
   ↓
Nhận nguyên liệu + Coin + EXP
   ↓
Pet tăng Level
   ↓
Mở khóa artwork mới
   ↓
Evolution / nội dung mới
```

## Hoạt động hàng ngày

- Daily reward
- Năng lượng hồi phục
- Nhiệm vụ
- Hunting
- Random event
- Pet progression
- Artwork mới

## Cooldown

| Command | Cooldown |
|---------|----------|
| /feed | 30 phút |
| /play | 1 giờ |
| /rest | 1 giờ |
| /hunt | 30 phút |
| /daily | 24 giờ |

Cooldown phải được xử lý bằng timestamp. Không dùng `sleep()` trong bot.

## Anti-Abuse

- Cooldown server-side
- Transaction database phải atomic
- Không cộng Coin nhiều lần khi request chạy lại
- Quest reward chỉ nhận một lần
- Daily reward phải có claim record
- Inventory không được âm
- Coin không được âm
- Energy không vượt max
- Health không vượt max
