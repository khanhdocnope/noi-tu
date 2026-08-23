import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';

const PLAY_REWARD_XP = 15;
const ENERGY_COST = 15;

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Chơi với pet');

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

  if ((pet.energy ?? 0) < ENERGY_COST) {
    await interaction.editReply({ content: '❌ Pet quá mệt! Dùng `/rest` để hồi phục năng lượng.' });
    return;
  }

  const newEnergy = (pet.energy ?? 0) - ENERGY_COST;
  const newXp = (pet.xp ?? 0) + PLAY_REWARD_XP;
  const newBond = (pet.bond ?? 0) + 1;

  await supabase.from('pets').update({
    energy: Math.max(0, newEnergy),
    xp: newXp,
    bond: newBond,
  }).eq('user_id', userId);

  const embed = new EmbedBuilder()
    .setTitle('🎾 Play Time!')
    .setDescription(`${pet.name} vui vẻ chơi đùa!`)
    .addFields(
      { name: '✨ XP', value: `+${PLAY_REWARD_XP}`, inline: true },
      { name: '❤️ Bond', value: '+1', inline: true },
      { name: '⚡ Energy', value: `-${ENERGY_COST}`, inline: true },
    )
    .setImage(getArtworkUrl(pet.species, pet.level))
    .setColor('#FFD700');

  await interaction.editReply({ embeds: [embed] });
}