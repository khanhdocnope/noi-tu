# ECHO — Core Loop Specification

> **Project Codename:** ECHO  
> **Tagline:** *The world that remembers.*  
> **Document:** Core Loop  
> **Status:** Foundation / Flexible  
> **Priority:** RAM efficiency → Response latency → Storage efficiency  
> **Language:** TypeScript + Node.js
> **Architecture:** Async, event-driven, modular, persistence-first

---

# 1. Vision

ECHO là một Discord bot có cấu trúc như một **persistent social game**.

Bot không tồn tại chỉ để cung cấp command.

Bot tồn tại để tạo ra một thế giới có:

- trạng thái;
- tiến trình;
- sự kiện;
- phần thưởng;
- lựa chọn;
- ký ức;
- và những thứ chưa được khám phá.

Mục tiêu của Core Loop:

> **User có một lý do để quay lại mỗi ngày, nhưng không cảm thấy mình đang thực hiện một danh sách nhiệm vụ bắt buộc.**

Core Loop phải đủ ổn định để giữ gameplay nhất quán, nhưng đủ mở để sau này có thể bổ sung:

- combat;
- exploration;
- crafting;
- economy;
- guild;
- PvP;
- NPC;
- lore;
- world event;
- seasonal content;
- collection;
- achievements;
- mini-games;
- user-generated content;
- hoặc những hệ thống chưa được nghĩ tới.

---

# 2. Nguyên tắc thiết kế

## 2.1. Không biến Daily thành công việc

Daily không nên có cấu trúc:

```text
Login
↓
Click button
↓
Nhận reward
↓
Thoát
```

Đó chỉ là retention giả.

Thay vào đó:

```text
World State
    ↓
Personal Context
    ↓
Today's Opportunity
    ↓
User Choice
    ↓
Action
    ↓
Consequence
    ↓
Reward / Progress
    ↓
World Changes
```

User phải cảm thấy:

> "Hôm nay có chuyện xảy ra."

thay vì:

> "Hôm nay tôi phải hoàn thành nhiệm vụ."

---

# 3. Core Loop

Core Loop chính gồm 6 giai đoạn.

```text
┌──────────────────────┐
│ 1. WORLD OBSERVATION │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ 2. DAILY OPPORTUNITY │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ 3. USER ACTION       │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ 4. OUTCOME           │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ 5. PROGRESSION       │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ 6. WORLD FEEDBACK    │
└──────────┬───────────┘
           │
           └──────────────→ ngày tiếp theo
```

Không nhất thiết mọi interaction phải đi qua toàn bộ sáu bước.

Đây là **conceptual loop**, không phải một pipeline cứng.

---

# 4. World Observation

Mỗi ngày thế giới có thể thay đổi.

Ví dụ:

```text
Weather: Rain
World Event: Eclipse
Market: Crystal ↑
Server Progress: 73%
Active Anomaly: Forest
```

Nhưng không phải ngày nào cũng cần có event lớn.

World có thể:

- bình thường;
- hơi khác hôm qua;
- xuất hiện một cơ hội;
- xuất hiện một anomaly;
- mở một khu vực;
- thay đổi NPC;
- hoặc không có gì đặc biệt.

Điều này rất quan trọng.

Nếu ngày nào cũng có:

> "⚠️ EVENT!!!"

thì event mất giá trị.

---

# 5. Daily Opportunity

Thay vì bắt user nhận một "Daily Quest", hệ thống tạo ra một hoặc nhiều **Opportunity**.

Opportunity có thể là:

```text
Quest
Encounter
Discovery
Event
Challenge
Collection
NPC interaction
Resource opportunity
Social interaction
Mystery
```

Ví dụ:

> 🌧️ Hôm nay khu rừng phía Bắc đang có sương.

User có thể:

```text
[Explore]
[Ignore]
[Ask NPC]
[View Map]
```

Không phải mọi lựa chọn đều cần thưởng trực tiếp.

Một số lựa chọn chỉ thay đổi context.

---

# 6. Opportunity không được deterministic hoàn toàn

Không nên:

```text
Day 1 → Quest A
Day 2 → Quest B
Day 3 → Quest C
```

vì user sẽ nhanh chóng nhận ra pattern.

Thay vào đó sử dụng:

```text
World State
+
User State
+
Server State
+
Randomness
+
Content Rules
=
Opportunity
```

Randomness chỉ là một thành phần.

Không dùng random thuần túy để quyết định gameplay.

Ví dụ:

```text
User chưa từng gặp NPC
+
NPC đang active
+
World đang ở trạng thái phù hợp
+
Encounter probability
=
Có khả năng xuất hiện NPC
```

