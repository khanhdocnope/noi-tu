import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction, ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { getSupabase } from '../database/supabase/client.js';
import { getArtworkUrl } from '../storage/artwork.service.js';
import type { Pet } from '../modules/pet/pet.types.js';

function getProgressBar(current: number, max: number, length: number = 10): string {
  const filled = Math.round((current / max) * length);
  return '🟩'.repeat(filled) + '⬜'.repeat(length - filled);
}

function getStatusIcon(value: number, thresholds: [number, number] = [30, 70]): string {
  if (value <= thresholds[0]) return '⚠️';
  if (value >= thresholds[1]) return '✅';
  return '🔸';
}

function getMoodLabel(mood: number): string {
  if (mood >= 80) return 'Vui vẻ';
  if (mood >= 50) return 'Bình thường';
  if (mood >= 30) return 'Buồn';
  return '⚠️ Đang buồn';
}

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', fox: '🦊', rabbit: '🐰', wolf: '🐺', dragon: '🐉', phoenix: '🔥', unicorn: '🦄',
};
const getEmoji = (s: string) => SPECIES_EMOJI[s] ?? '🐾';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Xem profile pet của bạn');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const supabase = getSupabase();
  const userId = interaction.user.id;

  await interaction.deferReply();

  const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
  if (!pet) {
    await interaction.editReply({ content: '❌ Bạn chưa có pet! Dùng `/start`.' });
    return;
  }

  const { data: user } = await supabase.from('users').select('coin').eq('user_id', userId).single();
  const p = pet as Pet;
  const coin = user?.coin ?? 0;
  const emoji = getEmoji(p.species);
  const artworkUrl = getArtworkUrl(p.species, p.level);

  const xpForNext = Math.floor(100 * Math.pow(p.level, 1.35));
  const xpPercent = Math.round((p.xp / xpForNext) * 100);
  const xpBar = getProgressBar(p.xp, xpForNext);

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} ${p.name} • Level ${p.level}`)
    .setColor('#FF5722')
    .setImage(artworkUrl)
    .addFields(
      {
        name: '✨ Tiến trình Cấp độ',
        value: `${xpBar} \`${p.xp}/${xpForNext} XP (${xpPercent}%)\``,
        inline: false,
      },
      {
        name: '📊 Chỉ Số Sinh Tồn',
        value: [
          `${getStatusIcon(p.health, [30, 70])} ❤️ Máu: **${p.health}/100**`,
          `${getStatusIcon(p.hunger, [30, 70])} 🍖 No: **${p.hunger}/100**`,
          `${getStatusIcon(p.energy, [30, 70])} ⚡ Năng lượng: **${p.energy}/100**`,
          `${getStatusIcon(p.mood, [30, 50])} 😊 Tâm trạng: **${p.mood}/100** — ${getMoodLabel(p.mood ?? 50)}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '💎 Thông Tin',
        value: [
          `🪙 Vàng: **${coin.toLocaleString()}**`,
          `💖 Thân thiết: **${p.bond ?? 0}**`,
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: `💡 Mẹo: Hãy cho ${p.name} ăn để tăng Tâm trạng và Thân thiết!` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('profile_feed')
      .setLabel('🍖 Cho ăn')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('profile_play')
      .setLabel('🎮 Chơi đùa')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('profile_hunt')
      .setLabel('⚔️ Săn bắn')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('profile_inventory')
      .setLabel('🎒 Túi đồ')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function rebuildProfile(userId: string) {
  const supabase = getSupabase();
  const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
  const { data: user } = await supabase.from('users').select('coin').eq('user_id', userId).single();
  if (!pet) return null;

  const p = pet as Pet;
  const coin = user?.coin ?? 0;
  const emoji = getEmoji(p.species);
  const artworkUrl = getArtworkUrl(p.species, p.level);
  const xpForNext = Math.floor(100 * Math.pow(p.level, 1.35));
  const xpPercent = Math.round((p.xp / xpForNext) * 100);
  const xpBar = getProgressBar(p.xp, xpForNext);

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} ${p.name} • Level ${p.level}`)
    .setColor('#FF5722')
    .setImage(artworkUrl)
    .addFields(
      {
        name: '✨ Tiến trình Cấp độ',
        value: `${xpBar} \`${p.xp}/${xpForNext} XP (${xpPercent}%)\``,
        inline: false,
      },
      {
        name: '📊 Chỉ Số Sinh Tồn',
        value: [
          `${getStatusIcon(p.health, [30, 70])} ❤️ Máu: **${p.health}/100**`,
          `${getStatusIcon(p.hunger, [30, 70])} 🍖 No: **${p.hunger}/100**`,
          `${getStatusIcon(p.energy, [30, 70])} ⚡ Năng lượng: **${p.energy}/100**`,
          `${getStatusIcon(p.mood, [30, 50])} 😊 Tâm trạng: **${p.mood}/100** — ${getMoodLabel(p.mood ?? 50)}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '💎 Thông Tin',
        value: [
          `🪙 Vàng: **${coin.toLocaleString()}**`,
          `💖 Thân thiết: **${p.bond ?? 0}**`,
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: `💡 Mẹo: Hãy cho ${p.name} ăn để tăng Tâm trạng và Thân thiết!` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('profile_feed').setLabel('🍖 Cho ăn').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('profile_play').setLabel('🎮 Chơi đùa').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('profile_hunt').setLabel('⚔️ Săn bắn').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('profile_inventory').setLabel('🎒 Túi đồ').setStyle(ButtonStyle.Secondary),
  );

  return { embed, row };
}

export async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const userId = interaction.user.id;
  const supabase = getSupabase();

  if (interaction.customId === 'profile_play') {
    await interaction.deferUpdate();
    const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
    if (!pet) return;

    if ((pet.energy ?? 0) < 15) {
      await interaction.followUp({ content: '❌ Pet quá mệt! Hãy nghỉ ngơi.', ephemeral: true });
      return;
    }

    await supabase.from('pets').update({
      energy: Math.max(0, (pet.energy ?? 0) - 15),
      xp: (pet.xp ?? 0) + 15,
      bond: (pet.bond ?? 0) + 1,
      mood: Math.min(100, (pet.mood ?? 50) + 10),
    }).eq('user_id', userId);

    const profile = await rebuildProfile(userId);
    if (profile) {
      await interaction.editReply({ embeds: [profile.embed], components: [profile.row] });
    }
    await interaction.followUp({ content: `✨ Bạn đã chơi với ${(pet as Pet).name}! (+15 XP, +1 Bond, +10 Mood)`, ephemeral: true });
    return;
  }

  if (interaction.customId === 'profile_hunt') {
    await interaction.deferUpdate();
    const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
    if (!pet) return;

    if ((pet.energy ?? 0) < 20) {
      await interaction.followUp({ content: '❌ Pet quá mệt! Hãy nghỉ ngơi.', ephemeral: true });
      return;
    }

    await supabase.from('pets').update({
      energy: Math.max(0, (pet.energy ?? 0) - 20),
      xp: (pet.xp ?? 0) + 20,
    }).eq('user_id', userId);

    const coinGain = Math.floor(Math.random() * 50) + 30;
    const { data: user } = await supabase.from('users').select('coin').eq('user_id', userId).single();
    await supabase.from('users').update({ coin: (user?.coin ?? 0) + coinGain }).eq('user_id', userId);

    const profile = await rebuildProfile(userId);
    if (profile) {
      await interaction.editReply({ embeds: [profile.embed], components: [profile.row] });
    }
    await interaction.followUp({ content: `⚔️ Săn thành công! +${coinGain} 🪙, +20 XP`, ephemeral: true });
    return;
  }

  if (interaction.customId === 'profile_inventory') {
    await interaction.deferUpdate();
    const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', userId);
    if (!inv || inv.length === 0) {
      await interaction.followUp({ content: '🎒 Túi đồ trống!', ephemeral: true });
      return;
    }

    const list = inv.map((i: any) => `**${i.item_id}** x${i.quantity}`).join('\n');
    await interaction.followUp({ content: `🎒 **Túi đồ:**\n${list}`, ephemeral: true });
    return;
  }

  if (interaction.customId === 'profile_feed') {
    await interaction.deferUpdate();
    const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', userId);
    const foods = (inv ?? []).filter((i: any) => ['apple', 'meat', 'berry'].includes(i.item_id) && i.quantity > 0);

    if (foods.length === 0) {
      await interaction.followUp({ content: '❌ Không có thức ăn! Mua tại `/shop`.', ephemeral: true });
      return;
    }

    const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('profile_feed_select')
        .setPlaceholder('🍖 Chọn thức ăn...')
        .addOptions(foods.map((f: any) => ({
          label: f.item_id,
          value: f.item_id,
          description: `Số lượng: ${f.quantity}`,
        })))
    );

    await interaction.followUp({ components: [select], ephemeral: true });
  }
}

export async function handleFeedSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const userId = interaction.user.id;
  const supabase = getSupabase();
  const itemId = interaction.values[0];

  const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
  if (!pet) return;

  const { data: inv } = await supabase.from('inventory').select('quantity').eq('user_id', userId).eq('item_id', itemId).single();
  if (!inv || inv.quantity <= 0) {
    await interaction.update({ content: '❌ Hết thức ăn!', components: [] });
    return;
  }

  const hungerGain: Record<string, number> = { apple: 10, meat: 25, berry: 5 };
  const gain = hungerGain[itemId] ?? 10;

  await supabase.from('pets').update({
    hunger: Math.min(100, (pet.hunger ?? 0) + gain),
    xp: (pet.xp ?? 0) + 5,
    bond: (pet.bond ?? 0) + 1,
  }).eq('user_id', userId);

  await supabase.from('inventory').update({ quantity: inv.quantity - 1 }).eq('user_id', userId).eq('item_id', itemId);

  const profile = await rebuildProfile(userId);
  if (profile) {
    await interaction.update({ embeds: [profile.embed], components: [profile.row] });
  }
  await interaction.followUp({ content: `🍖 Cho ${(pet as Pet).name} ăn ${itemId}! (+${gain} Hunger, +5 XP, +1 Bond)`, ephemeral: true });
}
