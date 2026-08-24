-- Update hunt_encounters drops to return creatures
DELETE FROM hunt_encounters;

INSERT INTO hunt_encounters (encounter_id, name, area_id, min_level, weight, coin_min, coin_max, xp_min, xp_max, drops, text) VALUES
('rabbit', '🐰 Thỏ rừng', 'misty_forest', 1, 50, 10, 30, 5, 15, '{"rabbit": 1}', 'Bạn bắt được một con thỏ!'),
('squirrel', '🐿️ Sóc nhỏ', 'misty_forest', 1, 40, 5, 20, 3, 10, '{"squirrel": 1}', 'Bạn bắt được một con sóc!'),
('deer', '🦌 Hươu con', 'misty_forest', 2, 30, 20, 50, 10, 25, '{"deer": 1}', 'Bạn bắt được một con hươu con!'),
('boar', '🐗 Lợn lòi', 'misty_forest', 3, 20, 30, 80, 15, 40, '{"boar": 1}', 'Bạn bắt được một con lợn lòi!'),
('wolf', '🐺 Sói xám', 'misty_forest', 5, 10, 50, 120, 25, 60, '{"wolf": 1}', 'Bạn bắt được một con sói!'),
('treasure', '💰 Kho báu', 'misty_forest', 1, 5, 100, 200, 50, 100, '{"gold_ring": 1}', 'Bạn tìm thấy một chiếc hộp gỗ!');
