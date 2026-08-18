"""
game.py
Quản lý trạng thái ván chơi Nối Từ cho từng kênh Discord.

Luật chơi:
1. Người chơi đầu tiên gõ một cụm 2 âm tiết bất kỳ có trong kho từ vựng.
2. Người chơi tiếp theo phải gõ một cụm 2 âm tiết mà ÂM ĐẦU trùng với
   ÂM CUỐI của cụm từ trước đó.
   Ví dụ: "con mèo" -> tiếp theo phải bắt đầu bằng "mèo", ví dụ "mèo con".
3. Từ đã dùng trong ván thì không được dùng lại.
4. Từ phải có trong kho từ vựng.
5. Nếu người chơi nhập sai luật, họ bị coi là thua lượt đó tại và ván có thể
   được reset hoặc tiếp tục tùy cấu hình (mặc định: thông báo lỗi, không thua ngay).
"""

from dataclasses import dataclass, field
from enum import Enum
from dictionary import Dictionary, normalize


class MoveResult(Enum):
    OK = "ok"
    NOT_TWO_SYLLABLE = "not_two_syllable"
    NOT_IN_DICTIONARY = "not_in_dictionary"
    WRONG_CONNECTION = "wrong_connection"
    ALREADY_USED = "already_used"


@dataclass
class MoveOutcome:
    result: MoveResult
    message: str
    accepted_word: str | None = None


@dataclass
class GameState:
    channel_id: int
    dictionary: Dictionary
    is_active: bool = False
    used_words: set[str] = field(default_factory=set)
    last_word: str | None = None
    last_player_id: int | None = None
    history: list[tuple[str, int]] = field(default_factory=list)  # (word, player_id)

    def start(self, starter_word: str | None, player_id: int | None) -> MoveOutcome:
        """
        Bắt đầu ván chơi mới. Nếu starter_word được cung cấp, kiểm tra hợp lệ và
        dùng luôn làm từ đầu tiên. Nếu không, chỉ khởi tạo trạng thái trống.
        """
        self.is_active = True
        self.used_words = set()
        self.last_word = None
        self.last_player_id = None
        self.history = []

        if starter_word is None:
            return MoveOutcome(MoveResult.OK, "Ván chơi mới bắt đầu! Ai đó hãy gõ từ đầu tiên (2 âm tiết).")

        return self.submit_word(starter_word, player_id)

    def stop(self):
        self.is_active = False

    def submit_word(self, raw_word: str, player_id: int | None) -> MoveOutcome:
        """
        Xử lý một lượt đi. Trả về MoveOutcome mô tả kết quả.
        """
        word = normalize(raw_word)

        if not self.dictionary.is_two_syllable(word):
            return MoveOutcome(
                MoveResult.NOT_TWO_SYLLABLE,
                f'"{raw_word}" không phải là cụm 2 âm tiết hợp lệ.',
            )

        if not self.dictionary.exists(word):
            return MoveOutcome(
                MoveResult.NOT_IN_DICTIONARY,
                f'"{raw_word}" không có trong kho từ vựng.',
            )

        if word in self.used_words:
            return MoveOutcome(
                MoveResult.ALREADY_USED,
                f'"{raw_word}" đã được dùng trong ván này rồi.',
            )

        if self.last_word is not None:
            expected_first = self.dictionary.last_syllable(self.last_word)
            actual_first = self.dictionary.first_syllable(word)
            if expected_first != actual_first:
                return MoveOutcome(
                    MoveResult.WRONG_CONNECTION,
                    f'"{raw_word}" không nối được với "{self.last_word}". '
                    f'Từ tiếp theo phải bắt đầu bằng "{expected_first}".',
                )

        # Hợp lệ: cập nhật trạng thái
        self.used_words.add(word)
        self.last_word = word
        self.last_player_id = player_id
        self.history.append((word, player_id))

        return MoveOutcome(MoveResult.OK, f'Chấp nhận "{raw_word}"!', accepted_word=word)


class GameManager:
    """Quản lý nhiều GameState, mỗi kênh Discord một ván riêng."""

    def __init__(self, dictionary: Dictionary):
        self.dictionary = dictionary
        self.games: dict[int, GameState] = {}

    def get_or_create(self, channel_id: int) -> GameState:
        if channel_id not in self.games:
            self.games[channel_id] = GameState(channel_id=channel_id, dictionary=self.dictionary)
        return self.games[channel_id]
