import express from 'express';
import path from 'path';
import { startBot } from './client/bot.js';
import { loadCommands } from './client/command-handler.js';
import { loadEvents, createReadyEvent, createInteractionCreateEvent } from './client/event-handler.js';
import * as startCommand from './commands/start.js';
import * as profileCommand from './commands/profile.js';
import { cookieParser } from './web/cookie-parser.js';
import { authMiddleware, handleLogin, handleLoginPage } from './web/auth.js';
import { petsRouter } from './web/routes/pets.js';
import { speciesRouter } from './web/routes/species.js';
import { usersRouter } from './web/routes/users.js';
import { uploadRouter } from './web/routes/upload.js';

const app = express();

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

app.use('/admin', authMiddleware, express.static(path.join(import.meta.dirname, 'web', 'public')));
app.use('/api', authMiddleware);

app.use('/api/pets', petsRouter);
app.use('/api/species', speciesRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);

app.get('/admin', authMiddleware, (_req, res) => {
  res.sendFile(path.join(import.meta.dirname, 'web', 'public', 'index.html'));
});

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`🌐 HTTP server running on port ${PORT}`);
});

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
