"""Canonical Bible book metadata and name normalization."""

from __future__ import annotations

import difflib
import re
from dataclasses import dataclass

ROMAN_TO_INT = {
    "i": 1,
    "ii": 2,
    "iii": 3,
    "iv": 4,
    "v": 5,
    "vi": 6,
    "vii": 7,
    "viii": 8,
    "ix": 9,
    "x": 10,
    "xi": 11,
    "xii": 12,
    "xiii": 13,
    "xiv": 14,
    "xv": 15,
    "xvi": 16,
    "xvii": 17,
    "xviii": 18,
    "xix": 19,
    "xx": 20,
    "xxi": 21,
    "xxii": 22,
}


@dataclass(frozen=True)
class Book:
    id: int
    name: str
    testament: str
    chapter_count: int
    bolls_id: int


BOOKS: list[Book] = [
    Book(1, "Genesis", "OT", 50, 1),
    Book(2, "Exodus", "OT", 40, 2),
    Book(3, "Leviticus", "OT", 27, 3),
    Book(4, "Numbers", "OT", 36, 4),
    Book(5, "Deuteronomy", "OT", 34, 5),
    Book(6, "Joshua", "OT", 24, 6),
    Book(7, "Judges", "OT", 21, 7),
    Book(8, "Ruth", "OT", 4, 8),
    Book(9, "1 Samuel", "OT", 31, 9),
    Book(10, "2 Samuel", "OT", 24, 10),
    Book(11, "1 Kings", "OT", 22, 11),
    Book(12, "2 Kings", "OT", 25, 12),
    Book(13, "1 Chronicles", "OT", 29, 13),
    Book(14, "2 Chronicles", "OT", 36, 14),
    Book(15, "Ezra", "OT", 10, 15),
    Book(16, "Nehemiah", "OT", 13, 16),
    Book(17, "Esther", "OT", 10, 17),
    Book(18, "Job", "OT", 42, 18),
    Book(19, "Psalms", "OT", 150, 19),
    Book(20, "Proverbs", "OT", 31, 20),
    Book(21, "Ecclesiastes", "OT", 12, 21),
    Book(22, "Song of Solomon", "OT", 8, 22),
    Book(23, "Isaiah", "OT", 66, 23),
    Book(24, "Jeremiah", "OT", 52, 24),
    Book(25, "Lamentations", "OT", 5, 25),
    Book(26, "Ezekiel", "OT", 48, 26),
    Book(27, "Daniel", "OT", 12, 27),
    Book(28, "Hosea", "OT", 14, 28),
    Book(29, "Joel", "OT", 3, 29),
    Book(30, "Amos", "OT", 9, 30),
    Book(31, "Obadiah", "OT", 1, 31),
    Book(32, "Jonah", "OT", 4, 32),
    Book(33, "Micah", "OT", 7, 33),
    Book(34, "Nahum", "OT", 3, 34),
    Book(35, "Habakkuk", "OT", 3, 35),
    Book(36, "Zephaniah", "OT", 3, 36),
    Book(37, "Haggai", "OT", 2, 37),
    Book(38, "Zechariah", "OT", 14, 38),
    Book(39, "Malachi", "OT", 4, 39),
    Book(40, "Matthew", "NT", 28, 40),
    Book(41, "Mark", "NT", 16, 41),
    Book(42, "Luke", "NT", 24, 42),
    Book(43, "John", "NT", 21, 43),
    Book(44, "Acts", "NT", 28, 44),
    Book(45, "Romans", "NT", 16, 45),
    Book(46, "1 Corinthians", "NT", 16, 46),
    Book(47, "2 Corinthians", "NT", 13, 47),
    Book(48, "Galatians", "NT", 6, 48),
    Book(49, "Ephesians", "NT", 6, 49),
    Book(50, "Philippians", "NT", 4, 50),
    Book(51, "Colossians", "NT", 4, 51),
    Book(52, "1 Thessalonians", "NT", 5, 52),
    Book(53, "2 Thessalonians", "NT", 3, 53),
    Book(54, "1 Timothy", "NT", 6, 54),
    Book(55, "2 Timothy", "NT", 4, 55),
    Book(56, "Titus", "NT", 3, 56),
    Book(57, "Philemon", "NT", 1, 57),
    Book(58, "Hebrews", "NT", 13, 58),
    Book(59, "James", "NT", 5, 59),
    Book(60, "1 Peter", "NT", 5, 60),
    Book(61, "2 Peter", "NT", 3, 61),
    Book(62, "1 John", "NT", 5, 62),
    Book(63, "2 John", "NT", 1, 63),
    Book(64, "3 John", "NT", 1, 64),
    Book(65, "Jude", "NT", 1, 65),
    Book(66, "Revelation", "NT", 22, 66),
]

BOOK_BY_BOLLS_ID = {book.bolls_id: book for book in BOOKS}
BOOK_BY_NAME = {book.name.lower(): book.name for book in BOOKS}

