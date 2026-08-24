-- Market listings table
CREATE TABLE market_listings (
  id SERIAL PRIMARY KEY,
  seller_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Server config for market channel
CREATE TABLE server_config (
  guild_id TEXT PRIMARY KEY,
  market_channel_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_config DISABLE ROW LEVEL SECURITY;
