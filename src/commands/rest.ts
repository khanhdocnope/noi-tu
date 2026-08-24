import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';

const REST_DURATION_MS = 5 * 60 * 1000;
const ENERGY_PER_SECOND = 30 / 300;
const HEALTH_PER_SECOND = 10 / 300;

export async function getRestingInfo(pet: any): Promise<{
  isResting: boolean;
  timeRemaining: number;
  energyGain: number;
  healthGain: number;
} | null> {
  if (!pet.rest_start) return null;

  const supabase = getSupabase();
  const restStart = new Date(pet.rest_start).getTime();
  const now = Date.now();
  const elapsed = now - restStart;

  if (elapsed >= REST_DURATION_MS) {
    const finalEnergy = Math.min(100, (pet.energy ?? 0) + (pet.rest_duration ?? 0) * ENERGY_PER_SECOND);
    const finalHealth = Math.min(100, (pet.health ?? 0) + (pet.rest_duration ?? 0) * HEALTH_PER_SECOND);

    await supabase.from('pets').update({
      energy: Math.round(finalEnergy),
      health: Math.round(finalHealth),
      rest_start: null,
      rest_duration: 0,
    }).eq('user_id', pet.user_id);

    return {
      isResting: false,
      timeRemaining: 0,
      energyGain: Math.round((pet.rest_duration ?? 0) * ENERGY_PER_SECOND),
      healthGain: Math.round((pet.rest_duration ?? 0) * HEALTH_PER_SECOND),
    };
  }

  const remaining = REST_DURATION_MS - elapsed;
  const currentEnergyGain = Math.min(30, Math.floor(elapsed / 1000) * ENERGY_PER_SECOND);
  const currentHealthGain = Math.min(10, Math.floor(elapsed / 1000) * HEALTH_PER_SECOND);

  return {
    isResting: true,
    timeRemaining: remaining,
    energyGain: currentEnergyGain,
    healthGain: currentHealthGain,
  };
}

export const data = new SlashCommandBuilder()
  .setName('rest')
  .setDescription('Cho pet nghỉ ngơi');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

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

  if (pet.rest_start) {
    const elapsed = Date.now() - new Date(pet.rest_start).getTime();
    if (elapsed < REST_DURATION_MS) {
      const remaining = Math.ceil((REST_DURATION_MS - elapsed) / 1000);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      await interaction.editReply({
        content: `😴 ${pet.name} đang nghỉ ngơi! Còn **${minutes} phút ${seconds} giây** nữa thức dậy.`,
      });
      return;
    }
  }

  await supabase.from('pets').update({
    rest_start: new Date().toISOString(),
    rest_duration: 0,
  }).eq('user_id', userId);

  const embed = new EmbedBuilder()
    .setTitle('😴 Bắt đầu nghỉ ngơi')
    .setDescription(`${pet.name} đang nằm xuống nghỉ ngơi...`)
    .addFields(
      { name: '⏱️ Thời gian', value: '5 phút', inline: true },
      { name: '⚡ Energy', value: `+30 (tối đa)`, inline: true },
      { name: '❤️ Health', value: `+10 (tối đa)`, inline: true },
    )
    .setFooter({ text: 'Sau 5 phút sẽ tự động hồi phục. Pet sẽ không thể săn/w/play khi đang nghỉ!' })
    .setImage(getArtworkUrl(pet.species, pet.level))
    .setColor('#87CEEB');

  await interaction.editReply({ embeds: [embed] });
}
