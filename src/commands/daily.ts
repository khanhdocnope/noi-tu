import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';

const DAILY_COIN = 100;
const DAILY_XP = 20;

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Nhận phần thưởng hằng ngày');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  await interaction.deferReply();

  const { data: existingClaim } = await supabase
    .from('daily_claims')
    .select('claimed_at')
    .eq('user_id', userId)
    .single();

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (existingClaim && existingClaim.claimed_at === today) {
    await interaction.editReply({
      content: '❌ Bạn đã nhận daily hôm nay rồi! Quay lại ngày mai nhé.',
    });
    return;
  }

  await supabase.from('daily_claims').upsert({
    user_id: userId,
    claimed_at: today,
  });

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const newCoin = (user?.coin ?? 0) + DAILY_COIN;
  await supabase.from('users').update({ coin: newCoin }).eq('user_id', userId);

  const { data: pet } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (pet) {
    const newXp = (pet.xp ?? 0) + DAILY_XP;
    await supabase.from('pets').update({ xp: newXp }).eq('user_id', userId);
  }

  const embed = new EmbedBuilder()
    .setTitle('🎁 Daily Reward!')
    .setDescription('Bạn đã nhận phần thưởng hằng ngày!')
    .addFields(
      { name: '🪙 Coin', value: `+${DAILY_COIN}`, inline: true },
      { name: '✨ XP', value: `+${DAILY_XP}`, inline: true },
    )
    .setColor('#FFD700')
    .setFooter({ text: 'Hãy quay lại ngày mai nhé!' });

  await interaction.editReply({ embeds: [embed] });
}