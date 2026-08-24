# 🐾 Hướng Dẫn Chơi Nuôi Một Thứ

## Bắt Đầu

```
/start        - Nhận pet ngẫu nhiên (miễn phí)
/roll         - Roll pet mới (tốn 100 🪙)
```

## Xem Thông Tin

```
/me           - Xem profile pet (stats, level, rarity)
/bag          - Xem túi đồ
```

## Chăm Sóc Pet

```
/feed         - Cho pet ăn (từ túi đồ)
/.play        - Chơi với pet (+15 XP, +1 Bond, +10 Mood, -15 Energy)
/rest         - Nghỉ ngơi 5 phút (+30 Energy, +10 Health)
```

## Kiếm Tiền

```
/hunt         - Pet đi săn (bắt động vật, -20 Energy)
/daily        - Nhận 50 🪙 mỗi ngày
/sell         - Bán động vật lấy coin
```

## Mua Bán

```
/shop         - Xem cửa hàng
/market list  - Đăng bán lên chợ
/market view  - Xem chợ
```

---

## Hệ Thống Stats

| Stat | Mô tả | Tối đa |
|------|-------|--------|
| ❤️ Health | Máu, giảm khi hunger = 0 | 100 |
| 🍖 Hunger | No, giảm 8/giờ | 100 |
| ⚡ Energy | Năng lượng, dùng để săn/chơi | 100 |
| 😊 Mood | Tâm trạng, giảm 5/giờ | 100 |
| 💖 Bond | Thân thiết, tăng khi tương tác | Vô hạn |
| ✨ XP | Kinh nghiệm, lên level | Tùy level |

## Level Up

- XP cần = `100 × level^1.35`
- Pet tự động lên level khi đủ XP

## Rarity System

| Rarity | Màu | Tỷ lệ roll |
|--------|-----|------------|
| ⚪ Common | Xám | Cao |
| 🟢 Uncommon | Xanh lá | Trung bình |
| 🔵 Rare | Xanh dương | Thấp |
| 🟣 Epic | Tím | Rất thấp |
| 🟡 Legendary | Vàng | Cực thấp |

## Hệ Thống Nghỉ Ngơi

- `/rest` → Bắt đầu nghỉ 5 phút
- Pet **không thể săn/chơi** khi đang nghỉ
- Sau 5 phút → Tự động hồi phục
- Xem status nghỉ trên `/profile`

## Hệ Thống Săn

- `/hunt` → Bắt động vật vào túi
- Mỗi vùng có level tối thiểu
- Động vật bán được qua `/sell`

| Động vật | Level | Giá bán |
|----------|-------|---------|
| 🐿️ Sóc nhỏ | 1+ | 10 🪙 |
| 🐰 Thỏ rừng | 1+ | 15 🪙 |
| 🦌 Hươu con | 2+ | 40 🪙 |
| 🐗 Lợn lòi | 3+ | 60 🪙 |
| 🐺 Sói xám | 5+ | 100 🪙 |
| 💰 Kho báu | 1+ | 150 🪙 |

## Hệ Thống Chợ

1. Admin đặt kênh chợ: `/market set`
2. Đăng bán: `/market list` → Chọn vật phẩm → Nhập số lượng + giá
3. Mua: `/market view` → Chọn vật phẩm → Xác nhận
4. Phí giao dịch: **5%**

## Prefix Commands

Ngoài slash commands, có thể dùng `.`:

| Prefix | Lệnh |
|--------|-------|
| `.me` | Xem profile |
| `.bag` | Xem túi đồ |
| `.start` | Bắt đầu |
| `.daily` | Nhận reward |
| `.feed` | Cho ăn |
| `.play` | Chơi |
| `.rest` | Nghỉ ngơi |
| `.hunt` | Săn |
| `.shop` | Cửa hàng |
| `.sell` | Bán |
| `.roll` | Roll pet |

## Mẹo

1. **Cho ăn thường xuyên** — Hunger giảm 8/giờ, để 0 sẽ mất Health
2. **Nghỉ ngơi trước khi săn** — Săn tốn 20 Energy
3. **Bán động vật** thay vì giữ trong túi
4. **Kiểm tra chợ** — Có thể mua rẻ hơn shop
5. **Roll pet** nếu muốn pet rarity cao hơn
