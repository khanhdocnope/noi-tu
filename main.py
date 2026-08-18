"""
main.py
Discord Bot "Ram" - Trọng tài trò chơi Nối Từ Tiếng Việt.

Bot KHÔNG tự chơi, chỉ đóng vai trò trọng tài: kiểm tra tính hợp lệ của
từ người chơi gửi, thông báo kết quả, và phát hiện khi ván chơi kết thúc
(hết từ để nối -> người vừa đi thắng).

Luật chơi:
    1. Từ phải là cụm đúng 2 tiếng (2 âm tiết), có trong TuVung.txt.
    2. Tiếng đầu của từ mới phải trùng với tiếng cuối của current_word.
    3. Từ đã dùng trong ván (used_words) không được dùng lại.
    4. Nếu tiếng cuối của từ vừa được chấp nhận không còn từ nào khác để nối
       (count_next_words == 0), người vừa gửi từ đó thắng, ván được reset.

Chạy:
    pip install -r requirements.txt
    tạo file .env với DISCORD_BOT_TOKEN=...
    python main.py
"""

import os
import logging
import unicodedata

import discord
from dotenv import load_dotenv

# ----------------------------------------------------------------------------
# Cấu hình & khởi tạo
# ----------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ram_bot")

TOKEN = os.getenv("DISCORD_BOT_TOKEN")
WORDS_FILE = os.getenv("WORDS_FILE", "TuVung.txt")
BOT_NAME = "Ram"

if not TOKEN:
    raise SystemExit(
        "Thiếu DISCORD_BOT_TOKEN. Hãy tạo file .env với dòng:\n"
        "DISCORD_BOT_TOKEN=your_token_here"
    )


# ----------------------------------------------------------------------------
# Chuẩn hóa & nạp từ điển
# ----------------------------------------------------------------------------

def normalize(text: str) -> str:
    """Chuẩn hóa chuỗi tiếng Việt: NFC, chữ thường, gộp khoảng trắng thừa."""
    text = unicodedata.normalize("NFC", text)
    text = text.strip().lower()
    text = " ".join(text.split())
    return text


