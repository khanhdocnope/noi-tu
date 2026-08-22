# Storage Integration

## Tổng quan

Bot sử dụng 2 dịch vụ cloud:

| Dịch vụ | Vai trò |
|---------|---------|
| **Supabase** | Database (PostgreSQL), API layer |
| **Hugging Face Datasets** | Lưu trữ ảnh artwork |

## Supabase

### Cấu hình

```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Supabase Client

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

### Database Tables

Xem chi tiết tại [DATABASE.md](./DATABASE.md)

### Query Examples

```ts
// Lấy pet
const { data, error } = await supabase
  .from('pets')
  .select('*')
  .eq('user_id', userId)
  .single();

// Update pet
const { error } = await supabase
  .from('pets')
  .update({ level: 10, xp: 820 })
  .eq('user_id', userId);

// Insert transaction
const { error } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    type: 'daily_reward',
    amount: 100,
    reason: 'daily_claim'
  });
```

### Row Level Security (RLS)

Supabase hỗ trợ RLS policy. Trong MVP bot dùng service role key (server-side only).

Phase 2 có thể thêm RLS nếu cần user-facing API.

---

## Hugging Face Datasets

### Repo

```
https://huggingface.co/datasets/dobietdc/bot-artwork
```

### URL Pattern

```
https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main/{species}/{filename}
```

### Ví dụ

```ts
const ARTWORK_BASE = 'https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main';

function getArtworkUrl(species: string, level: number): string {
  const checkpoint = getCheckpoint(level);
  return `${ARTWORK_BASE}/${species}/lv${String(checkpoint).padStart(2, '0')}.png`;
}

// getArtworkUrl('fox', 10) → ".../fox/lv10.png"
// getArtworkUrl('fox', 13) → ".../fox/lv10.png" (nearest checkpoint)
```

### Checkpoints

| Level | Checkpoint |
|-------|------------|
| 1-4 | lv01 |
| 5-9 | lv05 |
| 10-14 | lv10 |
| 15-19 | lv15 |
| 20+ | lv20 |

### Artwork Service

```ts
// src/storage/artwork.service.ts

const ARTWORK_BASE = process.env.HF_ARTWORK_URL ||
  'https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main';

const CHECKPOINTS = [1, 5, 10, 15, 20];

function getCheckpoint(level: number): number {
  let last = 1;
  for (const cp of CHECKPOINTS) {
    if (level >= cp) last = cp;
    else break;
  }
  return last;
}

export function getArtworkUrl(species: string, level: number): string {
  const cp = getCheckpoint(level);
  return `${ARTWORK_BASE}/${species}/lv${String(cp).padStart(2, '0')}.png`;
}
```

### Embed trong Discord

```ts
const embed = new EmbedBuilder()
  .setTitle(`${pet.name} - Level ${pet.level}`)
  .setImage(getArtworkUrl(pet.species, pet.level))
  .setColor('#FFD700');
```

---

## Env Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Hugging Face (optional, có default)
HF_ARTWORK_URL=https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main
```

## Flipper

| Biến | Bắt buộc | Default |
|------|----------|---------|
| `SUPABASE_URL` | ✅ | - |
| `SUPABASE_ANON_KEY` | ✅ | - |
| `HF_ARTWORK_URL` | ❌ | `https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main` |
