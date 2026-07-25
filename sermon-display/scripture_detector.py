"""Extract Bible references from messy spoken / Whisper transcripts."""

from __future__ import annotations

import difflib
import re
from typing import Any

from books import ALIAS_MAP, BOOKS, _normalize_key, normalize_book_name

# Minimum confidence to return a hit. Below this we return nothing.
MIN_CONFIDENCE = 0.55

ONES = {
    "zero": 0,
    "oh": 0,
    "o": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
}

TEENS = {
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
}

TENS = {
    "twenty": 20,
    "thirty": 30,
    "forty": 40,
    "fifty": 50,
    "sixty": 60,
    "seventy": 70,
    "eighty": 80,
    "ninety": 90,
}

ORDINAL_PREFIXES = {
    "first": "1",
    "1st": "1",
    "i": "1",
    "second": "2",
    "2nd": "2",
    "ii": "2",
    "third": "3",
    "3rd": "3",
    "iii": "3",
}

RANGE_WORDS = {"through", "thru", "to", "unto", "until", "-"}

STRUCT_WORDS = {"chapter", "chapters", "verse", "verses"}

# Bases that need First/Second/Third (or 1/2/3) — bare form is rejected
NUMBERED_BASES = {
    "samuel",
    "kings",
    "chronicles",
    "corinthians",
    "thessalonians",
    "timothy",
    "peter",
    # "john" handled specially: bare → Gospel of John
}

EXTRA_ALIASES = {
    "psalm": "Psalms",
    "psalms": "Psalms",
    "song of songs": "Song of Solomon",
    "song of solomon": "Song of Solomon",
    "canticles": "Song of Solomon",
    "revelation": "Revelation",
    "revelations": "Revelation",
    "apocalypse": "Revelation",
    "acts of the apostles": "Acts",
}


def _build_phrase_index() -> dict[str, str]:
    phrases: dict[str, str] = {}
    for book in BOOKS:
        phrases[book.name.lower()] = book.name
    for alias, canonical in EXTRA_ALIASES.items():
        phrases[alias.lower()] = canonical
    return phrases


PHRASE_INDEX = _build_phrase_index()
# Longest phrases first for scanning
PHRASE_LIST = sorted(PHRASE_INDEX.items(), key=lambda kv: len(kv[0]), reverse=True)


def _tokenize(text: str) -> list[str]:
    text = text.lower().replace("—", "-").replace("–", "-")
    text = re.sub(r"[^\w\s':.-]", " ", text)
    text = text.replace("'", "")
    return re.findall(
        r"\d+|twenty-\w+|thirty-\w+|forty-\w+|fifty-\w+|"
        r"sixty-\w+|seventy-\w+|eighty-\w+|ninety-\w+|[\w]+|[:.-]",
        text,
    )


def _parse_number_token(token: str) -> int | None:
    token = token.lower().strip()
    if token.isdigit():
        value = int(token)
        return value if 0 <= value <= 200 else None
    if "-" in token:
        left, _, right = token.partition("-")
        if left in TENS and right in ONES:
            return TENS[left] + ONES[right]
    if token in ONES:
        return ONES[token]
    if token in TEENS:
        return TEENS[token]
    if token in TENS:
        return TENS[token]
    return None


def _is_number_like(token: str) -> bool:
    return _parse_number_token(token) is not None


def _read_number(tokens: list[str], i: int) -> tuple[int | None, int]:
    """Read one spoken/digit number at tokens[i]; supports 'twenty eight'."""
    if i >= len(tokens):
        return None, i
    tok = tokens[i]
    if tok in TENS and i + 1 < len(tokens):
        ones = _parse_number_token(tokens[i + 1])
        if ones is not None and 0 <= ones <= 9:
            return TENS[tok] + ones, i + 2
    value = _parse_number_token(tok)
    if value is None:
        return None, i
    return value, i + 1


def _read_number_run(tokens: list[str], i: int, limit: int = 3) -> tuple[list[int], int]:
    nums: list[int] = []
    while i < len(tokens) and len(nums) < limit:
        if tokens[i] in STRUCT_WORDS or tokens[i] in RANGE_WORDS or tokens[i] == ":":
            break
        value, ni = _read_number(tokens, i)
        if value is None:
            break
        nums.append(value)
        i = ni
    return nums, i


