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

const REST_DURATION_MS = 5 * 60 * 1000;
const ENERGY_PER_SECOND = 30 / 300;
const HEALTH_PER_SECOND = 10 / 300;

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

function computeRest(pet: any): { isResting: boolean; timeRemaining: number } {
  if (!pet.rest_start) return { isResting: false, timeRemaining: 0 };
  const elapsed = Date.now() - new Date(pet.rest_start).getTime();
  if (elapsed >= REST_DURATION_MS) return { isResting: false, timeRemaining: 0 };
  return { isResting: true, timeRemaining: REST_DURATION_MS - elapsed };
}

async function finishRestIfDone(pet: any): Promise<boolean> {
  if (!pet.rest_start) return false;
  const elapsed = Date.now() - new Date(pet.rest_start).getTime();
  if (elapsed < REST_DURATION_MS) return false;

  const finalEnergy = Math.min(100, Math.round((pet.energy ?? 0) + 30));
  const finalHealth = Math.min(100, Math.round((pet.health ?? 0) + 10));
  const energyGain = Math.round((pet.rest_duration ?? 0) * ENERGY_PER_SECOND);
  const healthGain = Math.round((pet.rest_duration ?? 0) * HEALTH_PER_SECOND);

  const supabase = getSupabase();
  await supabase.from('pets').update({
    energy: finalEnergy,
    health: finalHealth,
    rest_start: null,
    rest_duration: 0,
  }).eq('user_id', pet.user_id);

  return true;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

function toPromise<T>(thenable: { then: (resolve: (v: T) => void, reject: (e: any) => void) => any }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    thenable.then(resolve, reject);
  });
}

async function fetchPetData(userId: string) {
  const supabase = getSupabase();
  console.log(`[Profile] Fetching data for ${userId}`);
  const [petResult, userResult] = await Promise.all([
    withTimeout(toPromise(supabase.from('pets').select('*').eq('user_id', userId).single()), 5000),
    withTimeout(toPromise(supabase.from('users').select('coin').eq('user_id', userId).single()), 5000),
  ]);
  console.log(`[Profile] Pet: ${petResult.data ? 'found' : 'null'}, User: ${userResult.data ? 'found' : 'null'}`);
  return { pet: petResult.data, user: userResult.data };
}

async function buildProfile(userId: string) {
  const { pet, user } = await fetchPetData(userId);
  if (!pet) return null;

  const p = pet as Pet;
  const supabase = getSupabase();
  const { data: speciesData } = await withTimeout(
    toPromise(supabase.from('species').select('rarity').eq('id', p.species).single()),
    5000
  );
  const rarity = speciesData?.rarity ?? 'common';

  return buildProfileFromData(p, user?.coin ?? 0, rarity);
}

function buildProfileFromData(p: Pet, coin: number, rarity: string) {
  const emoji = getEmoji(p.species);
  const artworkUrl = getArtworkUrl(p.species, p.level);
  const embedColor = RARITY_COLORS[rarity] ?? '#99AAB5';
  const xpForNext = Math.floor(100 * Math.pow(p.level, 1.35));
  const xpPercent = Math.round((p.xp / xpForNext) * 100);
  const xpBar = getProgressBar(p.xp, xpForNext);

  const { isResting, timeRemaining } = computeRest(p);

  let statusText = getMoodLabel(p.mood ?? 50);
  if (isResting) {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    statusText = `😴 Đang nghỉ ngơi (${minutes}p ${seconds}s)`;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} ${p.name} • Level ${p.level}`)
    .setColor(embedColor as any)
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
          `${getStatusIcon(p.mood, [30, 50])} 😊 Tâm trạng: **${p.mood}/100** — ${statusText}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '💎 Thông Tin',
        value: [
          `🪙 Vàng: **${coin.toLocaleString()}**`,
          `💖 Thân thiết: **${p.bond ?? 0}**`,
          `${RARITY_LABELS[rarity] ?? '⚪ Common'}`,
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: isResting ? '😴 Pet đang nghỉ ngơi — không thể săn/chơi!' : `💡 Mẹo: Hãy cho ${p.name} ăn để tăng Tâm trạng và Thân thiết!` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('profile_feed').setLabel('🍖 Cho ăn').setStyle(ButtonStyle.Success).setDisabled(isResting),
    new ButtonBuilder().setCustomId('profile_play').setLabel('🎮 Chơi đùa').setStyle(ButtonStyle.Primary).setDisabled(isResting),
    new ButtonBuilder().setCustomId('profile_hunt').setLabel('⚔️ Săn bắn').setStyle(ButtonStyle.Danger).setDisabled(isResting),
    new ButtonBuilder().setCustomId('profile_inventory').setLabel('🎒 Túi đồ').setStyle(ButtonStyle.Secondary),
  );

  return { embed, row, pet: p };
}

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Xem profile pet của bạn');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  console.log(`[Profile] Execute called by ${interaction.user.id}`);

  try {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferReply();
    }
    const userId = interaction.user.id;

    const { pet } = await fetchPetData(userId);
    if (!pet) {
      await interaction.editReply({ content: '❌ Bạn chưa có pet! Dùng `/start`.' });
      return;
    }

    const rested = await finishRestIfDone(pet);
    const profile = await buildProfile(userId);
    if (!profile) {
      await interaction.editReply({ content: '❌ Lỗi load profile!' });
      return;
    }

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [profile.embed], components: [profile.row] });
    }

    if (rested) {
      await interaction.followUp({
        content: `😴 ${pet.name} đã thức dậy! +30 ⚡, +10 ❤️`,
      });
    }
  } catch (error) {
    console.error('[Profile] Error:', error);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: '❌ Có lỗi xảy ra! Thử lại sau.' }).catch(() => {});
    } else if (!interaction.replied) {
      await interaction.reply({ content: '❌ Có lỗi xảy ra! Thử lại sau.' }).catch(() => {});
    }
  }
}

async function rebuildProfile(userId: string) {
  return buildProfile(userId);
}

export async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const userId = interaction.user.id;
  const supabase = getSupabase();

  if (interaction.customId === 'profile_play') {
    await interaction.deferUpdate();
    const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
    if (!pet) return;
    if (pet.rest_start) {
      await interaction.followUp({ content: '❌ Pet đang nghỉ ngơi!', ephemeral: true });
      return;
    }
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
    await interaction.followUp({ content: `✨ Chơi với ${pet.name}! (+15 XP, +1 Bond, +10 Mood)`, ephemeral: true });
    return;
  }

  if (interaction.customId === 'profile_hunt') {
    await interaction.deferUpdate();
    const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
    if (!pet) return;
    if (pet.rest_start) {
      await interaction.followUp({ content: '❌ Pet đang nghỉ ngơi!', ephemeral: true });
      return;
    }
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

  await Promise.all([
    supabase.from('pets').update({
      hunger: Math.min(100, (pet.hunger ?? 0) + gain),
      xp: (pet.xp ?? 0) + 5,
      bond: (pet.bond ?? 0) + 1,
    }).eq('user_id', userId),
    supabase.from('inventory').update({ quantity: inv.quantity - 1 }).eq('user_id', userId).eq('item_id', itemId),
  ]);

  const profile = await rebuildProfile(userId);
  if (profile) {
    await interaction.update({ embeds: [profile.embed], components: [profile.row] });
  }
  await interaction.followUp({ content: `🍖 Cho ${pet.name} ăn ${itemId}! (+${gain} Hunger, +5 XP, +1 Bond)`, ephemeral: true });
}
