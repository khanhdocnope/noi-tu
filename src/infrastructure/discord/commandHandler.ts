import { Client, Collection, REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
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
        const commandModule = await import(filePath);
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
            console.log(`[ECHO Handler] Started refreshing ${commandData.length} application (/) commands.`);
            
            const guildId = process.env.guildId;
            if (guildId) {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guildId),
                    { body: commandData },
                );
                console.log(`[ECHO Handler] Successfully reloaded guild commands for Server ID: ${guildId}.`);
            } else {
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commandData },
                );
                console.log(`[ECHO Handler] Successfully reloaded global commands.`);
            }
        } catch (error) {
            console.error('[ECHO Handler] Error registering commands:', error);
        }
    }
}