ABBREVIATIONS = {
    "gen": "Genesis",
    "ge": "Genesis",
    "gn": "Genesis",
    "exo": "Exodus",
    "ex": "Exodus",
    "lev": "Leviticus",
    "le": "Leviticus",
    "num": "Numbers",
    "nu": "Numbers",
    "deut": "Deuteronomy",
    "dt": "Deuteronomy",
    "josh": "Joshua",
    "jos": "Joshua",
    "judg": "Judges",
    "jdg": "Judges",
    "ru": "Ruth",
    "ruth": "Ruth",
    "1sam": "1 Samuel",
    "1sa": "1 Samuel",
    "2sam": "2 Samuel",
    "2sa": "2 Samuel",
    "1ki": "1 Kings",
    "1kgs": "1 Kings",
    "2ki": "2 Kings",
    "2kgs": "2 Kings",
    "1chr": "1 Chronicles",
    "1ch": "1 Chronicles",
    "2chr": "2 Chronicles",
    "2ch": "2 Chronicles",
    "ezr": "Ezra",
    "neh": "Nehemiah",
    "ne": "Nehemiah",
    "est": "Esther",
    "es": "Esther",
    "job": "Job",
    "ps": "Psalms",
    "psa": "Psalms",
    "psalm": "Psalms",
    "prov": "Proverbs",
    "pr": "Proverbs",
    "eccl": "Ecclesiastes",
    "ecc": "Ecclesiastes",
    "song": "Song of Solomon",
    "sos": "Song of Solomon",
    "songofsongs": "Song of Solomon",
    "songofsolomon": "Song of Solomon",
    "isa": "Isaiah",
    "is": "Isaiah",
    "jer": "Jeremiah",
    "lam": "Lamentations",
    "eze": "Ezekiel",
    "ezk": "Ezekiel",
    "dan": "Daniel",
    "da": "Daniel",
    "hos": "Hosea",
    "ho": "Hosea",
    "joe": "Joel",
    "jl": "Joel",
    "amo": "Amos",
    "am": "Amos",
    "oba": "Obadiah",
    "ob": "Obadiah",
    "jon": "Jonah",
    "jnh": "Jonah",
    "mic": "Micah",
    "nah": "Nahum",
    "na": "Nahum",
    "hab": "Habakkuk",
    "zep": "Zephaniah",
    "zec": "Zechariah",
    "mal": "Malachi",
    "matt": "Matthew",
    "mt": "Matthew",
    "mar": "Mark",
    "mk": "Mark",
    "luk": "Luke",
    "lk": "Luke",
    "joh": "John",
    "jn": "John",
    "act": "Acts",
    "ac": "Acts",
    "rom": "Romans",
    "ro": "Romans",
    "1cor": "1 Corinthians",
    "1co": "1 Corinthians",
    "2cor": "2 Corinthians",
    "2co": "2 Corinthians",
    "gal": "Galatians",
    "ga": "Galatians",
    "eph": "Ephesians",
    "ep": "Ephesians",
    "phil": "Philippians",
    "php": "Philippians",
    "col": "Colossians",
    "co": "Colossians",
    "1thess": "1 Thessalonians",
    "1th": "1 Thessalonians",
    "2thess": "2 Thessalonians",
    "2th": "2 Thessalonians",
    "1tim": "1 Timothy",
    "1ti": "1 Timothy",
    "2tim": "2 Timothy",
    "2ti": "2 Timothy",
    "tit": "Titus",
    "phm": "Philemon",
    "philem": "Philemon",
    "heb": "Hebrews",
    "he": "Hebrews",
    "jas": "James",
    "jam": "James",
    "1pet": "1 Peter",
    "1pe": "1 Peter",
    "2pet": "2 Peter",
    "2pe": "2 Peter",
    "1jn": "1 John",
    "1jo": "1 John",
    "2jn": "2 John",
    "2jo": "2 John",
    "3jn": "3 John",
    "3jo": "3 John",
    "jud": "Jude",
    "rev": "Revelation",
    "re": "Revelation",
    "revelations": "Revelation",
}

ORDINAL_WORDS = {
    "first": "1",
    "second": "2",
    "third": "3",
    "1st": "1",
    "2nd": "2",
    "3rd": "3",
}


def _normalize_key(name: str) -> str:
    text = name.strip().lower()
    text = text.replace("&", "and")
    text = re.sub(r"[^a-z0-9]+", "", text)

    for word, digit in ORDINAL_WORDS.items():
        if text.startswith(word):
            text = digit + text[len(word) :]
            break

    match = re.match(r"^([ivx]+)([a-z].*)$", text)
    if match:
        roman, rest = match.groups()
        if roman in ROMAN_TO_INT:
            text = f"{ROMAN_TO_INT[roman]}{rest}"

    return text


def _build_alias_map() -> dict[str, str]:
    aliases: dict[str, str] = {}

    for book in BOOKS:
        aliases[_normalize_key(book.name)] = book.name

    for abbr, canonical in ABBREVIATIONS.items():
        aliases[_normalize_key(abbr)] = canonical

    for book in BOOKS:
        if book.name[0].isdigit():
            number, _, rest = book.name.partition(" ")
            aliases[_normalize_key(f"{number}{rest}")] = book.name
            aliases[_normalize_key(f"{number} {rest}")] = book.name

    return aliases


ALIAS_MAP = _build_alias_map()
CANONICAL_KEYS = list(ALIAS_MAP.keys())


def normalize_book_name(name: str) -> str | None:
    """Return canonical book name or None if no match."""
    if not name or not name.strip():
        return None

    key = _normalize_key(name)
    if key in ALIAS_MAP:
        return ALIAS_MAP[key]

    if name.strip().lower() in BOOK_BY_NAME:
        return BOOK_BY_NAME[name.strip().lower()]

    matches = difflib.get_close_matches(key, CANONICAL_KEYS, n=1, cutoff=0.82)
    if matches:
        return ALIAS_MAP[matches[0]]

    return None