def load_dictionary(path: str) -> tuple[set[str], dict[str, list[str]]]:
    """
    Đọc TuVung.txt và trả về:
        - word_set: tập hợp toàn bộ cụm từ 2 tiếng hợp lệ (đã chuẩn hóa)
        - by_first: dict âm đầu -> danh sách cụm từ bắt đầu bằng âm đó

    Ném lỗi rõ ràng nếu file không tồn tại hoặc rỗng.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Không tìm thấy file từ điển '{path}'. "
            f"Hãy đặt file TuVung.txt cùng thư mục với main.py."
        )

    word_set: set[str] = set()
    by_first: dict[str, list[str]] = {}

    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                phrase = normalize(line)
                if not phrase:
                    continue
                parts = phrase.split(" ")
                if len(parts) != 2:
                    continue  # bỏ qua dòng không đúng định dạng 2 tiếng
                if phrase in word_set:
                    continue
                word_set.add(phrase)
                by_first.setdefault(parts[0], []).append(phrase)
    except UnicodeDecodeError as e:
        raise RuntimeError(
            f"Lỗi đọc file '{path}': file phải ở định dạng UTF-8. Chi tiết: {e}"
        )

    if not word_set:
        raise RuntimeError(f"File từ điển '{path}' không có từ hợp lệ nào (rỗng hoặc sai định dạng).")

    return word_set, by_first


try:
    WORD_SET, BY_FIRST = load_dictionary(WORDS_FILE)
    logger.info(f"Đã nạp {len(WORD_SET)} từ từ '{WORDS_FILE}'.")
except (FileNotFoundError, RuntimeError) as e:
    raise SystemExit(f"Không thể khởi động bot: {e}")


# ----------------------------------------------------------------------------
# Trạng thái ván chơi (theo từng kênh)
# ----------------------------------------------------------------------------

class GameState:
    def __init__(self):
        self.current_word: str | None = None
        self.used_words: set[str] = set()

    def reset(self):
        self.current_word = None
        self.used_words = set()


# channel_id -> GameState
games: dict[int, GameState] = {}


def get_game(channel_id: int) -> GameState:
    if channel_id not in games:
        games[channel_id] = GameState()
    return games[channel_id]


def last_syllable(phrase: str) -> str:
    return phrase.split(" ")[-1]


def first_syllable(phrase: str) -> str:
    return phrase.split(" ")[0]


def count_next_words(last_syl: str, used_words: set[str]) -> int:
    """
    Đếm số từ trong từ điển bắt đầu bằng `last_syl` mà CHƯA nằm trong used_words.
    """
    candidates = BY_FIRST.get(last_syl, [])
    return sum(1 for c in candidates if c not in used_words)


# ----------------------------------------------------------------------------
# Discord client
# ----------------------------------------------------------------------------

intents = discord.Intents.default()
intents.message_content = True  # Bắt buộc bật "MESSAGE CONTENT INTENT" trong Developer Portal

client = discord.Client(intents=intents)


@client.event
async def on_ready():
    logger.info(f"Đăng nhập thành công: {client.user} (id={client.user.id})")


@client.event
async def on_message(message: discord.Message):
    # Bỏ qua tin nhắn từ bot khác (kể cả chính mình)
    if message.author.bot:
        return

    raw_content = message.content
    content = normalize(raw_content)

    if not content:
        return

    parts = content.split(" ")
    # Chỉ xử lý tin nhắn đúng 2 tiếng, các tin nhắn khác bỏ qua hoàn toàn (không phản hồi)
    if len(parts) != 2:
        return

    game = get_game(message.channel.id)

    # --- Kịch bản A: Từ đầu tiên của ván ---
    if game.current_word is None:
        if content not in WORD_SET:
            # Chưa có ván nào đang chạy và từ không hợp lệ -> im lặng, không phải là lỗi trong ván
            return

        game.current_word = content
        game.used_words.add(content)
        await message.add_reaction("✅")

        # Kiểm tra luôn khả năng ngõ cụt ngay từ từ đầu tiên
        next_syl = last_syllable(content)
        remaining = count_next_words(next_syl, game.used_words)
        if remaining == 0:
            await message.reply(
                f'Từ **{content}** là từ cuối cùng! {message.author.mention} đã chiến thắng! '
                f'Trò chơi đã được reset.'
            )
            game.reset()
        return

    # Từ đây trở đi: ván đang chạy, current_word đã có giá trị
    expected_first = last_syllable(game.current_word)

    # --- Kịch bản D: Không có trong từ điển ---
    if content not in WORD_SET:
        remaining = count_next_words(expected_first, game.used_words)
        await message.add_reaction("❌")
        await message.reply(
            f'Từ "{raw_content.strip()}" không có trong từ điển.\n'
            f'Từ hiện tại: **{game.current_word}**\n'
            f'Các từ còn có thể nối: **{remaining}**'
        )
        return

    # --- Kịch bản C: Từ đã sử dụng ---
    if content in game.used_words:
        remaining = count_next_words(expected_first, game.used_words)
        await message.add_reaction("❌")
        await message.reply(
            f'Từ "{raw_content.strip()}" đã được sử dụng trước đó.\n'
            f'Từ hiện tại: **{game.current_word}**\n'
            f'Các từ còn có thể nối: **{remaining}**'
        )
        return

    # --- Kịch bản B: Sai tiếng nối ---
    actual_first = first_syllable(content)
    if actual_first != expected_first:
        remaining = count_next_words(expected_first, game.used_words)
        await message.add_reaction("❌")
        await message.reply(
            f'Sai rồi! Từ của bạn phải bắt đầu bằng **{expected_first.upper()}**.\n'
            f'Từ hiện tại: **{game.current_word}**\n'
            f'Các từ còn có thể nối: **{remaining}**'
        )
        return

    # --- Hợp lệ: cập nhật trạng thái ---
    game.current_word = content
    game.used_words.add(content)

    next_syl = last_syllable(content)
    remaining = count_next_words(next_syl, game.used_words)

    # --- Kịch bản F: Chiến thắng (ngõ cụt) ---
    if remaining == 0:
        await message.add_reaction("✅")
        await message.reply(
            f'Từ **{content}** là từ cuối cùng! {message.author.mention} đã chiến thắng! '
            f'Trò chơi đã được reset.'
        )
        game.reset()
        return

    # --- Kịch bản E: Chấp nhận, chơi tiếp ---
    await message.add_reaction("✅")


if __name__ == "__main__":
    client.run(TOKEN)