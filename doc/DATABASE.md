# Database Schema (Supabase)

## Database

**Supabase** - PostgreSQL managed hosting + API auto-generated.

URL format: `https://<project-id>.supabase.co`

Cấu hình qua environment variables:

```env
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Bảng chính

### users

```sql
user_id       BIGINT PRIMARY KEY
coin          INTEGER DEFAULT 0
created_at    TIMESTAMP DEFAULT NOW()
```

### pets

```sql
user_id       BIGINT PRIMARY KEY
species       VARCHAR(50)
name          VARCHAR(100)
level         INTEGER DEFAULT 1
xp            INTEGER DEFAULT 0
health        INTEGER DEFAULT 100
hunger        INTEGER DEFAULT 100
energy        INTEGER DEFAULT 100
mood          INTEGER DEFAULT 50
bond          INTEGER DEFAULT 0
created_at    TIMESTAMP DEFAULT NOW()
updated_at    TIMESTAMP DEFAULT NOW()
```

### inventory

```sql
user_id       BIGINT
item_id       VARCHAR(100)
quantity      INTEGER DEFAULT 0
PRIMARY KEY (user_id, item_id)
```

### transactions

```sql
id            SERIAL PRIMARY KEY
user_id       BIGINT
type          VARCHAR(50)
amount        INTEGER
reason        VARCHAR(200)
created_at    TIMESTAMP DEFAULT NOW()
```

### quests

```sql
quest_id      VARCHAR(100) PRIMARY KEY
name          VARCHAR(200)
description   TEXT
type          VARCHAR(20) -- daily, weekly, event
requirements  JSONB
rewards       JSONB
```

### user_quests

```sql
user_id       BIGINT
quest_id      VARCHAR(100)
progress      JSONB
claimed       BOOLEAN DEFAULT false
expires_at    TIMESTAMP
PRIMARY KEY (user_id, quest_id)
```

### memories

```sql
id            SERIAL PRIMARY KEY
user_id       BIGINT
title         VARCHAR(200)
content       TEXT
type          VARCHAR(50) -- milestone, event, evolution
created_at    TIMESTAMP DEFAULT NOW()
```

### cooldowns

```sql
user_id       BIGINT
action        VARCHAR(50)
expires_at    TIMESTAMP
PRIMARY KEY (user_id, action)
```

## Repository Pattern

```ts
// repository chỉ CRUD
petRepository.findById(userId);
petRepository.create(data);
petRepository.update(userId, data);

// service chịu transaction và game logic
petService.feed(userId, itemId); // check cooldown, update stats, log transaction
```
