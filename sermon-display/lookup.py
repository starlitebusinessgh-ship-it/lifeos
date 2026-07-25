"""SQLite lookup helpers for sermon-display."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from books import normalize_book_name

ROOT = Path(__file__).resolve().parent
DEFAULT_DB_PATH = ROOT / "data" / "bible.db"


def _connect(db_path: Path | str | None = None) -> sqlite3.Connection:
    path = Path(db_path) if db_path else DEFAULT_DB_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def _resolve_book(conn: sqlite3.Connection, book: str) -> str | None:
    canonical = normalize_book_name(book)
    if canonical:
        row = conn.execute(
            "SELECT name FROM books WHERE name = ? COLLATE NOCASE",
            (canonical,),
        ).fetchone()
        if row:
            return row["name"]

    row = conn.execute(
        "SELECT name FROM books WHERE name = ? COLLATE NOCASE",
        (book.strip(),),
    ).fetchone()
    if row:
        return row["name"]

    return canonical


def get_verse(
    translation: str,
    book: str,
    chapter: int,
    verse: int,
    *,
    db_path: Path | str | None = None,
) -> str | None:
    conn = _connect(db_path)
    try:
        canonical_book = _resolve_book(conn, book)
        if not canonical_book:
            return None

        row = conn.execute(
            """
            SELECT text
            FROM verses
            WHERE translation = ? COLLATE NOCASE
              AND book = ?
              AND chapter = ?
              AND verse = ?
            """,
            (translation.upper(), canonical_book, chapter, verse),
        ).fetchone()
        return row["text"] if row else None
    finally:
        conn.close()


def get_chapter(
    translation: str,
    book: str,
    chapter: int,
    *,
    db_path: Path | str | None = None,
) -> list[dict]:
    conn = _connect(db_path)
    try:
        canonical_book = _resolve_book(conn, book)
        if not canonical_book:
            return []

        rows = conn.execute(
            """
            SELECT verse, text
            FROM verses
            WHERE translation = ? COLLATE NOCASE
              AND book = ?
              AND chapter = ?
            ORDER BY verse
            """,
            (translation.upper(), canonical_book, chapter),
        ).fetchall()

        return [{"verse": row["verse"], "text": row["text"]} for row in rows]
    finally:
        conn.close()


if __name__ == "__main__":
    sample = get_verse("KJV", "Romans", 8, 28)
    print("Romans 8:28 (KJV):")
    print(sample or "(not found — run download_bibles.py and build_database.py)")
