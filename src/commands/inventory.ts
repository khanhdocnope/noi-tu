import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';

const ITEM_NAMES: Record<string, string> = {
  apple: '🍎 Táo',
  meat: '🥩 Thịt',
  berry: '🫐 Quả mọng',
  bone: '🦴 Xương',
  fish: '🐟 Cá',
  gold_ring: '💍 Nhẫn vàng',
  silver_coin: '🪙 Bạc',
  magic_dust: '✨ Bụi phép',
  feather: '🪶 Lông vũ',
  crystal: '💎 Pha lê',
};

const ITEM_DESCRIPTIONS: Record<string, string> = {
  apple: 'Tăng 10 Hunger',
  meat: 'Tăng 25 Hunger',
  berry: 'Tăng 5 Hunger',
  bone: 'Tăng 10 Bond',
  fish: 'Tăng 15 Health',
  gold_ring: 'Bán được 100 coin',
  silver_coin: 'Bán được 50 coin',
  magic_dust: 'Tăng 20 XP',
  feather: 'Tăng 5 Mood',
  crystal: 'Tăng 10 All Stats',
};

function getItemName(itemId: string): string {
  return ITEM_NAMES[itemId] ?? `❓ ${itemId}`;
}

function getItemDescription(itemId: string): string {
  return ITEM_DESCRIPTIONS[itemId] ?? 'Không rõ';
}

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

  const itemList = items.map((item: any) => {
    const name = getItemName(item.item_id);
    const desc = getItemDescription(item.item_id);
    return `${name} x${item.quantity} — ${desc}`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🎒 Túi đồ')
    .setDescription(itemList)
    .setColor('#3498DB')
    .setFooter({ text: `Tổng: ${items.length} loại items` });

  await interaction.editReply({ embeds: [embed] });
}
