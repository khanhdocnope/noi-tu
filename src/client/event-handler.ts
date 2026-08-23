import { Events, type ClientEvents } from 'discord.js';
import type { BotClient } from './bot.js';
import * as shopCommand from '../commands/shop.js';
import * as profileCommand from '../commands/profile.js';

type EventName = keyof ClientEvents;

interface Event<K extends EventName = EventName> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
}

export function loadEvents(client: BotClient, events: Event[]): void {
  for (const event of events) {
    const handler = (...args: unknown[]) => {
      const result = (event.execute as (...a: unknown[]) => Promise<void> | void)(...args);
      if (result && typeof result.catch === 'function') {
        result.catch(console.error);
      }
    };

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
  }

  console.log(`📡 Loaded ${events.length} events`);
}

export function createReadyEvent(): Event<Events.ClientReady> {
  return {
    name: Events.ClientReady,
    once: true,
    execute(client) {
      console.log(`✅ Ready! Logged in as ${client.user?.tag}`);
    },
  };
}

export function createInteractionCreateEvent(): Event<Events.InteractionCreate> {
  return {
    name: Events.InteractionCreate,
    execute(interaction) {
      if (interaction.isChatInputCommand()) {
        const command = (interaction.client as BotClient).commands.get(interaction.commandName);
        if (!command) {
          console.warn(`Unknown command: ${interaction.commandName}`);
          return;
        }
        command.execute(interaction).catch(console.error);
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
        shopCommand.handleSelect(interaction).catch(console.error);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('shop_modal_')) {
        shopCommand.handleModal(interaction).catch(console.error);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('shop_')) {
        shopCommand.handleButton(interaction).catch(console.error);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('profile_')) {
        profileCommand.handleButton(interaction).catch(console.error);
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === 'profile_feed_select') {
        profileCommand.handleFeedSelect(interaction).catch(console.error);
        return;
      }
    },
  };
}
