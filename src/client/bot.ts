import { Client, GatewayIntentBits, Collection } from 'discord.js';
import type { Command } from './command-handler.js';
import { env } from '../config/env.js';

export interface BotClient extends Client {
  commands: Collection<string, Command>;
}

export function createBotClient(): BotClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  }) as BotClient;

  client.commands = new Collection();

  return client;
}

export async function startBot(): Promise<BotClient> {
  const client = createBotClient();
  await client.login(env.DISCORD_TOKEN);
  return client;
}
