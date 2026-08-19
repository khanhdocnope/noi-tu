import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadEvents } from './infrastructure/discord/eventHandler';
import { loadCommands } from './infrastructure/discord/commandHandler';

// Load environment variables from .env file
dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('Error: DISCORD_TOKEN is not defined in the .env file.');
    process.exit(1);
}

// Initialize the Discord Client
// We only request the intents we strictly need for the MVP based on ECHO specification
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Required to receive guild events and manage server world
        GatewayIntentBits.GuildMessages,    // Required to receive messages
        GatewayIntentBits.MessageContent,   // Required to read message contents (if not solely relying on Slash Commands)
    ],
});

// Load all Discord events dynamically before logging in
loadEvents(client);

// A simple error handler so the bot process doesn't crash completely on unhandled errors
process.on('unhandledRejection', (error) => {
    console.error('[ECHO Core] Unhandled promise rejection:', error);
});

// Connect to the Discord Gateway
client.login(token).then(() => {
    // After successful login, load and register commands
    loadCommands(client);
});
