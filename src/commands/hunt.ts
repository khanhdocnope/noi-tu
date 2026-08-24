import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';

const ENERGY_COST = 20;
const DEFAULT_AREA = 'misty_forest';

interface HuntEncounter {
  encounter_id: string;
  name: string;
  area_id: string;
  min_level: number;
  weight: number;
  xp_min: number;
  xp_max: number;
  drops: Record<string, number>;
  text: string;
}

function rollEncounter(pool: HuntEncounter[]): HuntEncounter {
  const total = pool.reduce((s, o) => s + o.weight, 0);
  let roll = Math.random() * total;
  for (const o of pool) {
    roll -= o.weight;
    if (roll <= 0) return o;
  }
  return pool[0]!;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CREATURE_NAMES: Record<string, string> = {
  rabbit: '🐰 Thỏ rừng',
  squirrel: '🐿️ Sóc nhỏ',
  deer: '🦌 Hươu con',
  boar: '🐗 Lợn lòi',
  wolf: '🐺 Sói xám',
  gold_ring: '💍 Nhẫn vàng',
};

const CREATURE_SELL_PRICES: Record<string, number> = {
  rabbit: 15,
  squirrel: 10,
  deer: 40,
  boar: 60,
  wolf: 100,
  gold_ring: 150,
};

export function getSellPrice(itemId: string): number {
  return CREATURE_SELL_PRICES[itemId] ?? 5;
}

export function getCreatureName(itemId: string): string {
  return CREATURE_NAMES[itemId] ?? `❓ ${itemId}`;
}

export const data = new SlashCommandBuilder()
  .setName('hunt')
  .setDescription('Pet đi săn');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  await interaction.deferReply();

  const { data: pet } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!pet) {
    await interaction.editReply({ content: '❌ Bạn chưa có pet! Dùng `/start`.' });
    return;
  }

  if ((pet.energy ?? 0) < 20) {
    await interaction.editReply({ content: '❌ Pet quá mệt! Dùng `/rest`.' });
    return;
  }

  const { data: encounters } = await supabase
    .from('hunt_encounters')
    .select('*')
    .eq('area_id', DEFAULT_AREA)
    .lte('min_level', pet.level);

  const available = (encounters ?? []) as HuntEncounter[];
  if (available.length === 0) {
    await interaction.editReply({ content: '❌ Khu vực này chưa có con mồi nào cho level của bạn.' });
    return;
  }

  const encounter = rollEncounter(available);
  const xpGain = rand(encounter.xp_min, encounter.xp_max);

  await supabase.from('pets').update({
    energy: Math.max(0, (pet.energy ?? 0) - 20),
    xp: (pet.xp ?? 0) + xpGain,
  }).eq('user_id', userId);

  const upsertItem = async (itemId: string, amount: number) => {
    const { data: existing } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    const newQty = (existing?.quantity ?? 0) + amount;
    await supabase.from('inventory').upsert({
      user_id: userId,
      item_id: itemId,
      quantity: newQty,
    });
  };

  const dropsText: string[] = [];
  for (const [itemId, amount] of Object.entries(encounter.drops ?? {})) {
    if (amount > 0) {
      await upsertItem(itemId, amount);
      const name = getCreatureName(itemId);
      dropsText.push(`${name} x${amount}`);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('🌲 Hunt Result')
    .setDescription(`${encounter.name}: ${encounter.text ?? 'Kết quả săn bắn!'}`)
    .addFields(
      { name: '🎒 Nhận được', value: dropsText.join('\n') || 'Không có gì', inline: false },
      { name: '✨ XP', value: `+${xpGain}`, inline: true },
      { name: '⚡ Energy', value: `-20`, inline: true },
    )
    .setFooter({ text: 'Dùng /sell để bán lấy coin' })
    .setImage(getArtworkUrl(pet.species, pet.level))
    .setColor('#228B22');

  await interaction.editReply({ embeds: [embed] });
}
