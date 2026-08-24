import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from 'discord.js';
import type { ChatInputCommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getCreatureName } from './hunt.js';

const LISTING_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_LISTINGS_PER_USER = 5;
const FEE_PERCENT = 5;
const MAX_PRICE = 1000000;
const MAX_QUANTITY = 99;

const SELLABLE_ITEMS = ['rabbit', 'squirrel', 'deer', 'boar', 'wolf', 'gold_ring', 'apple', 'meat', 'berry', 'bone', 'fish'];

const ITEM_NAMES: Record<string, string> = {
  apple: '🍎 Táo',
  meat: '🥩 Thịt',
  berry: '🫐 Quả mọng',
  bone: '🦴 Xương',
  fish: '🐟 Cá',
  gold_ring: '💍 Nhẫn vàng',
  rabbit: '🐰 Thỏ rừng',
  squirrel: '🐿️ Sóc nhỏ',
  deer: '🦌 Hươu con',
  boar: '🐗 Lợn lòi',
  wolf: '🐺 Sói xám',
};

function getItemName(itemId: string): string {
  return ITEM_NAMES[itemId] ?? getCreatureName(itemId);
}

export const data = new SlashCommandBuilder()
  .setName('market')
  .setDescription('Chợ giao dịch vật phẩm')
  .addSubcommand(sub =>
    sub
      .setName('set')
      .setDescription('Đặt kênh chợ cho server')
  )
  .addSubcommand(sub =>
    sub
      .setName('list')
      .setDescription('Đăng bán vật phẩm lên chợ')
  )
  .addSubcommand(sub =>
    sub
      .setName('view')
      .setDescription('Xem chợ vật phẩm')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'set') {
    await handleSet(interaction);
  } else if (subcommand === 'list') {
    await handleList(interaction);
  } else if (subcommand === 'view') {
    await handleView(interaction);
  }
}

async function handleSet(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({ content: '❌ Lệnh chỉ sử dụng trong server!', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: '❌ Chỉ Admin mới có thể đặt kênh chợ!', ephemeral: true });
    return;
  }

  const channelId = interaction.channelId;

  await supabase.from('server_config').upsert({
    guild_id: guildId,
    market_channel_id: channelId,
  });

  await interaction.reply({
    content: `✅ Đã đặt kênh <#${channelId}> làm **Chợ vật phẩm**!`,
    ephemeral: true,
  });
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  const { data: config } = await supabase
    .from('server_config')
    .select('market_channel_id')
    .eq('guild_id', interaction.guildId)
    .single();

  if (!config?.market_channel_id) {
    await interaction.reply({ content: '❌ Server chưa đặt kênh chợ! Dùng `/market set`.', ephemeral: true });
    return;
  }

  if (config.market_channel_id !== interaction.channelId) {
    await interaction.reply({
      content: `❌ Vui lòng dùng lệnh trong kênh chợ: <#${config.market_channel_id}>`,
      ephemeral: true,
    });
    return;
  }

  const { data: inv } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .gt('quantity', 0);

  const sellable = (inv ?? []).filter((i: any) =>
    SELLABLE_ITEMS.includes(i.item_id) && i.quantity > 0
  );

  if (sellable.length === 0) {
    await interaction.reply({
      content: '🎒 Không có vật phẩm nào để đăng bán!',
      ephemeral: true,
    });
    return;
  }

  const options = sellable.map((item: any) => ({
    label: `${getItemName(item.item_id)} x${item.quantity}`,
    value: item.item_id,
    description: `Số lượng: ${item.quantity}`,
  }));

  const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('market_select_item')
      .setPlaceholder('📦 Chọn vật phẩm muốn bán...')
      .addOptions(options)
  );

  await interaction.reply({ components: [select], ephemeral: true });
}