Điều này cho phép content designer mở rộng hệ thống mà không phải sửa Core Loop.

---

# 7. User Action

User có thể hành động bằng:

- Slash Command;
- Button;
- Select Menu;
- Modal;
- Context Menu;
- hoặc interaction khác trong tương lai.

Gameplay không nên phụ thuộc vào command cụ thể.

Ví dụ:

```text
/action explore
```

chỉ là một implementation.

Core system thực sự hiểu:

```text
Action {
    actor
    type
    target
    context
}
```

Sau này có thể thay đổi UI mà không phải thay đổi gameplay.

---

# 8. Action phải có Context

Một action không nên tồn tại độc lập.

Ví dụ:

```text
Explore Forest
```

kết quả phụ thuộc:

```text
User
+
Forest
+
Weather
+
Time
+
Inventory
+
Previous Actions
+
World State
```

Điều này tạo ra khả năng:

> Cùng một action nhưng hai user có thể nhận được hai trải nghiệm khác nhau.

---

# 9. Outcome

Outcome không chỉ là:

```text
+100 XP
+50 Gold
```

Outcome có thể là:

```text
Reward
Progress
Unlock
State Change
Discovery
Relationship Change
World Change
Information
Nothing
```

Ví dụ:

> Bạn tìm thấy một chiếc chìa khóa.

Nhưng reward thật sự có thể chỉ là:

```text
Item: Unknown Key
```

Không giải thích ngay nó dùng để làm gì.

---

# 10. Progression

Progression nên được chia thành nhiều lớp.

## Personal

```text
Level
Experience
Collection
Inventory
Titles
Achievements
Relationships
Knowledge
```

## Server

```text
World Level
Buildings
Shared Resources
Server Events
Global Achievements
```

## World

```text
Regions
Lore
Global Events
World State
Season
```

Không nên ép tất cả progression vào một Level duy nhất.

---

# 11. Reward Philosophy

Reward không nhất thiết phải là currency.

Có thể là:

### Immediate

```text
XP
Gold
Item
Resource
```

### Medium-term

```text
Unlock
Title
Ability
Region
NPC
Crafting Recipe
```

### Long-term

```text
Collection
Achievement
Lore
Secret
World Progress
Rare Identity
```

### Non-material

```text
Information
Story
Choice
Recognition
```

Đặc biệt:

> **Information cũng là một phần thưởng.**

Ví dụ:

> "Bạn phát hiện ra rằng NPC A đã nói dối."

Không có Gold.

Nhưng user vừa nhận được một mảnh puzzle.

---

# 12. The "Maybe Tomorrow" Principle

Không phải interaction nào cũng nên hoàn thành ngay.

Một hành động tốt có thể tạo ra một câu hỏi mới.

Ví dụ:

```text
Day 12
↓
Find Strange Key
↓
???
```

Ngày 13:

```text
NPC mentions an old tower
↓
Key fits tower
↓
New area unlocked
```

Core Loop vì vậy có thể tạo:

```text
Action
↓
Reward
↓
Question
↓
Curiosity
↓
Return
```

Đây là một trong những cơ chế retention quan trọng nhất của ECHO.

---

# 13. Streak

Streak tồn tại để khuyến khích thói quen, không phải để trừng phạt.

Không nên thiết kế:

```text
12 days
↓
miss 1 day
↓
0
```

Thay vào đó có thể sử dụng:

```text
Streak
Streak Protection
Grace Period
Recovery
Milestones
```

Streak chỉ là một layer trên Core Loop.

Nếu sau này bỏ Streak, Core Loop vẫn phải hoạt động.

---

# 14. Server World

Mỗi Discord server có thể trở thành một world riêng.

Ví dụ:

```text
SERVER
│
├── World State
├── Shared Progress
├── Events
├── Buildings
├── Economy
├── Leaderboards
└── Community History
```

User vừa có progression cá nhân:

```text
Player
```

vừa có progression cộng đồng:

```text
Server
```

Điều này tạo ra hai động lực:

> "Tôi muốn mạnh hơn."

và:

> "Tôi muốn server của mình tiến xa hơn."

---

# 15. Global Event

Global Event là optional layer.

Ví dụ:

```text
WORLD EVENT
"The Moon is Falling"

Progress:
████████████░░░░░░

2,731 / 4,000
```

Progress có thể đến từ nhiều user.

Khi đạt threshold:

```text
Event Complete
↓
World State Changed
↓
New Content Available
```