def _resolve_book_phrase(phrase: str, ordinal: str | None) -> tuple[str, bool] | None:
    """
    Resolve a book name phrase (+ optional ordinal) to canonical name.
    Returns (name, used_fuzzy) or None.
    """
    phrase = phrase.strip().lower()
    if not phrase:
        return None

    base = phrase
    # Numbered bases without ordinal — reject (except bare "john" → Gospel)
    if base in NUMBERED_BASES and not ordinal:
        return None

    if ordinal:
        candidate = f"{ordinal} {phrase}"
    else:
        candidate = phrase

    # Exact alias / phrase index
    if candidate in PHRASE_INDEX:
        return PHRASE_INDEX[candidate], False
    if phrase in PHRASE_INDEX and not ordinal:
        name = PHRASE_INDEX[phrase]
        if name[0].isdigit():
            return None
        return name, False

    key = _normalize_key(candidate)
    if key in ALIAS_MAP:
        name = ALIAS_MAP[key]
        if name[0].isdigit() and not ordinal:
            return None
        if ordinal and name[0].isdigit() and not name.startswith(ordinal + " "):
            # Wrong ordinal resolved — reject
            expected = normalize_book_name(f"{ordinal} {phrase}")
            if expected:
                return expected, False
            return None
        return name, False

    # Fuzzy (Whisper near-misses). Never fuzzy-match if digits hang on the phrase.
    if any(ch.isdigit() for ch in candidate):
        return None

    # Possessive / trailing junk: corinthian's → corinthians
    cleaned = re.sub(r"s$", "", phrase) if phrase.endswith("s") else phrase
    for attempt in (candidate, f"{ordinal} {cleaned}" if ordinal else cleaned, phrase):
        if not attempt or not attempt.strip():
            continue
        resolved = normalize_book_name(attempt)
        if not resolved:
            continue
        if resolved[0].isdigit() and not ordinal:
            continue
        if ordinal and resolved[0].isdigit() and not resolved.startswith(ordinal + " "):
            continue
        cand_key = _normalize_key(attempt)
        target_key = _normalize_key(resolved)
        ratio = difflib.SequenceMatcher(None, cand_key, target_key).ratio()
        if ratio >= 0.82:
            return resolved, ratio < 0.98

    # Bare john
    if phrase == "john" and not ordinal:
        return "John", False

    return None


def _match_book_at(tokens: list[str], index: int) -> tuple[str, int, bool] | None:
    ordinal: str | None = None
    offset = 0
    tok0 = tokens[index]

    if tok0 in ORDINAL_PREFIXES:
        ordinal = ORDINAL_PREFIXES[tok0]
        offset = 1
    elif tok0 in {"1", "2", "3"} and index + 1 < len(tokens):
        nxt = tokens[index + 1]
        # Digit ordinal only when next token looks like a name, not a chapter number word
        # that stands alone... "1 Corinthians" next is corinthians (not a number).
        if not _is_number_like(nxt) and nxt not in STRUCT_WORDS and nxt != ":":
            ordinal = tok0
            offset = 1

    start = index + offset
    if start >= len(tokens):
        return None

    # Collect name tokens only (no digits / chapter / verse / colon)
    name_tokens: list[str] = []
    for j in range(start, min(len(tokens), start + 4)):
        t = tokens[j]
        if t in STRUCT_WORDS or t in {":", "-", "."} or t in RANGE_WORDS:
            break
        if _is_number_like(t):
            break
        name_tokens.append(t)

    if not name_tokens:
        return None

    # Try longest phrase first
    for length in range(len(name_tokens), 0, -1):
        phrase = " ".join(name_tokens[:length])
        # Allow "song of solomon" — keep "of"
        resolved = _resolve_book_phrase(phrase, ordinal)
        if resolved:
            name, fuzzy = resolved
            return name, offset + length, fuzzy

    return None


def _find_book_matches(tokens: list[str]) -> list[tuple[int, str, int, bool]]:
    matches: list[tuple[int, str, int, bool]] = []
    i = 0
    while i < len(tokens):
        hit = _match_book_at(tokens, i)
        if hit:
            name, consumed, fuzzy = hit
            matches.append((i, name, consumed, fuzzy))
            i += consumed
        else:
            i += 1
    return matches


def _extract_range_end(tokens: list[str], i: int) -> tuple[int | None, int]:
    if i >= len(tokens):
        return None, i
    if tokens[i] not in RANGE_WORDS:
        return None, i
    value, ni = _read_number(tokens, i + 1)
    if value is None:
        return None, i + 1
    return value, ni


def _score(
    *,
    has_chapter_word: bool,
    has_verse_word: bool,
    has_colon: bool,
    verse: int | None,
    fuzzy_book: bool,
    ambiguous: bool,
) -> float:
    if has_chapter_word and has_verse_word and verse is not None and not fuzzy_book:
        confidence = 0.95
    elif has_colon and verse is not None and not fuzzy_book:
        confidence = 0.9
    elif has_chapter_word and verse is None and not fuzzy_book:
        confidence = 0.88
    elif verse is not None and not fuzzy_book:
        confidence = 0.78
    elif verse is None and not fuzzy_book:
        confidence = 0.72
    elif fuzzy_book and verse is not None:
        confidence = 0.62
    elif fuzzy_book:
        confidence = 0.58
    else:
        confidence = 0.65
    if ambiguous:
        confidence -= 0.08
    return round(max(0.0, min(1.0, confidence)), 2)


