# Artwork System

## Artwork Storage: Hugging Face Datasets

Artwork được lưu trữ trên **Hugging Face Datasets** thay vì local filesystem.

Repo: `https://huggingface.co/datasets/dobietdc/bot-artwork`

### URL Pattern

```
https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main/{species}/{filename}
```

Ví dụ:
```
https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main/fox/lv10.png
```

## Cấu trúc artwork trên HF

```
bot-artwork/
├── cat/
│   ├── lv01.png
│   ├── lv05.png
│   ├── lv10.png
│   ├── lv15.png
│   └── lv20.png
├── fox/
│   ├── lv01.png
│   ├── lv05.png
│   ├── lv10.png
│   ├── lv15.png
│   └── lv20.png
├── rabbit/
│   ├── lv01.png
│   ├── lv05.png
│   ├── lv10.png
│   ├── lv15.png
│   └── lv20.png
└── wolf/
    └── ...
```

## Artwork Checkpoints

Không bắt buộc mỗi level phải có ảnh mới. Đặt checkpoint:

- Lv.1
- Lv.5
- Lv.10
- Lv.15
- Lv.20

## Artwork Resolver

Bot không lưu ảnh vào database. Database chỉ lưu:

```ts
species = "fox"
level = 10
```

Artwork service tự build URL từ HF:

```ts
function getArtworkUrl(species: string, level: number): string {
  const checkpoint = getCheckpoint(level); // 1, 5, 10, 15, 20
  return `https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main/${species}/lv${checkpoint}.png`;
}
```

Nếu level 13 mà chưa có ảnh checkpoint, dùng checkpoint gần nhất (lv10).

## Level Up Notification

```
✨ LEVEL UP!

Miu đã đạt Level 10!

Artwork mới đã được mở khóa.
```

## Profile Display

Profile render ảnh tương ứng với level cao nhất đã đạt.

```
╭─────────────────────────────╮
│          🦊 MIU             │
│                             │
│        [PET ARTWORK]        │
│                             │
│          Level 10           │
│      ████████░░ 820/1000    │
│                             │
│ ❤️ 94     🍖 76             │
│ ⚡ 63     😊 82              │
│                             │
│ 🪙 1,240                    │
│ ❤️ Bond Lv.7                │
╰─────────────────────────────╯
```
