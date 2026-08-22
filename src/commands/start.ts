import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Nhận một pet ngẫu nhiên!');

const SPECIES_POOL = [
  { id: 'cat', name: 'Cat', emoji: '🐱', weight: 60 },
  { id: 'fox', name: 'Fox', emoji: '🦊', weight: 25 },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', weight: 10 },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', weight: 4 },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', weight: 1 },
];

function rollSpecies(): (typeof SPECIES_POOL)[number] {
  const totalWeight = SPECIES_POOL.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const species of SPECIES_POOL) {
    roll -= species.weight;
    if (roll <= 0) return species;
  }

  return SPECIES_POOL[0];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  const { data: existing } = await supabase
    .from('pets')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    await interaction.reply({
      content: '❌ Bạn đã có pet rồi! Dùng `/profile` để xem.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const species = rollSpecies();
  const artworkUrl = getArtworkUrl(species.id, 1);

  const { error } = await supabase.from('pets').insert({
    user_id: userId,
    species: species.id,
    name: species.name,
    level: 1,
    xp: 0,
    health: 100,
    hunger: 100,
    energy: 100,
    mood: 50,
    bond: 0,
  });

  if (error) {
    console.error('Failed to create pet:', error);
    await interaction.editReply('❌ Có lỗi xảy ra khi tạo pet. Thử lại sau!');
    return;
  }

  await supabase.from('users').insert({
    user_id: userId,
    coin: 100,
  });

  const embed = new EmbedBuilder()
    .setTitle('🎲 Random Encounter!')
    .setDescription(`Bạn đã tìm được một sinh vật phù hợp!`)
    .addFields(
      { name: 'Species', value: `${species.emoji} ${species.name}`, inline: true },
      { name: 'Rarity', value: species.id === 'dragon' ? '⭐ Legendary' : 'Common', inline: true },
    )
    .setImage(artworkUrl)
    .setColor('#FFD700')
    .setFooter({ text: 'Chăm sóc pet thật tốt nhé!' });

  await interaction.editReply({ embeds: [embed] });
}
