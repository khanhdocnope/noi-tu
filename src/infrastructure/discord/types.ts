import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ClientEvents,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

export interface Command {
    // Allows both basic builders and ones with subcommands
    data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder | SlashCommandBuilder | any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface DiscordEvent<K extends keyof ClientEvents> {
    name: K;
    once?: boolean;
    execute: (...args: ClientEvents[K]) => Promise<void> | void;
}
