import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';
import type { Pet } from '../modules/pet/pet.types.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Xem profile pet của bạn');

function getProgressBar(current: number, max: number, length: number = 10): string {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getRarityEmoji(species: string): string {
  const emojis: Record<string, string> = {
    cat: '🐱',
    fox: '🦊',
    rabbit: '🐰',
    wolf: '🐺',
    dragon: '🐉',
  };
  return emojis[species] ?? '🐾';
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  const { data: pet, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !pet) {
    await interaction.reply({
      content: '❌ Bạn chưa có pet! Dùng `/start` để nhận pet.',
      ephemeral: true,
    });
    return;
  }

  const { data: user } = await supabase
    .from('users')
    .select('coin')
    .eq('user_id', userId)
    .single();

  const p = pet as Pet;
  const coin = user?.coin ?? 0;
  const emoji = getRarityEmoji(p.species);
  const artworkUrl = getArtworkUrl(p.species, p.level);

  const xpForNext = Math.floor(100 * Math.pow(p.level, 1.35));
  const xpProgress = getProgressBar(p.xp, xpForNext, 10);

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} ${p.name}`)
    .setDescription(`Level ${p.level}`)
    .setImage(artworkUrl)
    .addFields(
      {
        name: '✨ XP',
        value: `\`${xpProgress}\` ${p.xp}/${xpForNext}`,
        inline: false,
      },
      {
        name: 'Stats',
        value: [
          `❤️ Health: **${p.health}**`,
          `🍖 Hunger: **${p.hunger}**`,
          `⚡ Energy: **${p.energy}**`,
          `😊 Mood: **${p.mood}**`,
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Info',
        value: [
          `🪙 Coin: **${coin.toLocaleString()}**`,
          `❤️ Bond: **${p.bond}**`,
        ].join('\n'),
        inline: true,
      },
    )
    .setColor('#FFD700')
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('profile_feed')
      .setLabel('🍖 Feed')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('profile_play')
      .setLabel('🎾 Play')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('profile_hunt')
      .setLabel('🌲 Hunt')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
