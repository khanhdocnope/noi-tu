"""
bot.py
Bot Discord chính chủ (dùng bot token hợp pháp qua Discord Developer Portal)
chơi trò Nối Từ tiếng Việt.

Cách chạy:
    1. pip install -r requirements.txt
    2. Tạo file .env với dòng: DISCORD_BOT_TOKEN=your_token_here
    3. python bot.py

Lệnh:
    /noitu_batdau         - Bắt đầu ván chơi mới trong kênh hiện tại
    /noitu_ketthuc        - Kết thúc ván chơi hiện tại
    /noitu_trangthai      - Xem từ cuối cùng và số từ đã dùng
    /noitu_tra <tu>       - Tra cứu 1 từ có trong kho từ vựng hay không

Chơi bình thường: sau khi /noitu_batdau, chỉ cần gõ tin nhắn thường trong
kênh đó, bot sẽ tự động kiểm tra và phản hồi.
"""

import os
import logging

import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

from dictionary import Dictionary
from game import GameManager, MoveResult

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("noitu_bot")

TOKEN = os.getenv("DISCORD_BOT_TOKEN")
WORDS_FILE = os.getenv("WORDS_FILE", "words.txt")

if not TOKEN:
    raise SystemExit(
        "Thiếu DISCORD_BOT_TOKEN. Hãy tạo file .env với dòng:\n"
        "DISCORD_BOT_TOKEN=your_token_here"
    )

dictionary = Dictionary(WORDS_FILE)
logger.info(f"Đã nạp {len(dictionary)} cụm từ vào kho từ vựng.")
game_manager = GameManager(dictionary)

intents = discord.Intents.default()
intents.message_content = True  # Cần bật "MESSAGE CONTENT INTENT" trong Developer Portal

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    logger.info(f"Đăng nhập thành công: {bot.user} (id={bot.user.id})")
    try:
        synced = await bot.tree.sync()
        logger.info(f"Đã đồng bộ {len(synced)} slash command(s).")
    except Exception as e:
        logger.exception(f"Lỗi khi đồng bộ slash commands: {e}")


@bot.tree.command(name="noitu_batdau", description="Bắt đầu ván chơi Nối Từ mới trong kênh này")
@app_commands.describe(tu_dau="Từ đầu tiên (tùy chọn, 2 âm tiết)")
async def noitu_batdau(interaction: discord.Interaction, tu_dau: str | None = None):
    game = game_manager.get_or_create(interaction.channel_id)

    if game.is_active:
        await interaction.response.send_message(
            "Đã có ván chơi đang diễn ra trong kênh này. Dùng `/noitu_ketthuc` để kết thúc trước."
        )
        return

    outcome = game.start(tu_dau, interaction.user.id if tu_dau else None)

    if tu_dau is None:
        await interaction.response.send_message(outcome.message)
        return

    if outcome.result == MoveResult.OK:
        await interaction.response.send_message(
            f"🎮 Ván chơi bắt đầu! {interaction.user.mention} mở màn bằng **{outcome.accepted_word}**.\n"
            f"Từ tiếp theo phải bắt đầu bằng: **{dictionary.last_syllable(outcome.accepted_word)}**"
        )
    else:
        game.is_active = False
        await interaction.response.send_message(f"❌ {outcome.message} Hãy thử `/noitu_batdau` lại.")


@bot.tree.command(name="noitu_ketthuc", description="Kết thúc ván chơi Nối Từ hiện tại")
async def noitu_ketthuc(interaction: discord.Interaction):
    game = game_manager.get_or_create(interaction.channel_id)
    if not game.is_active:
        await interaction.response.send_message("Hiện không có ván chơi nào đang diễn ra.")
        return

    total = len(game.used_words)
    game.stop()
    await interaction.response.send_message(
        f"🏁 Ván chơi kết thúc. Tổng cộng đã dùng **{total}** từ."
    )


@bot.tree.command(name="noitu_trangthai", description="Xem trạng thái ván chơi hiện tại")
async def noitu_trangthai(interaction: discord.Interaction):
    game = game_manager.get_or_create(interaction.channel_id)
    if not game.is_active:
        await interaction.response.send_message("Hiện không có ván chơi nào đang diễn ra.")
        return

    if game.last_word is None:
        await interaction.response.send_message("Ván chơi đã bắt đầu, đang chờ từ đầu tiên.")
        return

    await interaction.response.send_message(
        f"Từ cuối cùng: **{game.last_word}** (bởi <@{game.last_player_id}>)\n"
        f"Từ tiếp theo phải bắt đầu bằng: **{dictionary.last_syllable(game.last_word)}**\n"
        f"Số từ đã dùng: {len(game.used_words)}"
    )


@bot.tree.command(name="noitu_tra", description="Tra cứu một từ có trong kho từ vựng hay không")
@app_commands.describe(tu="Cụm từ cần tra (2 âm tiết)")
async def noitu_tra(interaction: discord.Interaction, tu: str):
    exists = dictionary.exists(tu)
    if exists:
        await interaction.response.send_message(f'✅ "{tu}" có trong kho từ vựng.')
    else:
        await interaction.response.send_message(f'❌ "{tu}" không có trong kho từ vựng.')


@bot.event
async def on_message(message: discord.Message):
    # Không xử lý tin nhắn của chính bot
    if message.author.bot:
        return

    # Vẫn cho phép các lệnh prefix (!) hoạt động nếu có
    await bot.process_commands(message)

    channel_id = message.channel.id
    if channel_id not in game_manager.games:
        return

    game = game_manager.games[channel_id]
    if not game.is_active:
        return

    content = message.content.strip()
    if not content:
        return

    # Bỏ qua nếu không phải cụm 2 âm tiết -- tránh bot phản hồi mọi tin nhắn chat thường
    if len(content.split()) != 2:
        return

    outcome = game.submit_word(content, message.author.id)

    if outcome.result == MoveResult.OK:
        next_syllable = dictionary.last_syllable(outcome.accepted_word)
        await message.add_reaction("✅")
        await message.channel.send(f"Từ tiếp theo phải bắt đầu bằng: **{next_syllable}**")
    else:
        await message.add_reaction("❌")
        await message.channel.send(outcome.message)


if __name__ == "__main__":
    bot.run(TOKEN)
