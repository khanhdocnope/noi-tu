import type { Message, TextChannel } from 'discord.js';
import * as profileCommand from '../commands/profile.js';
import * as inventoryCommand from '../commands/inventory.js';
import * as startCommand from '../commands/start.js';
import * as dailyCommand from '../commands/daily.js';
import * as feedCommand from '../commands/feed.js';
import * as playCommand from '../commands/play.js';
import * as restCommand from '../commands/rest.js';
import * as huntCommand from '../commands/hunt.js';
import * as shopCommand from '../commands/shop.js';
import * as sellCommand from '../commands/sell.js';
import * as marketCommand from '../commands/market.js';
import * as rollCommand from '../commands/roll.js';
import { getSupabase } from '../database/supabase/client.js';
import { getItemByAlias, getAllAliases } from '../storage/item-alias.service.js';

const PREFIX = '.';

function createFakeInteraction(msg: Message, commandName: string, args: string[] = []) {
  const channel = msg.channel as TextChannel;

  const fakeInteraction = {
    user: msg.author,
    member: msg.member,
    guildId: msg.guildId,
    channelId: msg.channelId,
    client: msg.client,
    commandName,
    options: {
      getSubcommand: () => null,
      getString: (name: string, required?: boolean) => {
        if (name === 'food' || name === 'item' || name === 'target') {
          return args[0] ?? null;
        }
        return null;
      },
    },
    replied: false,
    deferred: false,
    deferReply: async () => { fakeInteraction.deferred = true; },
    reply: async (options: any) => {
      fakeInteraction.replied = true;
      const content = options.content || '';
      const embeds = options.embeds || [];
      if (embeds.length > 0) {
        await channel.send({ embeds });
      } else if (content) {
        await channel.send(content);
      }
    },
    editReply: async (options: any) => {
      const content = options.content || '';
      const embeds = options.embeds || [];
      if (embeds.length > 0) {
        await channel.send({ embeds });
      } else if (content) {
        await channel.send(content);
      }
    },
    followUp: async (options: any) => {
      const content = options.content || '';
      const embeds = options.embeds || [];
      if (embeds.length > 0) {
        await channel.send({ embeds });
      } else if (content) {
        await channel.send(content);
      }
    },
    deferUpdate: async () => {},
    update: async () => {},
    memberPermissions: msg.member?.permissions,
  };

  return fakeInteraction;
}

const FOOD_STATS: Record<string, number> = {
  apple: 10, meat: 25, berry: 5, fish: 15, bone: 0,
};

const SELL_PRICES: Record<string, number> = {
  squirrel: 10, rabbit: 15, deer: 40, boar: 60, wolf: 100, gold_ring: 150,
};

const ITEM_NAMES: Record<string, string> = {
  apple: '🍎 Táo',
  meat: '🥩 Thịt',
  berry: '🫐 Quả mọng',
  fish: '🐟 Cá',
  bone: '🦴 Xương',
  squirrel: '🐿️ Sóc nhỏ',
  rabbit: '🐰 Thỏ rừng',
  deer: '🦌 Hươu con',
  boar: '🐗 Lợn lòi',
  wolf: '🐺 Sói xám',
  gold_ring: '💍 Nhẫn vàng',
};

