import { REST, Routes, type ChatInputCommandInteraction, type SlashCommandBuilder } from 'discord.js';
import { env } from '../config/env.js';
import type { BotClient } from './bot.js';

export interface Command {
  data: {
    name: string;
    toJSON(): any;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export async function loadCommands(client: BotClient, commands: Command[]): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  console.log(`📋 Loaded ${commands.length} commands`);

  try {
    console.log('🔄 Refreshing slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
      { body: commands.map((cmd) => cmd.data) }
    );

    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
}
