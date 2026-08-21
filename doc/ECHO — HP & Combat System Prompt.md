# HP & Combat System

Thêm hệ thống combat cơ bản cho ECHO.

## Player Stats

Mỗi player có:

```text
HP
Max HP
Attack
Defense
Speed
```

Có thể mở rộng thêm stat sau này.

## Combat

Combat phải đơn giản, nhanh và dễ mở rộng.

Encounter:

```text
Enemy
HP
Attack
Defense
```

Player có các action cơ bản:

```text
Attack
Defend
Use Item
Escape
```

Không bắt buộc mọi encounter phải dẫn tới combat.

Có thể thêm:

```text
Talk
Observe
Negotiate
```

sau này.

## Combat Flow

```text
Encounter
→ Player Choice
→ Action
→ Damage / Effect
→ Enemy Action
→ Repeat
→ Win / Lose / Escape
```

## Damage

Damage phải dựa trên stat và có randomness nhỏ.

Không để random quyết định hoàn toàn kết quả.

```text
Damage ≈ Attack - Defense
```

có thể mở rộng thêm:

```text
Critical
Element
Status Effect
Skill
Equipment
```

## HP

HP là một phần của gameplay world, không phải chỉ dùng cho PvP.

HP có thể ảnh hưởng:

```text
Exploration
Combat
Events
Risk
Recovery
```

Không để player bị khóa gameplay quá lâu vì hết HP.

Có thể thêm:

```text
Healing
Rest
Food
Potion
Regeneration
```

## Core Rule

Combat phải tạo ra **interaction và consequence**, không trở thành một chuỗi:

```text
Attack
→ Attack
→ Attack
→ Reward
```

Encounter có thể dẫn tới:

```text
Combat
Discovery
Quest
Item
Injury
New Location
New Opportunity
```

Combat chỉ là **một lựa chọn trong Core Loop**, không phải toàn bộ gameplay.

## Extensibility

Thiết kế combat module độc lập để sau này có thể thêm:

```text
Skills
Equipment
Classes
Enemies
Boss
PvP
Party
Co-op
Status Effects
Elements
```