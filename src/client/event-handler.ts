import { Events } from 'discord.js';
import type { BotClient } from './bot.js';
import * as shopCommand from '../commands/shop.js';
import * as profileCommand from '../commands/profile.js';
import * as sellCommand from '../commands/sell.js';
import * as marketCommand from '../commands/market.js';

export function loadEvents(client: BotClient, events: Array<{ name: string; once?: boolean; execute: (...args: any[]) => any }>): void {
  for (const event of events) {
    const handler = (...args: unknown[]) => {
      const result = event.execute(...args);
      if (result && typeof result.catch === 'function') {
        result.catch(console.error);
      }
    };

    if (event.once) {
      client.once(event.name as any, handler);
    } else {
      client.on(event.name as any, handler);
    }
  }

  console.log(`📡 Loaded ${events.length} events`);
}

export function createReadyEvent() {
  return {
    name: Events.ClientReady,
    once: true,
    execute(client: any) {
      console.log(`✅ Ready! Logged in as ${client.user?.tag}`);
    },
  };
}

export function createInteractionCreateEvent() {
  return {
    name: Events.InteractionCreate,
    execute(interaction: any) {
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

      if (interaction.isStringSelectMenu() && interaction.customId === 'sell_select') {
        sellCommand.handleSelect(interaction).catch(console.error);
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === 'market_select_item') {
        marketCommand.handleSelectItem(interaction).catch(console.error);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('market_modal_')) {
        marketCommand.handleModal(interaction).catch(console.error);
        return;
      }
    },
  };
}
