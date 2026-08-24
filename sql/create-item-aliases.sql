-- Item aliases for prefix commands
CREATE TABLE item_aliases (
  alias TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'item',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_aliases DISABLE ROW LEVEL SECURITY;

-- Food aliases
INSERT INTO item_aliases (alias, item_id, type) VALUES
('tao', 'apple', 'food'),
('thit', 'meat', 'food'),
('qua-mong', 'berry', 'food'),
('ca', 'fish', 'food'),
('xuong', 'bone', 'food');

-- Creature aliases
INSERT INTO item_aliases (alias, item_id, type) VALUES
('soc', 'squirrel', 'creature'),
('tho', 'rabbit', 'creature'),
('huou', 'deer', 'creature'),
('lon', 'boar', 'creature'),
('soi', 'wolf', 'creature'),
('nhan-vang', 'gold_ring', 'creature');
