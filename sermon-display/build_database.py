#!/usr/bin/env python3
"""Build SQLite bible.db from cached Bolls JSON files."""

from __future__ import annotations

import json
import re
import sqlite3
import sys
from pathlib import Path

from books import BOOKS, BOOK_BY_BOLLS_ID

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"
DB_PATH = ROOT / "data" / "bible.db"

TRANSLATIONS = ["KJV", "NKJV", "NLT", "AMP", "MSG"]


def strip_tags(text: str) -> str:
    text = re.sub(r"<S>\d+</S>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            testament TEXT NOT NULL,
            chapter_count INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS verses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            translation TEXT NOT NULL,
            book TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER NOT NULL,
            text TEXT NOT NULL,
            UNIQUE (translation, book, chapter, verse)
        );

        CREATE INDEX IF NOT EXISTS idx_verses_lookup
            ON verses (translation, book, chapter, verse);
        """
    )


def seed_books(conn: sqlite3.Connection) -> None:
    conn.executemany(
        """
        INSERT OR REPLACE INTO books (id, name, testament, chapter_count)
        VALUES (?, ?, ?, ?)
        """,
        [(book.id, book.name, book.testament, book.chapter_count) for book in BOOKS],
    )


def load_translation(conn: sqlite3.Connection, translation: str) -> int:
    raw_path = RAW_DIR / f"{translation}.json"
    if not raw_path.exists():
        raise FileNotFoundError(
            f"Missing {raw_path.name}. Run download_bibles.py first."
        )

    rows = json.loads(raw_path.read_text(encoding="utf-8"))
    conn.execute("DELETE FROM verses WHERE translation = ?", (translation,))

    insert_rows: list[tuple[str, str, int, int, str]] = []
    for row in rows:
        book_meta = BOOK_BY_BOLLS_ID.get(int(row["book"]))
        if book_meta is None:
            continue

        chapter = int(row["chapter"])
        verse = int(row["verse"])
        text = strip_tags(str(row.get("text", "")))
        if not text:
            continue

        insert_rows.append((translation, book_meta.name, chapter, verse, text))

    conn.executemany(
        """
        INSERT OR REPLACE INTO verses (translation, book, chapter, verse, text)
        VALUES (?, ?, ?, ?, ?)
        """,
        insert_rows,
    )
    return len(insert_rows)


def print_summary(conn: sqlite3.Connection) -> None:
    print("\nImport summary")
    print("-" * 48)
    print(f"{'Translation':<12} {'Verses':>8}  {'Books':>6}")
    print("-" * 48)

    for translation in TRANSLATIONS:
        count, books = conn.execute(
            """
            SELECT COUNT(*), COUNT(DISTINCT book)
            FROM verses
            WHERE translation = ?
            """,
            (translation,),
        ).fetchone()
        print(f"{translation:<12} {count:>8,}  {books:>6}")

    total = conn.execute("SELECT COUNT(*) FROM verses").fetchone()[0]
    print("-" * 48)
    print(f"{'TOTAL':<12} {total:>8,}")


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    try:
        create_schema(conn)
        seed_books(conn)

        print("Building bible.db from cached JSON\n")
        for translation in TRANSLATIONS:
            count = load_translation(conn, translation)
            print(f"  {translation}: inserted {count:,} verses")

        conn.commit()
        print_summary(conn)
        print(f"\nDatabase written to {DB_PATH}")
    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
