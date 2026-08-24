export const ITEM_IDS: Record<string, { name: string; type: 'food' | 'creature' }> = {
  'tao': { name: '🍎 Táo', type: 'food' },
  'thit': { name: '🥩 Thịt', type: 'food' },
  'qua-mong': { name: '🫐 Quả mọng', type: 'food' },
  'ca': { name: '🐟 Cá', type: 'food' },
  'xuong': { name: '🦴 Xương', type: 'food' },
  'soc': { name: '🐿️ Sóc nhỏ', type: 'creature' },
  'tho': { name: '🐰 Thỏ rừng', type: 'creature' },
  'huou': { name: '🦌 Hươu con', type: 'creature' },
  'lon': { name: '🐗 Lợn lòi', type: 'creature' },
  'soi': { name: '🐺 Sói xám', type: 'creature' },
  'nhan-vang': { name: '💍 Nhẫn vàng', type: 'creature' },
};

export const SELLABLE_IDS = ['soc', 'tho', 'huou', 'lon', 'soi', 'nhan-vang'];
export const FOOD_IDS = ['tao', 'thit', 'qua-mong', 'ca', 'xuong'];

export const ITEM_TO_DB: Record<string, string> = {
  'tao': 'apple',
  'thit': 'meat',
  'qua-mong': 'berry',
  'ca': 'fish',
  'xuong': 'bone',
  'soc': 'squirrel',
  'tho': 'rabbit',
  'huou': 'deer',
  'lon': 'boar',
  'soi': 'wolf',
  'nhan-vang': 'gold_ring',
};

export const DB_TO_ITEM: Record<string, string> = Object.fromEntries(
  Object.entries(ITEM_TO_DB).map(([k, v]) => [v, k])
);
