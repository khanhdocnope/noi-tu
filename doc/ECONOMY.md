# Economy System

## Currency

MVP chỉ sử dụng **Coin** (🪙). Không dùng premium currency.

## Nguồn Coin

### Daily Reward

```
/daily → +100 🪙 +20 XP
```

Streak tăng nhẹ phần thưởng. Không để daily thành nguồn tiền vô hạn.

### Hunting

```
/hunt → +30-120 🪙 / run
```

Kết quả random theo encounter.

### Quest

```
/quests → +100-400 🪙
```

## Shop Categories

```
🍖 Food
🧪 Medicine
⚡ Energy
🎒 Utility
🎨 Cosmetic
```

## Item Economy

### Consumable (dùng một lần)
- Apple
- Meat
- Medicine
- Energy Drink

### Material (dùng về sau)
- Wood
- Herb
- Monster Fang
- Moon Fragment

## Economy Balance

| Loại | Giá trị |
|------|---------|
| Daily income | 100-150 Coin |
| Hunting | 30-120 Coin/run |
| Quest | 100-400 Coin |
| Basic food | 50-100 Coin |
| Medicine | 150-250 Coin |

## Money Sinks

- Food
- Medicine
- Energy
- Cosmetic
- Rename pet
- Pet house
- Special event

## Economy Service

```ts
economy.addCoins(userId, 100, "daily_reward");
economy.removeCoins(userId, 50, "buy_apple");
```

Mọi thay đổi Coin phải đi qua economy service. Không viết `user.coin += 100` rải rác.

## Transaction Logging

Mọi transaction phải log:

```
id
user_id
type
amount
reason
created_at
```

## Anti-Abuse

- Transaction phải atomic
- Không cộng Coin nhiều lần khi request chạy lại
- Coin không được âm
- Inventory không được âm
