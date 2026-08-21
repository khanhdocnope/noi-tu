// ============================================================
// ECHO — Command Sync Script
// Standalone script để đồng bộ slash commands với Discord API.
// Chạy: npm run sync
// ============================================================

import { REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import * as dotenv from 'dotenv';
import { Command } from '../infrastructure/discord/types';

// Load .env từ project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.guildId;

// ── Helpers ──────────────────────────────────────────────────

function log(msg: string) {
    console.log(`[SYNC] ${msg}`);
}

function error(msg: string) {
    console.error(`[SYNC ERROR] ${msg}`);
}

// ── Load Commands ────────────────────────────────────────────

async function loadCommandData(): Promise<any[]> {
    const commandsPath = path.join(__dirname, '../infrastructure/discord/commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    const commandData: any[] = [];

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const commandModule = await import(pathToFileURL(filePath).href);
        const command: Command = commandModule.default;

        if (command && 'data' in command && 'execute' in command) {
            commandData.push(command.data.toJSON());
            log(`Loaded: /${command.data.name}`);
        } else {
            log(`SKIPPED: ${file} (missing data/execute)`);
        }
    }

    return commandData;
}

// ── Clear Commands ───────────────────────────────────────────

async function clearGlobalCommands(rest: REST, appId: string) {
    log('Clearing GLOBAL commands...');
    await rest.put(Routes.applicationCommands(appId), { body: [] });
    log('Global commands cleared.');
}

async function clearGuildCommands(rest: REST, appId: string, guildId: string) {
    log(`Clearing GUILD commands for server ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
    log('Guild commands cleared.');
}

// ── Register Commands ────────────────────────────────────────

async function registerGuildCommands(rest: REST, appId: string, guildId: string, commands: any[]) {
    log(`Registering ${commands.length} commands to GUILD ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands });
    log('Guild commands registered.');
}

async function registerGlobalCommands(rest: REST, appId: string, commands: any[]) {
    log(`Registering ${commands.length} commands to GLOBAL...`);
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    log('Global commands registered.');
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
    log('=== ECHO Command Sync ===');
    log('');

    // Validate env
    if (!TOKEN) {
        error('DISCORD_TOKEN not found in .env');
        process.exit(1);
    }

    // Get App ID from Discord API
    log('Fetching application info...');
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    let appId: string;
    try {
        const appInfo = await rest.get(Routes.application()) as any;
        appId = appInfo.id;
        log(`App ID: ${appId}`);
    } catch (err) {
        error('Failed to fetch application info. Check your DISCORD_TOKEN.');
        process.exit(1);
    }

    // Load commands from codebase
    log('');
    log('Loading commands from codebase...');
    const commandData = await loadCommandData();
    log(`Loaded ${commandData.length} commands.`);
    log('');

    // Step 1: Clear ALL old commands (both scopes)
    log('--- Step 1: Clearing old commands ---');
    await clearGlobalCommands(rest, appId);
    if (GUILD_ID) {
        await clearGuildCommands(rest, appId, GUILD_ID);
    }
    log('');

    // Step 2: Register new commands
    log('--- Step 2: Registering current commands ---');
    if (GUILD_ID) {
        await registerGuildCommands(rest, appId, GUILD_ID, commandData);
        log(`✓ Guild commands synced to server: ${GUILD_ID}`);
    } else {
        await registerGlobalCommands(rest, appId, commandData);
        log('✓ Global commands synced.');
    }

    log('');
    log('=== Sync Complete ===');
    log('Note: Global commands may take up to 1 hour to propagate.');
    log('Guild commands are available immediately.');
}

main().catch(err => {
    error(err.message);
    process.exit(1);
});
