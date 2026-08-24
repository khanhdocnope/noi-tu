import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';
import type { Species } from '../modules/pet/pet.types.js';

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', fox: '🦊', rabbit: '🐰', wolf: '🐺', dragon: '🐉', phoenix: '🔥', unicorn: '🦄',
};
const getEmoji = (s: string) => SPECIES_EMOJI[s] ?? '🐾';

const ROLL_COST = 100;

const RARITY_COLORS: Record<string, string> = {
  common: '#99AAB5',
  uncommon: '#2ECC71',
  rare: '#3498DB',
  epic: '#9B59B6',
  legendary: '#F1C40F',
};

const RARITY_LABELS: Record<string, string> = {
  common: '⚪ Common',
  uncommon: '🟢 Uncommon',
  rare: '🔵 Rare',
  epic: '🟣 Epic',
  legendary: '🟡 Legendary',
};

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
  .setName('roll')
  .setDescription(`Roll pet mới (tốn ${ROLL_COST} 🪙)`);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  await interaction.deferReply();

  const { data: user } = await supabase.from('users').select('coin').eq('user_id', userId).single();
  const coin = user?.coin ?? 0;

  if (coin < ROLL_COST) {
    await interaction.editReply({
      content: `❌ Không đủ vàng! Cần **${ROLL_COST} 🪙**, bạn có **${coin} 🪙**`,
    });
    return;
  }

  const { data: speciesList } = await supabase.from('species').select('*');
  if (!speciesList || speciesList.length === 0) {
    await interaction.editReply({ content: '❌ Không có species nào trong database!' });
    return;
  }

  const species = rollSpecies(speciesList as Species[]);
  const emoji = getEmoji(species.id);
  const artworkUrl = getArtworkUrl(species.id, 1);
  const rarity = species.rarity ?? 'common';
  const embedColor = RARITY_COLORS[rarity] ?? '#99AAB5';

  const oldPetResult = await supabase.from('pets').select('name, species, level').eq('user_id', userId).single();
  const oldPet = oldPetResult.data;

  await Promise.all([
    supabase.from('pets').update({
      species: species.id,
      name: species.name,
      level: 1,
      xp: 0,
      health: species.base_stats?.health ?? 100,
      hunger: species.base_stats?.hunger ?? 100,
      energy: species.base_stats?.energy ?? 100,
      mood: species.base_stats?.mood ?? 50,
      bond: 0,
      rest_start: null,
      rest_duration: 0,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId),
    supabase.from('users').update({ coin: coin - ROLL_COST }).eq('user_id', userId),
  ]);

  const embed = new EmbedBuilder()
    .setTitle('🎲 Random Encounter!')
    .setColor(embedColor as any)
    .setImage(artworkUrl)
    .addFields(
      { name: 'Species', value: `${emoji} ${species.name}`, inline: true },
      { name: 'Rarity', value: RARITY_LABELS[rarity] ?? '⚪ Common', inline: true },
      { name: '💰 Chi phí', value: `-${ROLL_COST} 🪙`, inline: true },
    );

  if (oldPet) {
    const oldEmoji = getEmoji(oldPet.species);
    embed.setFooter({ text: `Pet cũ: ${oldEmoji} ${oldPet.name} (Lv.${oldPet.level}) đã bị thay thế` });
  }

  await interaction.editReply({ embeds: [embed] });
}
