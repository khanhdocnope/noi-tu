# ECHO — Curiosity Hooks

Curiosity Hooks là hệ thống tạo ra **câu hỏi chưa được trả lời**, **thứ chưa thể tiếp cận** hoặc **khả năng chưa được khám phá**, khiến user muốn tiếp tục tương tác mà không cần bị ép bởi daily, streak hay reward.

## 1. Mysteries

Luôn có một số thứ trong world mà user **chưa hiểu hoàn toàn**:

* một NPC có hành vi bất thường;
* một địa điểm không xuất hiện trên bản đồ;
* một item không rõ công dụng;
* một sự kiện không có lời giải thích;
* một symbol xuất hiện ở nhiều nơi;
* một đoạn hội thoại bị bỏ dở.

Mystery không cần được giải thích ngay.

> **Cho user biết có một câu hỏi, nhưng chưa cho họ biết câu trả lời.**

---

## 2. Secrets

Secret là content không được hiển thị trực tiếp trong UI thông thường.

Có thể là:

```text
Secret NPC
Secret Location
Secret Quest
Secret Dialogue
Secret Achievement
Secret Item
Secret Event
Secret Outcome
```

Secret nên được phát hiện thông qua:

```text
Clue
Exploration
NPC
Previous Choice
Rare Encounter
Community Discovery
```

Không nên phụ thuộc hoàn toàn vào random.

---

## 3. Locked Content

Locked content phải khiến user nghĩ:

> "Mình muốn biết phía sau đó có gì."

Ví dụ:

```text
UNKNOWN REGION
Status: LOCKED
Requirement: ???

████████████████
```

Hoặc:

```text
UNKNOWN ITEM
Usage: ???

Một ký hiệu kỳ lạ được khắc trên vật thể.
```

Không nhất thiết phải công khai điều kiện unlock.

Nhưng phải có **manh mối hoặc logic đủ để user có thể suy luận**.

---

## 4. Clue Chain

Mystery tốt thường không đứng một mình.

```text
Clue
 ↓
Discovery
 ↓
New Question
 ↓
Another Clue
 ↓
Unlock
 ↓
New Mystery
```

Ví dụ:

```text
Nghe NPC nhắc tới Old Tower
↓
Tìm thấy bản đồ rách
↓
Phát hiện vị trí Tower
↓
Tìm thấy chiếc chìa khóa
↓
Mở Tower
↓
Phát hiện một căn phòng bí mật
```

Một discovery nên có khả năng **dẫn sang discovery tiếp theo**.

---

## 5. Delayed Payoff

Không phải mystery nào cũng phải giải trong cùng một session.

Một hook có thể kéo dài:

```text
Day 1  → Strange Key
Day 3  → Old Tower
Day 6  → Mysterious Symbol
Day 9  → Key becomes relevant
Day 10 → Tower unlocked
```

Mục tiêu là khiến những interaction cũ vẫn có ý nghĩa về sau.

---

## 6. Persistent Curiosity

Một câu hỏi user từng gặp nên có thể quay trở lại trong tương lai.

Ví dụ:

```text
User discovered strange symbol
↓
World remembers it
↓
Several days later
↓
NPC recognizes the symbol
↓
New dialogue branch
```

World phải tạo cảm giác:

> **"Những gì mình đã làm trước đây vẫn còn đó."**

---

## 7. Curiosity Through Choice

Choice có thể mở những mystery khác nhau.

Ví dụ:

```text
[Giúp NPC]
→ NPC tin tưởng user

[Từ chối]
→ NPC biến mất

[Đi theo NPC]
→ Hidden Location

[Hỏi thêm]
→ Important Clue
```

Không nhất thiết phải có một lựa chọn "đúng".

Mỗi lựa chọn có thể dẫn đến một phần khác của world.

---

## 8. Curiosity Through Failure

Failure không nên chỉ là:

```text
Failed
→ End
```

Nó có thể trở thành hook:

