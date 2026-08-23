import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';

const FOODS = [
  { id: 'apple', name: 'Apple', emoji: '🍎', hunger: 10, price: 50 },
  { id: 'meat', name: 'Meat', emoji: '🥩', hunger: 25, price: 100 },
  { id: 'berry', name: 'Berry', emoji: '🫐', hunger: 5, price: 30 },
];

export const data = new SlashCommandBuilder()
  .setName('feed')
  .setDescription('Cho pet ăn')
  .addStringOption(option =>
    option.setName('food')
      .setDescription('Loại thức ăn')
      .setRequired(true)
      .addChoices(...FOODS.map(f => ({ name: `${f.emoji} ${f.name} (${f.price} 🪙)`, value: f.id })))
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;
  const foodId = interaction.options.getString('food', true);

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

  const food = FOODS.find(f => f.id === foodId);
  if (!food) {
    await interaction.editReply({ content: '❌ Thức ăn không hợp lệ.' });
    return;
  }

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const coin = user?.coin ?? 0;
  if (coin < food.price) {
    await interaction.editReply({ content: `❌ Không đủ coin! Cần ${food.price} 🪙.` });
    return;
  }

  if ((pet.hunger ?? 0) >= 95) {
    await interaction.editReply({ content: '❌ Pet đã no rồi!' });
    return;
  }

  await supabase.from('users').update({ coin: coin - food.price }).eq('user_id', userId);
  await supabase.from('pets').update({ hunger: Math.min(100, (pet.hunger ?? 0) + food.hunger) }).eq('user_id', userId);

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'buy_food',
    amount: -food.price,
    reason: `buy_${food.id}`,
  });

  const embed = new EmbedBuilder()
    .setTitle(`${food.emoji} Fed!`)
    .setDescription(`${pet.name} ăn ${food.name}!`)
    .addFields(
      { name: '🍖 Hunger', value: `+${food.hunger}`, inline: true },
      { name: '🪙 Coin', value: `-${food.price}`, inline: true },
    )
    .setImage(getArtworkUrl(pet.species, pet.level))
    .setColor('#FFD700');

  await interaction.editReply({ embeds: [embed] });
}