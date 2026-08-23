import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import type { ChatInputCommandInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, ButtonInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';

const ITEMS_PER_PAGE = 5;

function getEmoji(type: string): string {
  const emojis: Record<string, string> = {
    food: '🍖',
    medicine: '💊',
    energy: '⚡',
  };
  return emojis[type] ?? '🎁';
}

async function getShopItems(category: string, page: number) {
  const supabase = getSupabase();
  let query = supabase
    .from('shop_items')
    .select('*')
    .order('price', { ascending: true });

  if (category !== 'all') {
    query = query.eq('type', category);
  }

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const { data, error } = await query.range(offset, offset + ITEMS_PER_PAGE);

  const items = data ?? [];
  const hasNext = items.length > ITEMS_PER_PAGE;

  return { data: items.slice(0, ITEMS_PER_PAGE), hasNext, error };
}

function buildShopEmbed(items: any[], page: number, totalPages: number, userCoin: number) {
  const list = items.map((item, i) => {
    const emoji = getEmoji(item.type);
    const idx = String(i + 1).padStart(2, '0');
    return `#${idx} ${emoji} **${item.name}** — \`${item.price} 🪙\``;
  }).join('\n');

  return new EmbedBuilder()
    .setTitle('🏪 PET SHOP')
    .setColor('#FEE75C')
    .setDescription(list || '😭 Hết hàng!')
    .setFooter({ text: `👛 ${userCoin.toLocaleString()} 🪙  •  📄 Trang ${page}/${totalPages}` });
}

function buildSelectMenu(items: any[]) {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('shop_select')
      .setPlaceholder('🛒 Chọn vật phẩm bạn muốn mua...')
      .addOptions(
        items.map(item => ({
          label: `${item.name} — ${item.price} 🪙`,
          description: (item.description ?? '').slice(0, 100),
          value: item.item_id,
          emoji: getEmoji(item.type),
        }))
      )
  );
}

function buildButtons(page: number, totalPages: number) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('shop_prev')
      .setLabel('◀ Trang trước')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId('shop_refresh')
      .setLabel('🔄 Làm mới')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('shop_next')
      .setLabel('Trang sau ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
  );
  return row;
}

async function getTotalPages(category: string) {
  const supabase = getSupabase();
  let query = supabase.from('shop_items').select('*', { count: 'exact', head: true });
  if (category !== 'all') {
    query = query.eq('type', category);
  }
  const { count } = await query;
  return Math.max(1, Math.ceil((count ?? 0) / ITEMS_PER_PAGE));
}

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('Xem cửa hàng')
  .addStringOption(option =>
    option.setName('category')
      .setDescription('Lọc theo danh mục')
      .setRequired(false)
      .addChoices(
        { name: '🍖 Food', value: 'food' },
        { name: '💊 Medicine', value: 'medicine' },
        { name: '⚡ Energy', value: 'energy' },
        { name: '🎁 Tất cả', value: 'all' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;
  const category = interaction.options.getString('category') ?? 'all';

  await interaction.deferReply();

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const userCoin = user?.coin ?? 0;
  const page = 1;
  const totalPages = await getTotalPages(category);
  const { data: items } = await getShopItems(category, page);

  const embed = buildShopEmbed(items, page, totalPages, userCoin);
  const components = items.length > 0
    ? [buildSelectMenu(items), buildButtons(page, totalPages)]
    : [buildButtons(page, totalPages)];

  await interaction.editReply({ embeds: [embed], components });
}

export async function handleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const itemId = interaction.values[0];
  const supabase = getSupabase();
  const userId = interaction.user.id;

  const { data: item } = await supabase
    .from('shop_items')
    .select('*')
    .eq('item_id', itemId)
    .single();

  if (!item) {
    await interaction.reply({ content: '❌ Vật phẩm không tồn tại!', ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`shop_modal_${itemId}`)
    .setTitle(`Mua ${item.name}`);

  const quantityInput = new TextInputBuilder()
    .setCustomId('quantity')
    .setLabel(`Bạn muốn mua bao nhiêu ${item.name}?`)
    .setPlaceholder('Nhập số lượng (1-99)')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(2)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput)
  );

  await interaction.showModal(modal);
}

export async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  const itemId = interaction.customId.replace('shop_modal_', '');
  const userId = interaction.user.id;
  const quantity = parseInt(interaction.fields.getTextInputValue('quantity'), 10);

  if (isNaN(quantity) || quantity < 1 || quantity > 99) {
    await interaction.reply({ content: '❌ Số lượng không hợp lệ! (1-99)', ephemeral: true });
    return;
  }

  const supabase = getSupabase();

  const { data: item } = await supabase
    .from('shop_items')
    .select('*')
    .eq('item_id', itemId)
    .single();

  if (!item) {
    await interaction.reply({ content: '❌ Vật phẩm không tồn tại!', ephemeral: true });
    return;
  }

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const userCoin = user?.coin ?? 0;
  const totalCost = item.price * quantity;

  if (userCoin < totalCost) {
    await interaction.reply({
      content: `❌ Không đủ coin! Cần **${totalCost.toLocaleString()} 🪙** (bạn có ${userCoin.toLocaleString()} 🪙)`,
      ephemeral: true,
    });
    return;
  }

  await supabase.from('users').update({ coin: userCoin - totalCost }).eq('user_id', userId);

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
    amount: -totalCost,
    reason: `buy_${itemId}_x${quantity}`,
  });

  await interaction.reply({
    content: `✅ Mua thành công **${item.name} x${quantity}** — -${totalCost.toLocaleString()} 🪙`,
    ephemeral: true,
  });
}

export async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;
  const userId = interaction.user.id;
  const supabase = getSupabase();

  const currentEmbed = interaction.message.embeds[0];
  const footerText = currentEmbed.footer?.text ?? '';
  const pageMatch = footerText.match(/Trang (\d+)\/(\d+)/);
  const currentPage = pageMatch ? parseInt(pageMatch[1]) : 1;
  const totalPages = pageMatch ? parseInt(pageMatch[2]) : 1;

  const categoryMatch = currentEmbed.description?.match(/#01/) ? 'all' : 'all';
  const category = categoryMatch;

  let newPage = currentPage;
  if (customId === 'shop_prev') newPage = Math.max(1, currentPage - 1);
  if (customId === 'shop_next') newPage = Math.min(totalPages, currentPage + 1);

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const userCoin = user?.coin ?? 0;
  const { data: items } = await getShopItems(category, newPage);

  const embed = buildShopEmbed(items, newPage, totalPages, userCoin);
  const components = items.length > 0
    ? [buildSelectMenu(items), buildButtons(newPage, totalPages)]
    : [buildButtons(newPage, totalPages)];

  await interaction.update({ embeds: [embed], components });
}