```text
Failed
↓
Unexpected Result
↓
New Clue
↓
New Opportunity
```

Ví dụ user không mở được một cánh cửa, nhưng phát hiện trên tay mình xuất hiện một dấu ấn kỳ lạ.

---

## 9. Rare Curiosity

Một số discovery có rarity thấp:

```text
Rare NPC
Rare Event
Hidden Encounter
Unknown Creature
Secret Location
Unique Dialogue
```

Rarity phải được kiểm soát bằng:

```text
Probability
+
Context
+
History
+
Pity / Protection
```

Không để user phải spam action chỉ để "roll" một bí mật.

---

## 10. Community Curiosity

Không phải mọi mystery đều dành cho một user.

Có thể tồn tại:

```text
Server Mystery
Community Puzzle
Global Secret
Collective Discovery
Hidden World Event
```

Ví dụ:

```text
Một symbol xuất hiện trong nhiều channel.
Không ai biết nó có nghĩa gì.

Một user tìm thấy clue đầu tiên.
User khác tìm thấy clue thứ hai.

Khi ghép chúng lại:
→ Secret Location unlocked.
```

Điều này biến curiosity thành **social gameplay**.

---

## 11. Curiosity Layers

Curiosity nên tồn tại ở nhiều quy mô:

```text
Micro
"Cái item này là gì?"

Short-term
"NPC này đang giấu điều gì?"

Medium-term
"Làm sao mở khu vực này?"

Long-term
"Chuyện gì thực sự xảy ra với thế giới?"

Community
"Server sẽ thay đổi thế nào nếu mystery được giải?"
```

Không phải mọi user đều cần theo đuổi mystery dài hạn.

---

## 12. Signal, Don't Explain

Không nên đơn giản che content bằng `???`.

Hãy để lại tín hiệu:

* description bất thường;
* NPC phản ứng khác;
* symbol lặp lại;
* item có thuộc tính kỳ lạ;
* địa điểm xuất hiện trong lore;
* world state bất thường;
* dialogue không hoàn chỉnh.

Nguyên tắc:

> **Enough information to become curious, not enough information to become certain.**

---

## 13. Mystery Must Lead Somewhere

Mystery không nên chỉ tồn tại để tạo cảm giác bí ẩn.

Một hook tốt có thể dẫn đến:

```text
Investigation
Exploration
Quest
Puzzle
NPC
Collection
Social Interaction
World Event
Unlock
Lore
```

Nếu mystery không thể tạo ra gameplay hoặc discovery mới, nó chỉ là decoration.

---

## 14. No Fake Curiosity

Không sử dụng clickbait kiểu:

```text
SECRET!!!
CLICK NOW!!!
```

nhưng nội dung phía sau không có giá trị.

Không tạo hàng trăm mystery giả chỉ để kéo retention.

Một câu hỏi được đặt ra phải có khả năng:

```text
answered
resolved
expanded
or intentionally remain mysterious
```

và tất cả đều phải có chủ đích.

---

## 15. The Curiosity Chain

Công thức cốt lõi:

```text
Hint
 ↓
Question
 ↓
Investigation
 ↓
Discovery
 ↓
Reward / Knowledge
 ↓
New Question
 ↓
New Possibility
```

Không phải:

```text
Quest
 ↓
Reward
 ↓
End
```

---

## 16. Design Rule

Mỗi content quan trọng nên tự trả lời câu hỏi:

> **"Sau khi user nhìn thấy thứ này, họ còn điều gì muốn biết không?"**

Nếu có:

**Curiosity Hook thành công.**

Nếu không:

Nội dung vẫn có thể hữu ích, nhưng không đóng vai trò giữ chân bằng curiosity.

---

## 17. Golden Principle

> **Don't tell the user everything. Give them enough to want to find out.**

ECHO không cần liên tục nói:

> "Hãy quay lại ngày mai."

Hãy khiến user tự nghĩ:

> **"Khoan... cái này có liên quan đến thứ mình tìm thấy hôm trước không?"**