export async function handleSelectItem(interaction: StringSelectMenuInteraction): Promise<void> {
  const { ModalBuilder } = await import('discord.js');

  const modal = new ModalBuilder()
    .setCustomId(`market_modal_${interaction.values[0]}`)
    .setTitle('Đăng bán vật phẩm');

  const quantityInput = new TextInputBuilder()
    .setCustomId('quantity')
    .setLabel('Số lượng muốn bán (tối đa 99)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('VD: 5')
    .setMinLength(1)
    .setMaxLength(2)
    .setRequired(true);

  const priceInput = new TextInputBuilder()
    .setCustomId('price')
    .setLabel('Giá mỗi con (tối đa 1,000,000 🪙)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('VD: 50')
    .setMinLength(1)
    .setMaxLength(7)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(priceInput)
  );

  await interaction.showModal(modal);
}

export async function handleModal(interaction: any): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;
  const itemId = interaction.customId.replace('market_modal_', '');

  const quantity = parseInt(interaction.fields.getTextInputValue('quantity'), 10);
  const price = parseInt(interaction.fields.getTextInputValue('price'), 10);

  if (isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
    await interaction.reply({ content: '❌ Số lượng và giá phải là số dương!', ephemeral: true });
    return;
  }

  if (quantity > MAX_QUANTITY) {
    await interaction.reply({ content: `❌ Số lượng tối đa là ${MAX_QUANTITY}!`, ephemeral: true });
    return;
  }

  if (price > MAX_PRICE) {
    await interaction.reply({ content: `❌ Giá tối đa là ${MAX_PRICE.toLocaleString()} 🪙!`, ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const { data: item } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();

  if (!item || item.quantity < quantity) {
    await interaction.editReply({ content: '❌ Không đủ vật phẩm trong túi!' });
    return;
  }

  await Promise.all([
    supabase.from('inventory').update({ quantity: item.quantity - quantity }).eq('user_id', userId).eq('item_id', itemId),
    supabase.from('market_listings').insert({
      seller_id: userId,
      item_id: itemId,
      quantity,
      price,
      expires_at: new Date(Date.now() + LISTING_DURATION_MS).toISOString(),
    }),
  ]);

  const fee = Math.floor((price * quantity * FEE_PERCENT) / 100);

  const embed = new EmbedBuilder()
    .setTitle('✅ Đăng bán thành công!')
    .setDescription(`**${getItemName(itemId)}** x${quantity}`)
    .addFields(
      { name: '💰 Giá', value: `${price} 🪙/con`, inline: true },
      { name: '💵 Tổng', value: `${price * quantity} 🪙`, inline: true },
      { name: '📊 Phí', value: `${fee} 🪙 (${FEE_PERCENT}%)`, inline: true },
    )
    .setFooter({ text: 'Hết 24h tự động gỡ nếu không bán được' })
    .setColor('#2ECC71');

  await interaction.editReply({ embeds: [embed] });
}

async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();

  const { data: config } = await supabase
    .from('server_config')
    .select('market_channel_id')
    .eq('guild_id', interaction.guildId)
    .single();

  if (!config?.market_channel_id) {
    await interaction.reply({ content: '❌ Server chưa đặt kênh chợ! Dùng `/market set`.', ephemeral: true });
    return;
  }

  if (config.market_channel_id !== interaction.channelId) {
    await interaction.reply({
      content: `❌ Vui lòng dùng lệnh trong kênh chợ: <#${config.market_channel_id}>`,
      ephemeral: true,
    });
    return;
  }

  const { data: listings } = await supabase
    .from('market_listings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  const validListings = (listings ?? []).filter((l: any) => {
    return new Date(l.expires_at).getTime() > Date.now();
  });

  if (validListings.length === 0) {
    await interaction.reply({ content: '🏪 Chợ hiện đang trống!', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🏪 Chợ Vật Phẩm')
    .setColor('#F1C40F');

  const listingText = validListings.map((l: any, i: number) => {
    const name = getItemName(l.item_id);
    const timeLeft = Math.max(0, Math.floor((new Date(l.expires_at).getTime() - Date.now()) / 60000));
    return `**${i + 1}.** ${name} x${l.quantity} — **${l.price} 🪙/con** (⏱️ ${timeLeft} phút)`;
  }).join('\n');

  embed.setDescription(listingText);

  const options = validListings.slice(0, 25).map((l: any) => ({
    label: `${getItemName(l.item_id)} x${l.quantity}`,
    value: String(l.id),
    description: `${l.price} 🪙/con`,
  }));

  const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('market_buy_select')
      .setPlaceholder('🛒 Chọn vật phẩm muốn mua...')
      .addOptions(options)
  );

  await interaction.reply({ embeds: [embed], components: [select], ephemeral: true });
}

export async function handleBuySelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;
  const value = interaction.values[0];
  if (!value) {
    await interaction.deferUpdate();
    await interaction.editReply({ content: '❌ Lỗi: Không chọn được vật phẩm!', embeds: [], components: [] });
    return;
  }
  const listingId = parseInt(value, 10);

  await interaction.deferUpdate();

  const { data: listing } = await supabase
    .from('market_listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (!listing) {
    await interaction.editReply({ content: '❌ Listing đã bị xóa!', embeds: [], components: [] });
    return;
  }

  if (listing.seller_id === userId) {
    await interaction.editReply({ content: '❌ Không thể mua vật phẩm của chính mình!', embeds: [], components: [] });
    return;
  }

  const totalCost = listing.price * listing.quantity;
  const { data: user } = await supabase.from('users').select('coin').eq('user_id', userId).single();

  if ((user?.coin ?? 0) < totalCost) {
    await interaction.editReply({
      content: `❌ Không đủ vàng! Cần **${totalCost} 🪙**, bạn có **${user?.coin ?? 0} 🪙**`,
      embeds: [],
      components: [],
    });
    return;
  }

  const fee = Math.floor((totalCost * FEE_PERCENT) / 100);
  const sellerGet = totalCost - fee;

  const { data: buyerItem } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('user_id', userId)
    .eq('item_id', listing.item_id)
    .single();

  const newQty = (buyerItem?.quantity ?? 0) + listing.quantity;

  await Promise.all([
    supabase.from('users').update({ coin: (user?.coin ?? 0) - totalCost }).eq('user_id', userId),
    supabase.rpc('increment_coin', { p_user_id: listing.seller_id, p_amount: sellerGet }),
    supabase.from('inventory').upsert({ user_id: userId, item_id: listing.item_id, quantity: newQty }),
    supabase.from('market_listings').delete().eq('id', listingId),
  ]);

  const embed = new EmbedBuilder()
    .setTitle('🛒 Mua thành công!')
    .setDescription(`**${getItemName(listing.item_id)}** x${listing.quantity}`)
    .addFields(
      { name: '💵 Tổng chi', value: `${totalCost} 🪙`, inline: true },
      { name: '📊 Phí', value: `${fee} 🪙`, inline: true },
    )
    .setColor('#2ECC71');

  await interaction.editReply({ embeds: [embed], components: [] });
}
