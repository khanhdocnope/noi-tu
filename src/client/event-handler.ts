import { Events, type ClientEvents } from 'discord.js';
import type { BotClient } from './bot.js';

type EventName = keyof ClientEvents;

interface Event<K extends EventName = EventName> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void>;
}

export function loadEvents(client: BotClient, events: Event[]): void {
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => {
        (event.execute as (...a: unknown[]) => Promise<void>)(...args).catch(console.error);
      });
    } else {
      client.on(event.name, (...args) => {
        (event.execute as (...a: unknown[]) => Promise<void>)(...args).catch(console.error);
      });
    }
  }

  console.log(`📡 Loaded ${events.length} events`);
}

export function createReadyEvent(): Event<Events.ClientReady> {
  return {
    name: Events.ClientReady,
    once: true,
    execute(client) {
      console.log(`✅ Ready! Logged in as ${client.user.tag}`);
    },
  };
}

export function createInteractionCreateEvent(): Event<Events.InteractionCreate> {
  return {
    name: Events.InteractionCreate,
    execute(interaction) {
      if (!interaction.isChatInputCommand()) return;

      const command = (interaction.client as BotClient).commands.get(interaction.commandName);
      if (!command) {
        console.warn(`Unknown command: ${interaction.commandName}`);
        return;
      }

      command.execute(interaction).catch(console.error);
    },
  };
}
