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

const PREFIX = '.';

const COMMAND_MAP: Record<string, (message: Message) => Promise<void>> = {
  me: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'profile');
    await profileCommand.execute(fakeInteraction as any);
  },
  profile: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'profile');
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
  feed: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'feed');
    await feedCommand.execute(fakeInteraction as any);
  },
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
  sell: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'sell');
    await sellCommand.execute(fakeInteraction as any);
  },
  market: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'market');
    await marketCommand.execute(fakeInteraction as any);
  },
  roll: async (msg) => {
    const fakeInteraction = createFakeInteraction(msg, 'roll');
    await rollCommand.execute(fakeInteraction as any);
  },
};

function createFakeInteraction(msg: Message, commandName: string) {
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

export function handlePrefixMessage(message: Message): void {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args[0]?.toLowerCase();

  if (!command || !COMMAND_MAP[command]) return;

  console.log(`[Prefix] ${message.author.tag}: ${message.content}`);

  COMMAND_MAP[command](message).catch((error) => {
    console.error(`[Prefix] Error:`, error);
    const ch = message.channel as TextChannel;
    ch.send('❌ Có lỗi xảy ra!').catch(() => {});
  });
}