Không được giả định rằng mọi event đều phải có combat.

Event có thể chỉ là:

- khám phá;
- thu thập;
- giải puzzle;
- voting;
- social;
- storytelling;
- hoặc bất kỳ mechanic nào được plugin/module cung cấp.

---

# 16. Memory

Một trong những điểm khác biệt của ECHO:

> **Bot phải nhớ.**

Nhưng "memory" không đồng nghĩa với việc lưu mọi interaction.

Chỉ lưu những thứ có giá trị gameplay.

Ví dụ:

```text
User helped NPC Elias
User discovered Forest Ruins
User chose to keep the key
User participated in Eclipse Event
```

Không cần lưu:

```text
User clicked Button ID 4812
User opened menu
User viewed profile
```

Memory phải có phân tầng.

### Hot State

Dữ liệu cần truy cập thường xuyên.

Ví dụ:

```text
user_id
level
xp
currency
streak
current_state
```

### Persistent State

Dữ liệu cần giữ lâu dài.

Ví dụ:

```text
inventory
quests
achievements
relationships
discoveries
```

### Archive

Dữ liệu ít truy cập.

Ví dụ:

```text
old events
historical logs
analytics
expired content
```

---

# 17. RAM First

Thứ tự ưu tiên của hệ thống:

```text
RAM efficiency
      ↓
Response latency
      ↓
Storage efficiency
      ↓
Raw throughput
```

Không tối ưu database trước khi xác định bottleneck thực tế.

---

# 18. Language Choice

## Primary Language: TypeScript (Node.js)

TypeScript + Node.js được chọn cho Core Runtime vì:

- hệ sinh thái Discord (discord.js) rất mạnh và ổn định;
- tốc độ phát triển (development speed) nhanh, dễ iterate;
- typing system của TypeScript đủ mạnh để thiết kế các cấu trúc dữ liệu phức tạp của game engine;
- async I/O của Node.js xử lý event-driven rất tốt;
- dễ dàng mở rộng và kết nối với các công nghệ web khác;
- hệ sinh thái package khổng lồ (NPM) hỗ trợ nhanh các integration.

Mục tiêu là:

> **Một process bot có thể phát triển nhanh, linh hoạt trong việc thay đổi logic game, và đủ ổn định để xử lý I/O concurrency cao.**

---

# 19. Async Runtime

Core backend nên sử dụng async I/O.

Các tác vụ như:

```text
Discord Gateway
Database
HTTP API
Object Storage
External Services
```

không nên block thread xử lý event.

Worker/thread pool chỉ được sử dụng khi thực sự cần CPU-bound work.

Ví dụ:

```text
Discord Event
      ↓
Async Handler
      ↓
Game Logic
      ↓
Persistence
```

CPU-heavy task có thể được tách sang worker.

---

# 20. Storage Philosophy

Không coi local disk của bot là nơi lưu trữ duy nhất.

Architecture nên hỗ trợ:

```text
Bot
 │
 ├── Local Cache
 │
 ├── Primary Database
 │
 └── External Object Storage
```

Ví dụ:

### Database

Dùng cho:

```text
Player State
Server State
Inventory
Quest State
Progression
Indexes
Relationships
```

### Object Storage

Dùng cho:

```text
Images
Generated Assets
Large Logs
Backups
Archives
Static Content
```

Có thể sử dụng external storage để giảm áp lực lên server chính.

---

# 21. Database Abstraction

Core Loop không được phụ thuộc trực tiếp vào một database cụ thể.

Không viết gameplay kiểu:

```text
SQL query
→
game logic
```

nằm rải rác khắp project.

Thay vào đó:

```text
Game Logic
    ↓
Repository / Storage Interface
    ↓
Database
```

Ví dụ concept:

```text
PlayerRepository
QuestRepository
InventoryRepository
WorldRepository
EventRepository
```

Sau này có thể chuyển:

```text
SQLite
→ PostgreSQL
```

hoặc:

```text
local storage
→ external database
```

mà không phải viết lại gameplay.

---

# 22. SQLite cho giai đoạn đầu

MVP có thể bắt đầu bằng SQLite nếu deployment nhỏ.

Ưu điểm:

- không cần database server;
- memory footprint thấp;
- deployment đơn giản;
- backup dễ;
- phù hợp prototype/MVP;
- tốc độ tốt với workload vừa phải.

Nhưng architecture không được khóa vào SQLite.

Khi scale:

```text
SQLite
   ↓
PostgreSQL / distributed storage
```

có thể thay thế persistence layer.

---

# 23. Cache

