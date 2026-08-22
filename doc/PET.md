# Pet System

## Random nhận pet

Khi người chơi sử dụng `/start`, bot sẽ random một pet từ pool species hiện có.

### Rarity System

| Rarity | Weight |
|--------|--------|
| Common | 60% |
| Uncommon | 25% |
| Rare | 10% |
| Epic | 4% |
| Legendary | 1% |

Mỗi species có `spawn_weight` riêng. Không triển khai pity system trong MVP.

## Pet Stats

```
pet_id
species
name
level
xp
health
hunger
energy
mood
bond
gold
created_at
last_active
```

## Chỉ số

### ❤️ Health
- Giảm khi: bỏ đói, event xấu, hunting thất bại
- Tăng bằng: food, rest, item đặc biệt

### 🍖 Hunger
- Giảm theo thời gian
- Feed làm tăng Hunger

### ⚡ Energy
- Dùng cho: play, hunting, explore
- Tự hồi theo thời gian

### 😊 Mood
- Ảnh hưởng nhẹ đến event và hành vi pet

### ❤️ Bond
- Tăng khi: feed, play, quest, hunting, chăm sóc liên tục
- Mở khóa: dialogue, cosmetic, special event, evolution

## Level System

### EXP Sources

| Activity | EXP |
|----------|-----|
| Feed | +nhỏ |
| Play | +vừa |
| Hunting | +vừa |
| Quest | +nhiều |
| Daily | +nhỏ |
| Event | +tùy event |

### Level Formula

```
required_xp = 100 × level^1.35
```

Ví dụ:
- Lv.1 → Lv.2: 100 XP
- Lv.2 → Lv.3: 150 XP
- Lv.3 → Lv.4: 220 XP
- Lv.4 → Lv.5: 300 XP

### Level Unlocks

Mỗi level có thể mở khóa:
- Artwork
- Dialogue
- Item
- Hunting area
- Quest
- Feature

## Species (MVP)

```
🐱 Cat
🦊 Fox
🐰 Rabbit
🐺 Wolf
🐉 Unknown Creature
```

Mỗi species có:
- species_id
- name
- description
- base_stats
- growth_stats
- artwork_set
- possible_evolutions
- rarity
- spawn_weight

## Evolution

Điều kiện evolution kết hợp:
- Level
- Bond
- Hunting
- Mood
- Special Item

Ví dụ:
```
Lv.20 + Bond >= 10 + Moon Fragment × 3 → Evolution
```

Chỉ cần 1-2 nhánh evolution trong MVP.
