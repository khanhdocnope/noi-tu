import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';

const ITEMS_PER_PAGE = 5;

async function getShopItems(category: string, page: number) {
  const supabase = getSupabase();
  let query = supabase
    .from('shop_items')
    .select('*')
    .order('price', { ascending: true });

  if (category !== 'all') {
    query = query.eq('type', category);
  }

  const { data, error } = await query.range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
  return { data: data ?? [], error };
}

function getEmoji(type: string): string {
  const emojis: Record<string, string> = {
    food: '🍖',
    medicine: '💊',
    energy: '⚡',
  };
  return emojis[type] ?? '🎁';
}

function createShopEmbed(items: any[], page: number, category: string, userCoin: number) {
  const embed = new EmbedBuilder()
    .setTitle('🏪 Pet Shop')
    .setColor('#FFD700');

  if (items.length === 0) {
    embed.setDescription('😭 Hết hàng!');
  } else {
    const description = items.map((item, i) => {
      const emoji = getEmoji(item.type);
      return `**${i + 1}.** ${emoji} **${item.name}** — \`${item.price} 🪙\`\n> ${item.description ?? 'Không có mô tả'}`;
    }).join('\n\n');

    embed.setDescription(description);
  }

  embed.addFields(
    { name: 'Danh mục', value: `**${category}**`, inline: true },
    { name: 'Ví của bạn', value: `**${userCoin.toLocaleString()} 🪙**`, inline: true },
  );

  embed.setFooter({ text: `Trang ${page} • /buy <item_id> [số lượng] để mua` });
  return embed;
}

function createShopButtons(page: number, hasNext: boolean) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  
  if (page > 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`shop_prev_${page - 1}`)
        .setLabel('◀ Prev')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  if (hasNext) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`shop_next_${page + 1}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  return row;
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
        { name: '🎁 All', value: 'all' }
      )
  )
  .addIntegerOption(option =>
    option.setName('page')
      .setDescription('Trang')
      .setRequired(false)
      .setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;
  const category = interaction.options.getString('category') ?? 'all';
  const page = interaction.options.getInteger('page') ?? 1;

  await interaction.deferReply();

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const { data: items } = await getShopItems(category, page);
  const userCoin = user?.coin ?? 0;

  const hasNext = items.length === 5;
  const embed = createShopEmbed(items, page, category, userCoin);
  const components = hasNext || page > 1 ? [createShopButtons(page, hasNext)] : [];

  await interaction.editReply({ embeds: [embed], components });
}