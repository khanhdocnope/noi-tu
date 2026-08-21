import { Client, Collection, REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { Command } from './types';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>;
    }
}

export async function loadCommands(client: Client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
        console.log('[ECHO Handler] Created commands directory.');
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    const commandData = [];

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        // Convert to file:// URL for ESM compatibility on Windows
        const commandModule = await import(pathToFileURL(filePath).href);
        const command: Command = commandModule.default;

        if (command && 'data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandData.push(command.data.toJSON());
        } else {
            console.warn(`[ECHO Handler] WARNING: The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    if (process.env.DISCORD_TOKEN && client.user) {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        try {
            const appId = client.user.id;
            const guildId = process.env.guildId;

            // Step 1: Clear ALL old commands (both scopes)
            console.log('[ECHO Handler] Clearing old commands...');
            await rest.put(Routes.applicationCommands(appId), { body: [] });
            if (guildId) {
                await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
            }

            // Step 2: Register current commands
            console.log(`[ECHO Handler] Registering ${commandData.length} commands...`);
            if (guildId) {
                await rest.put(
                    Routes.applicationGuildCommands(appId, guildId),
                    { body: commandData },
                );
                console.log(`[ECHO Handler] Guild commands synced to: ${guildId}`);
            } else {
                await rest.put(
                    Routes.applicationCommands(appId),
                    { body: commandData },
                );
                console.log('[ECHO Handler] Global commands synced.');
            }
        } catch (error) {
            console.error('[ECHO Handler] Error syncing commands:', error);
        }
    }
}
