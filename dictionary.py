"""
dictionary.py
Quản lý kho từ vựng và kiểm tra tính hợp lệ của từ nối trong trò chơi Nối Từ.

Định dạng dữ liệu: mỗi dòng trong words.txt là một cụm 2 âm tiết,
ví dụ "con mèo", "mèo con", dùng để nối theo quy tắc:
    âm tiết cuối của từ trước == âm tiết đầu của từ sau
"""

import os
import unicodedata


def normalize(text: str) -> str:
    """
    Chuẩn hóa chuỗi tiếng Việt để so sánh:
    - Chuyển về chữ thường
    - Gộp nhiều khoảng trắng thành 1
    - Chuẩn hóa Unicode về dạng NFC (tránh lỗi do 2 cách biểu diễn dấu khác nhau)
    """
    text = unicodedata.normalize("NFC", text)
    text = text.strip().lower()
    text = " ".join(text.split())
    return text


class Dictionary:
    """
    Nạp và tra cứu kho từ vựng nối từ.
    """

    def __init__(self, path: str):
        self.path = path
        self.word_set: set[str] = set()          # tập hợp toàn bộ cụm từ hợp lệ, đã chuẩn hóa
        self.by_first_syllable: dict[str, list[str]] = {}  # âm đầu -> danh sách cụm từ bắt đầu bằng âm đó
        self._load()

    def _load(self):
        if not os.path.exists(self.path):
            raise FileNotFoundError(f"Không tìm thấy file từ vựng: {self.path}")

        by_first: dict[str, list[str]] = {}
        word_set: set[str] = set()

        with open(self.path, encoding="utf-8") as f:
            for line in f:
                phrase = normalize(line)
                if not phrase:
                    continue
                parts = phrase.split(" ")
                if len(parts) != 2:
                    # Bỏ qua các dòng không đúng định dạng 2 âm tiết
                    continue
                if phrase in word_set:
                    continue
                word_set.add(phrase)
                first = parts[0]
                by_first.setdefault(first, []).append(phrase)

        self.word_set = word_set
        self.by_first_syllable = by_first

    def exists(self, phrase: str) -> bool:
        """Kiểm tra cụm từ có tồn tại trong kho từ vựng không."""
        return normalize(phrase) in self.word_set

    def last_syllable(self, phrase: str) -> str:
        """Trả về âm tiết cuối cùng của một cụm từ đã chuẩn hóa."""
        parts = normalize(phrase).split(" ")
        return parts[-1]

    def first_syllable(self, phrase: str) -> str:
        """Trả về âm tiết đầu tiên của một cụm từ đã chuẩn hóa."""
        parts = normalize(phrase).split(" ")
        return parts[0]

    def is_two_syllable(self, phrase: str) -> bool:
        return len(normalize(phrase).split(" ")) == 2

    def suggestions(self, starting_syllable: str, exclude: set[str] | None = None, limit: int = 5) -> list[str]:
        """
        Gợi ý một vài từ có thể nối tiếp từ âm tiết cho trước.
        exclude: tập các cụm từ đã được dùng trong ván chơi (không gợi ý lại).
        """
        exclude = exclude or set()
        candidates = self.by_first_syllable.get(normalize(starting_syllable), [])
        result = [c for c in candidates if c not in exclude]
        return result[:limit]

    def __len__(self):
        return len(self.word_set)
