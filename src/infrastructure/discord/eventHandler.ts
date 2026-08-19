import { Client } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { DiscordEvent } from './types';

export async function loadEvents(client: Client) {
    const eventsPath = path.join(__dirname, 'events');
    
    if (!fs.existsSync(eventsPath)) {
        fs.mkdirSync(eventsPath, { recursive: true });
        console.log('[ECHO Handler] Created events directory.');
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        // Convert to file:// URL for ESM compatibility on Windows
        const eventModule = await import(pathToFileURL(filePath).href);
        const event: DiscordEvent<any> = eventModule.default;

        if (event && event.name && event.execute) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        } else {
            console.warn(`[ECHO Handler] WARNING: The event at ${filePath} is missing required properties.`);
        }
    }
    
    console.log(`[ECHO Handler] Successfully loaded ${eventFiles.length} events.`);
}
