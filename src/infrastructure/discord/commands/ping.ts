import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra kết nối của hệ thống ECHO.'),
        
    async execute(interaction: ChatInputCommandInteraction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        
        await interaction.editReply(`Pong! 🏓\nĐộ trễ (Latency): ${latency}ms\nWebSocket: ${interaction.client.ws.ping}ms`);
    },
};

export default command;
