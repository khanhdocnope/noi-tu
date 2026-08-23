import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';

const ENERGY_RESTORE = 30;
const HEALTH_RESTORE = 10;

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

  const newEnergy = Math.min(100, (pet.energy ?? 0) + ENERGY_RESTORE);
  const newHealth = Math.min(100, (pet.health ?? 0) + HEALTH_RESTORE);

  await supabase.from('pets').update({
    energy: newEnergy,
    health: newHealth,
  }).eq('user_id', userId);

  const embed = new EmbedBuilder()
    .setTitle('😴 Rest Time')
    .setDescription(`${pet.name} ngủ ngon!`)
    .addFields(
      { name: '⚡ Energy', value: `+${ENERGY_RESTORE}`, inline: true },
      { name: '❤️ Health', value: `+${HEALTH_RESTORE}`, inline: true },
    )
    .setImage(getArtworkUrl(pet.species, pet.level))
    .setColor('#87CEEB');

  await interaction.editReply({ embeds: [embed] });
}