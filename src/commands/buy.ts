import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';

export const data = new SlashCommandBuilder()
  .setName('buy')
  .setDescription('Mua vật phẩm từ shop')
  .addStringOption(option =>
    option.setName('item')
      .setDescription('ID vật phẩm')
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addIntegerOption(option =>
    option.setName('quantity')
      .setDescription('Số lượng')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(99)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;
  const itemId = interaction.options.getString('item', true);
  const quantity = interaction.options.getInteger('quantity') ?? 1;

  await interaction.deferReply();

  const { data: item } = await supabase
    .from('shop_items')
    .select('*')
    .eq('item_id', itemId)
    .single();

  if (!item) {
    await interaction.editReply({ content: '❌ Vật phẩm không tồn tại!' });
    return;
  }

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const totalPrice = item.price * quantity;
  const userCoin = user?.coin ?? 0;

  if (userCoin < totalPrice) {
    await interaction.editReply({ content: `❌ Không đủ coin! Cần ${totalPrice} 🪙.` });
    return;
  }

  await supabase.from('users').update({ coin: userCoin - totalPrice }).eq('user_id', userId);

  const { data: existing } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();

  const newQty = (existing?.quantity ?? 0) + quantity;
  await supabase.from('inventory').upsert({
    user_id: userId,
    item_id: itemId,
    quantity: newQty,
  });

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'buy_item',
    amount: -totalPrice,
    reason: `buy_${itemId}_x${quantity}`,
  });

  await interaction.editReply({
    content: `✅ Mua thành công **${item.name} x${quantity}** (-${totalPrice} 🪙)`
  });
}

export async function autocomplete(interaction: any): Promise<void> {
  const supabase = getSupabase();
  const focused = interaction.options.getFocused(true);
  
  const { data: items } = await supabase
    .from('shop_items')
    .select('item_id, name, price')
    .ilike('name', `%${focused.value}%`)
    .limit(20);

  await interaction.respond(
    (items ?? []).map(item => ({
      name: `${item.name} (${item.price} 🪙)`,
      value: item.item_id
    }))
  );
}