async function handleFeed(msg: Message, args: string[]) {
  const channel = msg.channel as TextChannel;
  const userId = msg.author.id;
  const supabase = getSupabase();

  const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).single();
  if (!pet) {
    await channel.send('❌ Bạn chưa có pet! Dùng `/start`.');
    return;
  }

  if (pet.rest_start) {
    await channel.send('❌ Pet đang nghỉ ngơi!');
    return;
  }

  if ((pet.hunger ?? 0) >= 95) {
    await channel.send('❌ Pet đã no rồi!');
    return;
  }

  if (!args[0]) {
    const fakeInteraction = createFakeInteraction(msg, 'feed', args);
    await feedCommand.execute(fakeInteraction as any);
    return;
  }

  const alias = await getItemByAlias(args[0]);
  if (!alias || alias.type !== 'food') {
    const allAliases = await getAllAliases();
    const foodAliases = (await import('../storage/item-alias.service.js')).getItemsByType('food');
    const validIds = (await foodAliases).map(a => `\`.${a.alias}\``).join(', ');
    await channel.send(`❌ Không tìm thấy thức ăn! Gõ \`.feed\` để chọn từ menu.`);
    return;
  }

  const { data: inv } = await supabase.from('inventory').select('quantity').eq('user_id', userId).eq('item_id', alias.item_id).single();
  if (!inv || inv.quantity <= 0) {
    await channel.send(`❌ Hết ${ITEM_NAMES[alias.item_id] ?? alias.item_id}! Mua tại \`/shop\`.`);
    return;
  }

  const hungerGain = FOOD_STATS[alias.item_id] ?? 10;

  await Promise.all([
    supabase.from('pets').update({
      hunger: Math.min(100, (pet.hunger ?? 0) + hungerGain),
      xp: (pet.xp ?? 0) + 5,
      bond: (pet.bond ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId),
    supabase.from('inventory').update({ quantity: inv.quantity - 1 }).eq('user_id', userId).eq('item_id', alias.item_id),
  ]);

  await channel.send(`🍖 Cho **${pet.name}** ăn ${ITEM_NAMES[alias.item_id] ?? alias.item_id}! (+${hungerGain} Hunger, +5 XP, +1 Bond)`);
}

async function handleSell(msg: Message, args: string[]) {
  const channel = msg.channel as TextChannel;
  const userId = msg.author.id;
  const supabase = getSupabase();

  if (!args[0]) {
    const fakeInteraction = createFakeInteraction(msg, 'sell', args);
    await sellCommand.execute(fakeInteraction as any);
    return;
  }

  const alias = await getItemByAlias(args[0]);
  if (!alias || alias.type !== 'creature') {
    await channel.send(`❌ Không tìm thấy vật phẩm để bán! Gõ \`.sell\` để chọn từ menu.`);
    return;
  }

  const { data: inv } = await supabase.from('inventory').select('quantity').eq('user_id', userId).eq('item_id', alias.item_id).single();
  if (!inv || inv.quantity <= 0) {
    await channel.send(`❌ Không có ${ITEM_NAMES[alias.item_id] ?? alias.item_id} trong túi!`);
    return;
  }

  const price = SELL_PRICES[alias.item_id] ?? 5;
  const totalCoin = price * inv.quantity;

  const { data: user } = await supabase.from('users').select('coin').eq('user_id', userId).single();

  await Promise.all([
    supabase.from('inventory').update({ quantity: 0 }).eq('user_id', userId).eq('item_id', alias.item_id),
    supabase.from('users').update({ coin: (user?.coin ?? 0) + totalCoin }).eq('user_id', userId),
  ]);

  await channel.send(`💰 Bán **${ITEM_NAMES[alias.item_id] ?? alias.item_id}** x${inv.quantity} → **+${totalCoin} 🪙**`);
}

const COMMAND_MAP: Record<string, (msg: Message, args: string[]) => Promise<void>> = {
  me: async (msg, args) => {
    const fakeInteraction = createFakeInteraction(msg, 'profile', args);
    await profileCommand.execute(fakeInteraction as any);
  },
  profile: async (msg, args) => {
    const fakeInteraction = createFakeInteraction(msg, 'profile', args);
    await profileCommand.execute(fakeInteraction as any);
  },
  bag: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'inventory');
    await inventoryCommand.execute(fakeInteraction as any);
  },
  inventory: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'inventory');
    await inventoryCommand.execute(fakeInteraction as any);
  },
  start: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'start');
    await startCommand.execute(fakeInteraction as any);
  },
  daily: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'daily');
    await dailyCommand.execute(fakeInteraction as any);
  },
  feed: async (msg, args) => await handleFeed(msg, args),
  play: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'play');
    await playCommand.execute(fakeInteraction as any);
  },
  rest: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'rest');
    await restCommand.execute(fakeInteraction as any);
  },
  hunt: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'hunt');
    await huntCommand.execute(fakeInteraction as any);
  },
  shop: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'shop');
    await shopCommand.execute(fakeInteraction as any);
  },
  sell: async (msg, args) => await handleSell(msg, args),
  market: async (msg, args) => {
    const fakeInteraction = createFakeInteraction(msg, 'market', args);
    await marketCommand.execute(fakeInteraction as any);
  },
  roll: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'roll');
    await rollCommand.execute(fakeInteraction as any);
  },
};

export function handlePrefixMessage(message: Message): void {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args[0]?.toLowerCase();
  const commandArgs = args.slice(1);

  if (!command || !COMMAND_MAP[command]) return;

  console.log(`[Prefix] ${message.author.tag}: ${message.content}`);

  COMMAND_MAP[command](message, commandArgs).catch((error) => {
    console.error(`[Prefix] Error:`, error);
    const ch = message.channel as TextChannel;
    ch.send('❌ Có lỗi xảy ra!').catch(() => {});
  });
}
