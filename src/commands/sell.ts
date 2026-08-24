import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import type { ChatInputCommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getCreatureName, getSellPrice } from './hunt.js';

const SELLABLE_ITEMS = ['rabbit', 'squirrel', 'deer', 'boar', 'wolf', 'gold_ring'];

export const data = new SlashCommandBuilder()
  .setName('sell')
  .setDescription('Bán items trong túi đồ lấy coin');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  await interaction.deferReply();

  const { data: items } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .gt('quantity', 0);

  const sellable = (items ?? []).filter((i: any) =>
    SELLABLE_ITEMS.includes(i.item_id) && i.quantity > 0
  );

  if (sellable.length === 0) {
    await interaction.editReply({
      content: '🎒 Không có items nào để bán! Hãy đi săn bằng `/hunt`.',
    });
    return;
  }

  const options = sellable.map((item: any) => {
    const name = getCreatureName(item.item_id);
    const price = getSellPrice(item.item_id);
    return {
      label: `${name}`,
      value: item.item_id,
      description: `x${item.quantity} — Bán ${price} 🪙/con`,
    };
  });

  const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('sell_select')
      .setPlaceholder('📦 Chọn item để bán...')
      .addOptions(options)
  );

  await interaction.editReply({ components: [select] });
}

export async function handleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const userId = interaction.user.id;
  const supabase = getSupabase();
  const itemId = interaction.values[0];

  const { data: item } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();

  if (!item || item.quantity <= 0) {
    await interaction.update({ content: '❌ Item đã hết!', components: [] });
    return;
  }

  const sellPrice = getSellPrice(itemId);
  const totalCoin = sellPrice * item.quantity;

  await supabase.from('inventory').update({
    quantity: 0,
  }).eq('user_id', userId).eq('item_id', itemId);

  const { data: user } = await supabase.from('users').select('coin').eq('user_id', userId).single();
  await supabase.from('users').update({
    coin: (user?.coin ?? 0) + totalCoin,
  }).eq('user_id', userId);

  const creatureName = getCreatureName(itemId);

  const embed = new EmbedBuilder()
    .setTitle('💰 Bán thành công!')
    .setDescription(`Đã bán **${creatureName}** x${item.quantity}`)
    .addFields(
      { name: '💰 Nhận được', value: `+${totalCoin} 🪙`, inline: true },
    )
    .setColor('#F1C40F');

  await interaction.update({ embeds: [embed], components: [] });
}
