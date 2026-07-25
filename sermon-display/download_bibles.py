#!/usr/bin/env python3
"""Download Bible translations from Bolls.life into data/raw/."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import requests

from books import BOOKS

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"

BOLLS_CDN = "https://bolls.life/static/translations"
BOLLS_CHAPTER = "https://bolls.life/get-text/{translation}/{book_id}/{chapter}/"

TRANSLATIONS = ["KJV", "NKJV", "NLT", "AMP", "MSG"]

MAX_RETRIES = 4
RETRY_BASE_DELAY = 2.0
REQUEST_DELAY = 0.35


def ensure_raw_dir() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)


def request_with_retry(
    session: requests.Session,
    url: str,
    *,
    timeout: int = 120,
) -> requests.Response:
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            response = session.get(url, timeout=timeout)
            if response.status_code in {429, 500, 502, 503, 504}:
                raise requests.HTTPError(
                    f"{response.status_code} from {url}", response=response
                )
            return response
        except (requests.RequestException, requests.HTTPError) as exc:
            last_error = exc
            if attempt == MAX_RETRIES - 1:
                break
            delay = RETRY_BASE_DELAY * (2**attempt)
            print(f"  retry {attempt + 1}/{MAX_RETRIES - 1} in {delay:.1f}s ({exc})")
            time.sleep(delay)

    raise RuntimeError(f"Failed to fetch {url}") from last_error


def download_full_translation(
    session: requests.Session, translation: str
) -> list[dict] | None:
    url = f"{BOLLS_CDN}/{translation}.json"
    print(f"  fetching full dump: {url}")
    response = request_with_retry(session, url)
    if response.status_code == 404:
        print("  full JSON dump not available (404)")
        return None
    response.raise_for_status()
    return response.json()


def download_chapter_by_chapter(
    session: requests.Session, translation: str
) -> list[dict]:
    print(f"  falling back to chapter-by-chapter download for {translation}")
    verses: list[dict] = []

    for book in BOOKS:
        for chapter in range(1, book.chapter_count + 1):
            url = BOLLS_CHAPTER.format(
                translation=translation,
                book_id=book.bolls_id,
                chapter=chapter,
            )
            response = request_with_retry(session, url, timeout=60)
            response.raise_for_status()
            chapter_rows = response.json()
            if not isinstance(chapter_rows, list):
                raise ValueError(f"Unexpected chapter payload from {url}")

            for row in chapter_rows:
                verses.append(
                    {
                        "translation": translation,
                        "book": book.bolls_id,
                        "chapter": chapter,
                        "verse": row.get("verse"),
                        "text": row.get("text", ""),
                    }
                )

            time.sleep(REQUEST_DELAY)

    return verses


def download_translation(session: requests.Session, translation: str) -> Path:
    cache_path = RAW_DIR / f"{translation}.json"
    if cache_path.exists():
        print(f"{translation}: using cached {cache_path.name}")
        return cache_path

    print(f"{translation}: downloading...")
    payload = download_full_translation(session, translation)
    if payload is None:
        payload = download_chapter_by_chapter(session, translation)
    else:
        time.sleep(REQUEST_DELAY)

    cache_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"{translation}: saved {len(payload):,} rows -> {cache_path}")
    return cache_path


def main() -> int:
    ensure_raw_dir()
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "sermon-display/1.0 (church bible display; polite downloader)",
            "Accept": "application/json",
        }
    )

    print("Downloading Bible translations from Bolls.life\n")
    results: list[tuple[str, Path, int]] = []

    for translation in TRANSLATIONS:
        path = download_translation(session, translation)
        row_count = len(json.loads(path.read_text(encoding="utf-8")))
        results.append((translation, path, row_count))
        time.sleep(REQUEST_DELAY)

    print("\nDownload summary")
    print("-" * 40)
    for translation, path, row_count in results:
        print(f"  {translation:5}  {row_count:>7,} rows  {path.name}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
