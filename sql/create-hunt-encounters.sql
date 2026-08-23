-- Create hunt_encounters table
CREATE TABLE hunt_encounters (
  encounter_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area_id TEXT NOT NULL,
  min_level INTEGER DEFAULT 1,
  weight INTEGER DEFAULT 50,
  coin_min INTEGER DEFAULT 10,
  coin_max INTEGER DEFAULT 30,
  xp_min INTEGER DEFAULT 5,
  xp_max INTEGER DEFAULT 15,
  drops JSONB DEFAULT '{}',
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hunt_encounters DISABLE ROW LEVEL SECURITY;

-- Seed data for Misty Forest
INSERT INTO hunt_encounters (encounter_id, name, area_id, min_level, weight, coin_min, coin_max, xp_min, xp_max, drops, text) VALUES
('rabbit', '🐰 Thỏ rừng', 'misty_forest', 1, 50, 10, 30, 5, 15, '{"apple": 1}', 'Bạn tìm thấy một con thỏ nhỏ đang ăn cỏ!'),
('squirrel', '🐿️ Sóc nhỏ', 'misty_forest', 1, 40, 5, 20, 3, 10, '{"berry": 1}', 'Một con sóc nhảy từ cành này sang cành khác!'),
('deer', '🦌 Hươu con', 'misty_forest', 2, 30, 20, 50, 10, 25, '{"meat": 1}', 'Bạn phát hiện một con hươu con bên bờ suối!'),
('boar', '🐗 Lợn lòi', 'misty_forest', 3, 20, 30, 80, 15, 40, '{"meat": 2}', 'Một con lợn lòi hung dữ đang tìm thức ăn!'),
('wolf', '🐺 Sói xám', 'misty_forest', 5, 10, 50, 120, 25, 60, '{"meat": 3}', 'Bạn nghe thấy tiếng hú của đàn sói...'),
('treasure', '💰 Kho báu', 'misty_forest', 1, 5, 100, 200, 50, 100, '{}', 'Bạn tìm thấy một chiếc hộp gỗ cũ kỹ!');
