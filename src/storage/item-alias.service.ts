import { getSupabase } from '../database/supabase/client.js';

interface ItemAlias {
  alias: string;
  item_id: string;
  type: 'food' | 'creature' | 'item';
}

let aliasCache: Map<string, ItemAlias> | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function loadAliases(): Promise<Map<string, ItemAlias>> {
  const now = Date.now();
  if (aliasCache && now - lastFetch < CACHE_TTL) {
    return aliasCache;
  }

  const supabase = getSupabase();
  const { data } = await supabase.from('item_aliases').select('*');
  aliasCache = new Map();
  for (const row of (data ?? []) as ItemAlias[]) {
    aliasCache.set(row.alias, row);
  }
  lastFetch = now;
  return aliasCache;
}

export async function getItemByAlias(alias: string): Promise<ItemAlias | null> {
  const aliases = await loadAliases();
  return aliases.get(alias) ?? null;
}

export async function getItemsByType(type: 'food' | 'creature'): Promise<ItemAlias[]> {
  const aliases = await loadAliases();
  const result: ItemAlias[] = [];
  for (const item of aliases.values()) {
    if (item.type === type) result.push(item);
  }
  return result;
}

export async function getAllAliases(): Promise<string[]> {
  const aliases = await loadAliases();
  return Array.from(aliases.keys());
}

export function clearCache(): void {
  aliasCache = null;
  lastFetch = 0;
}
