import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getCreatureName, getSellPrice } from './hunt.js';

const FOOD_ITEMS: Record<string, { name: string; desc: string }> = {
  apple: { name: '🍎 Táo', desc: 'Tăng 10 Hunger' },
  meat: { name: '🥩 Thịt', desc: 'Tăng 25 Hunger' },
  berry: { name: '🫐 Quả mọng', desc: 'Tăng 5 Hunger' },
  bone: { name: '🦴 Xương', desc: 'Tăng 10 Bond' },
  fish: { name: '🐟 Cá', desc: 'Tăng 15 Health' },
};

const SELLABLE_ITEMS = ['rabbit', 'squirrel', 'deer', 'boar', 'wolf', 'gold_ring'];

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Xem túi đồ của bạn');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  await interaction.deferReply();

  const { data: items } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .gt('quantity', 0);

  if (!items || items.length === 0) {
    await interaction.editReply({
      content: '🎒 Túi đồ trống! Mua items tại `/shop`.',
    });
    return;
  }

  const foodList: string[] = [];
  const creatureList: string[] = [];

  for (const item of items) {
    const qty = item.quantity;
    if (FOOD_ITEMS[item.item_id]) {
      const food = FOOD_ITEMS[item.item_id];
      foodList.push(`${food.name} x${qty} — ${food.desc}`);
    } else if (SELLABLE_ITEMS.includes(item.item_id)) {
      const name = getCreatureName(item.item_id);
      const price = getSellPrice(item.item_id);
      creatureList.push(`${name} x${qty} — Bán ${price} 🪙/con`);
    } else {
      creatureList.push(`❓ ${item.item_id} x${qty}`);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('🎒 Túi đồ')
    .setColor('#3498DB');

  if (foodList.length > 0) {
    embed.addFields({
      name: '🍖 Đồ ăn / Vật phẩm',
      value: foodList.join('\n'),
      inline: false,
    });
  }

  if (creatureList.length > 0) {
    embed.addFields({
      name: '🐾 Động vật / Có thể bán',
      value: creatureList.join('\n'),
      inline: false,
    });
  }

  embed.setFooter({ text: 'Dùng /sell để bán động vật lấy coin' });

  await interaction.editReply({ embeds: [embed] });
}
