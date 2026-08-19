import { Events, Interaction } from 'discord.js';
import { DiscordEvent } from '../types';

const event: DiscordEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[ECHO Handler] No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
            // TODO: Dispatch a generic Action event to the Core logic here
            // Example: coreEventBus.emit('PlayerAction', { actor: interaction.user.id, action: interaction.commandName })
        } catch (error) {
            console.error('[ECHO Handler] Command execution error:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    },
};

export default event;
