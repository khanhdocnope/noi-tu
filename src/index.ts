import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadEvents } from './infrastructure/discord/eventHandler';
import { loadCommands } from './infrastructure/discord/commandHandler';
import { bootstrapApp } from './bootstrap';

// Load environment variables from .env file
dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('Error: DISCORD_TOKEN is not defined in the .env file.');
    process.exit(1);
}

// Khởi tạo tất cả services (WorldState, v.v.) trước khi connect Discord
bootstrapApp();

// Initialize the Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Load all Discord events dynamically before logging in
loadEvents(client);

// A simple error handler
process.on('unhandledRejection', (error) => {
    console.error('[ECHO Core] Unhandled promise rejection:', error);
});

// Connect to the Discord Gateway
client.login(token).then(() => {
    loadCommands(client);
});

