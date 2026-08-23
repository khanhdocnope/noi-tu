import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';
import type { Species } from '../modules/pet/pet.types.js';

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱',
  fox: '🦊',
  rabbit: '🐰',
  wolf: '🐺',
  dragon: '🐉',
  phoenix: '🔥',
  unicorn: '🦄',
  default: '🐾',
};

function getEmoji(speciesId: string): string {
  return SPECIES_EMOJI[speciesId] ?? SPECIES_EMOJI['default'];
}

function rollSpecies(pool: Species[]): Species {
  const totalWeight = pool.reduce((sum, s) => sum + s.spawn_weight, 0);
  let roll = Math.random() * totalWeight;

  for (const species of pool) {
    roll -= species.spawn_weight;
    if (roll <= 0) return species;
  }

  return pool[0]!;
}

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Nhận một pet ngẫu nhiên!');

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

  const { data: speciesList, error: speciesError } = await supabase
    .from('species')
    .select('*');

  if (speciesError || !speciesList || speciesList.length === 0) {
    console.error('Failed to load species:', speciesError);
    await interaction.editReply('❌ Không có species nào trong database. Thêm species trên Web Admin trước!');
    return;
  }

  const species = rollSpecies(speciesList as Species[]);
  const artworkUrl = getArtworkUrl(species.id, 1);
  const emoji = getEmoji(species.id);

  const rarityMap: Record<string, string> = {
    common: 'Common',
    uncommon: '🟢 Uncommon',
    rare: '🔵 Rare',
    epic: '🟣 Epic',
    legendary: '🟡 Legendary',
  };

  const rarityColors: Record<string, string> = {
    common: '#99AAB5',
    uncommon: '#2ECC71',
    rare: '#3498DB',
    epic: '#9B59B6',
    legendary: '#F1C40F',
  };

  const { error } = await supabase.from('pets').insert({
    user_id: userId,
    species: species.id,
    name: species.name,
    level: 1,
    xp: 0,
    health: species.base_stats?.health ?? 100,
    hunger: species.base_stats?.hunger ?? 100,
    energy: species.base_stats?.energy ?? 100,
    mood: species.base_stats?.mood ?? 50,
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
      { name: 'Species', value: `${emoji} ${species.name}`, inline: true },
      { name: 'Rarity', value: rarityMap[species.rarity] ?? 'Common', inline: true },
    )
    .setImage(artworkUrl)
    .setColor(rarityColors[species.rarity] ?? '#99AAB5');

  await interaction.editReply({ embeds: [embed] });
}
