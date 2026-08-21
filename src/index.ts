import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadEvents } from './infrastructure/discord/eventHandler';
import { loadCommands } from './infrastructure/discord/commandHandler';
import { bootstrapApp, getContainer } from './bootstrap';
import { notificationService } from './infrastructure/notification/NotificationService';

// Load environment variables from .env file
dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('Error: DISCORD_TOKEN is not defined in the .env file.');
    process.exit(1);
}

// Initialize the Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

// Load all Discord events dynamically before logging in
loadEvents(client);

// A simple error handler
process.on('unhandledRejection', (error) => {
    console.error('[ECHO Core] Unhandled promise rejection:', error);
});

// Bootstrap services then connect to Discord
bootstrapApp().then(() => {
    return client.login(token);
}).then(() => {
    // Set client for notifications (level-up DM, welcome DM, etc.)
    notificationService.setClient(client);
    // Set client for scheduler (auto-announce world state)
    const { schedulerService } = getContainer();
    schedulerService.setClient(client);
    loadCommands(client);
}).catch((error) => {
    console.error('[ECHO Core] Failed to start:', error);
    process.exit(1);
});

