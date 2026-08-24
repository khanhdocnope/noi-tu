import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import type { ChatInputCommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';
import type { Pet } from '../modules/pet/pet.types.js';

const FOOD_ITEMS: Record<string, { name: string; emoji: string; hunger: number }> = {
  apple: { name: 'Táo', emoji: '🍎', hunger: 10 },
  meat: { name: 'Thịt', emoji: '🥩', hunger: 25 },
  berry: { name: 'Quả mọng', emoji: '🫐', hunger: 5 },
  fish: { name: 'Cá', emoji: '🐟', hunger: 15 },
};

function getProgressBar(current: number, max: number, length: number = 10): string {
  const filled = Math.min(length, Math.max(0, Math.round((current / Math.max(1, max)) * length)));
  return '🟩'.repeat(filled) + '⬜'.repeat(length - filled);
}

function getStatusIcon(value: number, thresholds: [number, number] = [30, 70]): string {
  if (value <= thresholds[0]) return '⚠️';
  if (value >= thresholds[1]) return '✅';
  return '🔸';
}

function getMoodLabel(mood: number): string {
  if (mood >= 80) return 'Vui vẻ';
  if (mood >= 50) return 'Bình thường';
  if (mood >= 30) return 'Buồn';
  return '⚠️ Đang buồn';
}

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', fox: '🦊', rabbit: '🐰', wolf: '🐺', dragon: '🐉', phoenix: '🔥', unicorn: '🦄',
};

const RARITY_COLORS: Record<string, string> = {
  common: '#99AAB5',
  uncommon: '#2ECC71',
  rare: '#3498DB',
  epic: '#9B59B6',
  legendary: '#F1C40F',
};

const RARITY_LABELS: Record<string, string> = {
  common: '⚪ Common',
  uncommon: '🟢 Uncommon',
  rare: '🔵 Rare',
  epic: '🟣 Epic',
  legendary: '🟡 Legendary',
};

export const data = new SlashCommandBuilder()
  .setName('feed')
  .setDescription('Cho pet ăn từ túi đồ');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
  if (!pet) {
    await interaction.reply({ content: '❌ Bạn chưa có pet! Dùng `/start`.', ephemeral: true });
    return;
  }

  if (pet.rest_start) {
    await interaction.reply({ content: '❌ Pet đang nghỉ ngơi!', ephemeral: true });
    return;
  }

  if ((pet.hunger ?? 0) >= 95) {
    await interaction.reply({ content: '❌ Pet đã no rồi!', ephemeral: true });
    return;
  }

  const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', userId);
  const foods = (inv ?? []).filter((i: any) => FOOD_ITEMS[i.item_id] && i.quantity > 0);

  if (foods.length === 0) {
    await interaction.reply({
      content: '❌ Không có thức ăn! Mua tại `/shop`.',
      ephemeral: true,
    });
    return;
  }

  const options = foods.map((f: any) => {
    const food = FOOD_ITEMS[f.item_id]!;
    return {
      label: `${food.emoji} ${food.name} x${f.quantity}`,
      value: f.item_id,
      description: `+${food.hunger} Hunger`,
    };
  });

  const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('feed_select')
      .setPlaceholder('🍖 Chọn thức ăn...')
      .addOptions(options)
  );

  await interaction.reply({ components: [select], ephemeral: true });
}

export async function handleFeedSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const userId = interaction.user.id;
  const supabase = getSupabase();
  const itemId = interaction.values[0];

  const food = FOOD_ITEMS[itemId];
  if (!food) {
    await interaction.update({ content: '❌ Thức ăn không hợp lệ!', components: [] });
    return;
  }

  const [{ data: pet }, { data: inv }] = await Promise.all([
    supabase.from('pets').select('*').eq('user_id', userId).single(),
    supabase.from('inventory').select('quantity').eq('user_id', userId).eq('item_id', itemId).single(),
  ]);

  if (!pet) {
    await interaction.update({ content: '❌ Lỗi!', components: [] });
    return;
  }

  if (!inv || inv.quantity <= 0) {
    await interaction.update({ content: `❌ Hết ${food.name}!`, components: [] });
    return;
  }

  const xpForNext = Math.floor(100 * Math.pow(pet.level, 1.35));

  await Promise.all([
    supabase.from('pets').update({
      hunger: Math.min(100, (pet.hunger ?? 0) + food.hunger),
      xp: (pet.xp ?? 0) + 5,
      bond: (pet.bond ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId),
    supabase.from('inventory').update({ quantity: inv.quantity - 1 }).eq('user_id', userId).eq('item_id', itemId),
  ]);

  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾';
  const rarity = pet.species?.rarity ?? 'common';

  const embed = new EmbedBuilder()
    .setTitle(`${food.emoji} Cho ${pet.name} ăn!`)
    .setDescription(`**${food.name}** x1 → **${pet.name}**`)
    .addFields(
      { name: '🍖 Hunger', value: `+${food.hunger}`, inline: true },
      { name: '✨ XP', value: '+5', inline: true },
      { name: '💖 Bond', value: '+1', inline: true },
    )
    .setColor('#2ECC71');

  await interaction.update({ embeds: [embed], components: [] });
}
