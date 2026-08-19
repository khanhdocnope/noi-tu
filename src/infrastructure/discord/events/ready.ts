import { Events, Client } from 'discord.js';
import { DiscordEvent } from '../types';

const event: DiscordEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.log(`[ECHO Core] Successfully logged in as ${client.user?.tag}`);
        console.log(`[ECHO Core] The world is now awake...`);
        
        // TODO: Initialize database connection here
        // TODO: Initialize cache here
        // TODO: Load Initial World State here
    },
};

export default event;