def _parse_ref_after_book(
    tokens: list[str],
    after: int,
    fuzzy_book: bool,
) -> dict[str, Any] | None:
    if after >= len(tokens):
        return None

    window = tokens[after : after + 18]
    has_chapter_word = any(t in {"chapter", "chapters"} for t in window)
    has_verse_word = any(t in {"verse", "verses"} for t in window)
    has_colon = ":" in window

    chapter: int | None = None
    verse: int | None = None
    verse_end: int | None = None
    ambiguous = False
    i = after

    if has_chapter_word or has_verse_word or has_colon:
        while i < len(tokens) and i < after + 18:
            tok = tokens[i]

            if tok in {"chapter", "chapters"}:
                value, i = _read_number(tokens, i + 1)
                if value is None:
                    break
                chapter = value
                continue

            if tok in {"verse", "verses"}:
                value, i = _read_number(tokens, i + 1)
                if value is None:
                    break
                verse = value
                vend, i = _extract_range_end(tokens, i)
                if vend is not None:
                    verse_end = vend
                continue

            if tok == ":":
                # Expect verse after colon if chapter already set; else chapter:verse
                i += 1
                value, i = _read_number(tokens, i)
                if value is None:
                    continue
                if chapter is None:
                    # Shouldn't happen often; treat as chapter then need another
                    chapter = value
                else:
                    verse = value
                    vend, i = _extract_range_end(tokens, i)
                    if vend is not None:
                        verse_end = vend
                continue

            if tok in RANGE_WORDS:
                if verse is not None:
                    vend, i = _extract_range_end(tokens, i)
                    if vend is not None:
                        verse_end = vend
                    continue
                break

            # Leading number before structure words: "Romans 8 verse 28"
            value, ni = _read_number(tokens, i)
            if value is None:
                # Unrelated word — stop if we already have a chapter
                if chapter is not None:
                    break
                i += 1
                continue

            if chapter is None:
                chapter = value
                i = ni
                # Digits form N:M without having seen colon token yet handled above.
                # Compressed extras after chapter digit before "verse":
                if i < len(tokens) and tokens[i] == ":":
                    continue
                continue

            if verse is None:
                verse = value
                i = ni
                vend, i = _extract_range_end(tokens, i)
                if vend is not None:
                    verse_end = vend
                break

            break
    else:
        # Compressed spoken: "Romans eight twenty-eight" / "Romans eight"
        nums, i = _read_number_run(tokens, after, limit=3)
        if not nums:
            return None
        if len(nums) == 1:
            chapter = nums[0]
        elif len(nums) == 2:
            chapter, verse = nums[0], nums[1]
        else:
            chapter, verse, verse_end = nums[0], nums[1], nums[2]
            ambiguous = True
        vend, i = _extract_range_end(tokens, i)
        if vend is not None and verse is not None:
            verse_end = vend
        elif vend is not None and verse is None:
            ambiguous = True

    if chapter is None or chapter < 1 or chapter > 150:
        return None
    if verse is not None and (verse < 1 or verse > 200):
        return None
    if verse_end is not None and (verse is None or verse_end < verse or verse_end > 200):
        verse_end = None

    confidence = _score(
        has_chapter_word=has_chapter_word,
        has_verse_word=has_verse_word,
        has_colon=has_colon,
        verse=verse,
        fuzzy_book=fuzzy_book,
        ambiguous=ambiguous,
    )

    return {
        "chapter": chapter,
        "verse": verse,
        "verse_end": verse_end,
        "confidence": confidence,
        "consumed_end": i,
    }


def detect_references(text: str) -> list[dict]:
    """
    Extract Bible references from a transcript string.

    Returns list of:
      {book, chapter, verse, verse_end, confidence, raw_match}
    Empty list if nothing meets MIN_CONFIDENCE.
    """
    if not text or not text.strip():
        return []

    tokens = _tokenize(text)
    if not tokens:
        return []

    results: list[dict] = []
    seen: set[tuple] = set()

    for start, book, consumed, fuzzy in _find_book_matches(tokens):
        parsed = _parse_ref_after_book(tokens, start + consumed, fuzzy_book=fuzzy)
        if not parsed:
            continue
        if parsed["confidence"] < MIN_CONFIDENCE:
            continue

        end = max(parsed["consumed_end"], start + consumed)
        raw_match = " ".join(tokens[start:end]).strip()
        key = (book, parsed["chapter"], parsed["verse"], parsed["verse_end"])
        if key in seen:
            continue
        seen.add(key)

        results.append(
            {
                "book": book,
                "chapter": parsed["chapter"],
                "verse": parsed["verse"],
                "verse_end": parsed["verse_end"],
                "confidence": parsed["confidence"],
                "raw_match": raw_match,
            }
        )

    results.sort(key=lambda r: r["confidence"], reverse=True)
    return results


def detect_quote(text: str) -> dict | None:
    """
    Detect scripture quoted without an explicit reference.

    TODO: Implement later by fuzzy-matching transcript spans against verse
    text in data/bible.db (different approach from reference parsing).
    Stub only — always returns None for now.
    """
    _ = text
    return None


if __name__ == "__main__":
    samples = [
        "Romans chapter eight verse twenty-eight",
        "Romans eight twenty-eight",
        "1 Corinthians 13",
        "John 3:16",
        "Corinthians thirteen",
        "I ate breakfast at eight",
    ]
    for s in samples:
        print(f"{s!r} -> {detect_references(s)}")