Cache chỉ giữ dữ liệu cần thiết.

Không cache toàn bộ user.

Ví dụ:

```text
Hot Cache

user_id
→ compact player state
```

TTL hoặc LRU có thể được sử dụng.

Không được để:

```text
100,000 users
×
large profile
×
permanent RAM
```

Cache phải có giới hạn.

---

# 24. Stateless Where Possible

Bot process không nên giữ state quan trọng duy nhất trong RAM.

Không:

```text
RAM
└── Player Inventory
```

mà:

```text
RAM
└── Temporary Cache

Database
└── Source of Truth
```

Nếu bot crash:

```text
Restart
↓
Reconnect
↓
Load required state
↓
Continue
```

Không mất progression.

---

# 25. Event-driven Architecture

Core Loop nên phát triển quanh event.

Ví dụ:

```text
PlayerLoggedIn
PlayerActionPerformed
QuestCompleted
ItemDiscovered
AchievementUnlocked
WorldStateChanged
EventStarted
EventCompleted
```

Một event có thể có nhiều consumer.

Ví dụ:

```text
QuestCompleted
       │
       ├── Reward System
       ├── Achievement System
       ├── Statistics System
       ├── Story System
       └── Notification System
```

Điều này giúp thêm feature mà không sửa Core Loop.

---

# 26. Module Boundaries

Không xây toàn bộ bot thành một module khổng lồ.

Một hướng tổ chức:

```text
core/
    player
    world
    action
    progression
    reward
    event

features/
    quest
    exploration
    combat
    economy
    collection
    npc
    social

infrastructure/
    discord
    database
    cache
    storage
    logging
```

Các feature mới nên phụ thuộc vào Core, không ngược lại.

---

# 27. Content ≠ Engine

Đây là nguyên tắc rất quan trọng.

Không hard-code:

```text
Quest #17
Quest #18
NPC Elias
Forest
Dragon
```

vào engine.

Engine chỉ biết:

```text
Quest
NPC
Region
Event
Reward
Condition
Action
```

Content có thể được mô tả bằng data/config.

Ví dụ concept:

```text
Quest {
    id
    requirements
    actions
    outcomes
    rewards
}
```

Sau này có thể thêm content mà không cần sửa engine.

---

# 28. Flexible Conditions

Condition system nên được thiết kế mở.

Ví dụ:

```text
level >= 10
```

hoặc:

```text
has_item("strange_key")
```

hoặc:

```text
world_state == "eclipse"
```

hoặc:

```text
relationship("elias") >= 50
```

Không cần implement tất cả ngay.

Chỉ cần thiết kế sao cho condition engine có thể mở rộng.

---

# 29. Flexible Actions

Tương tự:

```text
Action
├── Explore
├── Talk
├── Fight
├── Trade
├── Discover
└── Unknown/Future
```

Core không nên giả định rằng đây là danh sách cuối cùng.

---

# 30. Failure Is Also An Outcome

Không phải action nào cũng phải thành công.

Nhưng failure không nên luôn đồng nghĩa với:

> "Bạn mất lượt."

Failure có thể tạo content.

Ví dụ:

```text
Explore
↓
Failed
↓
Found strange footprint
```

Hoặc:

```text
Attempted quest
↓
Failed
↓
NPC relationship changed
```

Failure có thể trở thành progression.

---

# 31. Anti-Grind

Core Loop không được yêu cầu user spam interaction.

Không:

```text
/collect × 500
```

để đạt mục tiêu.

Một action có ý nghĩa nên có giá trị tương đối cao.

Mục tiêu:

> **5 phút có ý nghĩa > 50 phút click vô nghĩa.**

---

# 32. Anti-Compulsion

Bot không nên liên tục ping user.

Notification chỉ dành cho:

- event quan trọng;
- reward;
- world change;
- user-requested reminder;
- hoặc nội dung thực sự có giá trị.

Không biến bot thành notification spam.

---

# 33. Daily Budget

Mỗi ngày nên có một lượng gameplay hợp lý.

Concept:

```text
Minimum:
1 meaningful interaction

Normal:
3–5 meaningful interactions

Extended:
optional exploration
```

User hoàn thành phần chính rất nhanh vẫn có thể rời đi mà không cảm thấy bị phạt.

Người muốn chơi tiếp luôn có content mở rộng.

---

# 34. Core Loop không phải Daily Loop

Đây là distinction quan trọng.

### Core Loop

```text
Observe
→ Act
→ Outcome
→ Progress
→ World Change
```

### Daily Loop

```text
Today's World
→ Opportunity
→ Action
→ Reward
→ Tomorrow's Context
```

