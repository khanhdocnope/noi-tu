import { startBot } from './client/bot.js';
import { loadCommands } from './client/command-handler.js';
import { loadEvents, createReadyEvent, createInteractionCreateEvent } from './client/event-handler.js';
import * as startCommand from './commands/start.js';
import * as profileCommand from './commands/profile.js';

async function main(): Promise<void> {
  console.log('🚀 Starting bot...');

  const client = await startBot();

  loadCommands(client, [startCommand, profileCommand]);

  loadEvents(client, [createReadyEvent(), createInteractionCreateEvent()]);

  console.log('✅ Bot is running!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
