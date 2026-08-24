import express from 'express';
import path from 'path';
import { startBot } from './client/bot.js';
import { loadCommands } from './client/command-handler.js';
import { loadEvents, createReadyEvent, createInteractionCreateEvent, createMessageEvent } from './client/event-handler.js';
import * as startCommand from './commands/start.js';
import * as profileCommand from './commands/profile.js';
import * as dailyCommand from './commands/daily.js';
import * as feedCommand from './commands/feed.js';
import * as playCommand from './commands/play.js';
import * as restCommand from './commands/rest.js';
import * as huntCommand from './commands/hunt.js';
import * as shopCommand from './commands/shop.js';
import * as buyCommand from './commands/buy.js';
import * as inventoryCommand from './commands/inventory.js';
import * as sellCommand from './commands/sell.js';
import * as marketCommand from './commands/market.js';
import * as rollCommand from './commands/roll.js';
import { cookieParser } from './web/cookie-parser.js';
import { authMiddleware, handleLogin, handleLoginPage } from './web/auth.js';
import { petsRouter } from './web/routes/pets.js';
import { speciesRouter } from './web/routes/species.js';
import { usersRouter } from './web/routes/users.js';
import { uploadRouter } from './web/routes/upload.js';

const app = express();
const WEB_DIR = path.join(process.cwd(), 'dist', 'web', 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser);

app.get('/', (_req, res) => {
  res.send('🐾 Bot is running!');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/login', handleLoginPage);
app.post('/login', handleLogin);

app.use('/admin', authMiddleware, express.static(WEB_DIR));
app.use('/api', authMiddleware);

app.use('/api/pets', petsRouter);
app.use('/api/species', speciesRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);

app.get('/admin', authMiddleware, (_req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`🌐 HTTP server running on port ${PORT}`);
});

async function main(): Promise<void> {
  console.log('🚀 Starting bot...');

  const client = await startBot();

  loadCommands(client, [startCommand, profileCommand, dailyCommand, feedCommand, playCommand, restCommand, huntCommand, shopCommand, buyCommand, inventoryCommand, sellCommand, marketCommand, rollCommand]);

  loadEvents(client, [createReadyEvent(), createInteractionCreateEvent(), createMessageEvent()]);

  console.log('✅ Bot is running!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