### Long-term Loop

```text
Days
→ Collection
→ Unlocks
→ World Progress
→ Story
→ New Systems
```

Ba tầng này phải độc lập tương đối.

---

# 35. Long-Term Retention

ECHO nên có nhiều lý do quay lại:

```text
Tomorrow:
"Điều gì xảy ra?"

Next Week:
"Mình mở khóa được gì?"

Next Month:
"Season này mình đạt rank nào?"

Long Term:
"Mình đã khám phá được bao nhiêu?"

Community:
"Server của mình đang tiến tới đâu?"
```

Không một mechanic duy nhất nào chịu trách nhiệm retention.

---

# 36. Expansion Points

Core Loop phải để trống các extension point:

```text
[QUEST SYSTEM]
[COMBAT SYSTEM]
[EXPLORATION SYSTEM]
[ECONOMY SYSTEM]
[NPC SYSTEM]
[GUILD SYSTEM]
[PVP SYSTEM]
[CRAFTING SYSTEM]
[SEASON SYSTEM]
[LORE SYSTEM]
[ACHIEVEMENT SYSTEM]
[EVENT SYSTEM]
[PLUGIN SYSTEM]
```

Không cần triển khai toàn bộ trong MVP.

Core chỉ cần đảm bảo chúng có thể tham gia vào:

```text
Action
Outcome
Progression
Event
World State
```

---

# 37. MVP Boundary

MVP chỉ cần:

```text
Player
│
├── Profile
├── Daily Opportunity
├── Action
├── Reward
├── XP
├── Streak
└── Basic World State
```

Thêm:

```text
Server World
```

nếu cần social loop.

Chưa cần:

```text
Complex combat
Marketplace
Guild
Huge lore system
Large crafting tree
Season Pass
```

---

# 38. MVP Success Criteria

MVP không được đánh giá bằng:

```text
Number of commands
Number of features
Lines of code
```

Mà bằng:

### Question 1

User có quay lại ngày hôm sau không?

### Question 2

User có cảm thấy hôm nay khác hôm qua không?

### Question 3

User có lý do để tiếp tục sau khi nhận reward không?

### Question 4

Feature mới có thể được thêm mà không phá Core Loop không?

### Question 5

Bot có thể chạy lâu mà memory usage vẫn predictable không?

---

# 39. Technical Priority

Mọi quyết định kỹ thuật nên ưu tiên:

```text
                    ┌─────────────┐
                    │    RAM      │
                    │   FIRST     │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │  LATENCY    │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │  STORAGE    │
                    └─────────────┘
```

Không tối ưu premature.

Đo trước:

```text
RSS
Heap allocation
Cache size
Event latency
Database latency
Discord API latency
```

Sau đó mới tối ưu bottleneck thực tế.

---

# 40. Final Core Loop

Phiên bản cô đọng nhất:

```text
WORLD
  ↓
Something changed
  ↓
USER SEES AN OPPORTUNITY
  ↓
USER MAKES A CHOICE
  ↓
SYSTEM PRODUCES AN OUTCOME
  ↓
USER GAINS PROGRESS / KNOWLEDGE / REWARD
  ↓
WORLD REMEMBERS
  ↓
NEW POSSIBILITIES EMERGE
  ↓
USER HAS A REASON TO RETURN
```

Hoặc:

> **See → Choose → Act → Discover → Progress → Remember → Return**

Đây là Core Loop.

Mọi hệ thống trong tương lai nên trả lời được câu hỏi:

> **"Feature này đóng góp gì vào vòng lặp trên?"**

Nếu không đóng góp gì, feature đó cần được xem xét lại.

---

# 41. Architectural Principle

ECHO không nên được xây dựng như:

```text
Discord Bot
    +
100 commands
```

Mà như:

```text
Game Engine
     +
Discord Interface
     +
Persistent World
```

Discord chỉ là **cánh cửa bước vào thế giới**.

Nếu một ngày ECHO cần thêm:

```text
Web Dashboard
Mobile App
API
Web Game
```

thì Core Gameplay vẫn có thể tồn tại độc lập với Discord.

Đó là lý do Core Loop phải được thiết kế trước UI và command.

---

# 42. One-Sentence Definition

> **ECHO là một persistent world engine nơi mỗi ngày tạo ra những cơ hội mới cho người chơi lựa chọn, và mỗi lựa chọn để lại một dấu vết đủ nhỏ để không làm hệ thống nặng nề nhưng đủ lớn để thế giới dần trở thành "thế giới của riêng họ".**