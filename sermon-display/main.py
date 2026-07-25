#!/usr/bin/env python3
"""FastAPI backend for real-time church Bible display."""

from __future__ import annotations

import logging
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from books import normalize_book_name
from lookup import DEFAULT_DB_PATH, get_chapter, get_verse

logger = logging.getLogger("sermon-display")

KNOWN_TRANSLATIONS = ["KJV", "NKJV", "NLT", "AMP", "MSG"]


class PushVerseBody(BaseModel):
    translation: str = Field(..., min_length=1)
    book: str = Field(..., min_length=1)
    chapter: int = Field(..., ge=1)
    verse: int = Field(..., ge=1)

    @field_validator("translation", "book")
    @classmethod
    def strip_nonempty(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned


class PushChapterBody(BaseModel):
    translation: str = Field(..., min_length=1)
    book: str = Field(..., min_length=1)
    chapter: int = Field(..., ge=1)

    @field_validator("translation", "book")
    @classmethod
    def strip_nonempty(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned


class ConnectionManager:
    """In-memory set of connected display WebSocket clients."""

    def __init__(self) -> None:
        self.active: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.add(websocket)
        logger.info("display client connected (%d total)", len(self.active))

    def disconnect(self, websocket: WebSocket) -> None:
        self.active.discard(websocket)
        logger.info("display client disconnected (%d total)", len(self.active))

    async def broadcast(self, message: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for websocket in list(self.active):
            try:
                await websocket.send_json(message)
            except Exception:
                stale.append(websocket)

        for websocket in stale:
            self.disconnect(websocket)


manager = ConnectionManager()
available_translations: list[str] = []


def _load_translations(db_path: Path) -> list[str]:
    if not db_path.exists():
        raise FileNotFoundError(
            f"Database not found at {db_path}. Run download_bibles.py and build_database.py first."
        )

    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            """
            SELECT DISTINCT translation
            FROM verses
            ORDER BY translation
            """
        ).fetchall()
        found = [row[0] for row in rows]
    finally:
        conn.close()

    # Prefer known order, append any extras
    ordered = [t for t in KNOWN_TRANSLATIONS if t in found]
    for t in found:
        if t not in ordered:
            ordered.append(t)
    return ordered


def _canonical_book_or_422(book: str) -> str:
    canonical = normalize_book_name(book)
    if not canonical:
        raise HTTPException(
            status_code=422,
            detail=f"Unrecognized book name: {book!r}. Try 'Romans', '1 Corinthians', etc.",
        )
    return canonical


@asynccontextmanager
async def lifespan(app: FastAPI):
    global available_translations
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    db_path = DEFAULT_DB_PATH
    available_translations = _load_translations(db_path)
    logger.info("Connected to SQLite database: %s", db_path)
    logger.info(
        "Loaded %d translation(s): %s",
        len(available_translations),
        ", ".join(available_translations),
    )
    yield


app = FastAPI(
    title="Sermon Display",
    description="Real-time church Bible display backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "db": str(DEFAULT_DB_PATH),
        "translations": available_translations,
        "clients": len(manager.active),
    }


@app.get("/translations")
def list_translations() -> dict[str, list[str]]:
    return {"translations": available_translations}


@app.get("/lookup")
def lookup_verse(
    translation: str = Query(..., min_length=1),
    book: str = Query(..., min_length=1),
    chapter: int = Query(..., ge=1),
    verse: int = Query(..., ge=1),
) -> dict[str, Any]:
    translation = translation.strip().upper()
    canonical_book = _canonical_book_or_422(book)

    if available_translations and translation not in {
        t.upper() for t in available_translations
    }:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unknown translation {translation!r}. "
                f"Available: {', '.join(available_translations)}"
            ),
        )

    text = get_verse(translation, canonical_book, chapter, verse)
    if text is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Verse not found: {translation} {canonical_book} {chapter}:{verse}"
            ),
        )

    return {
        "translation": translation,
        "book": canonical_book,
        "chapter": chapter,
        "verse": verse,
        "text": text,
    }


@app.get("/chapter")
def lookup_chapter(
    translation: str = Query(..., min_length=1),
    book: str = Query(..., min_length=1),
    chapter: int = Query(..., ge=1),
) -> dict[str, Any]:
    translation = translation.strip().upper()
    canonical_book = _canonical_book_or_422(book)

    if available_translations and translation not in {
        t.upper() for t in available_translations
    }:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unknown translation {translation!r}. "
                f"Available: {', '.join(available_translations)}"
            ),
        )

    verses = get_chapter(translation, canonical_book, chapter)
    if not verses:
        raise HTTPException(
            status_code=404,
            detail=f"Chapter not found: {translation} {canonical_book} {chapter}",
        )

    return {
        "translation": translation,
        "book": canonical_book,
        "chapter": chapter,
        "verses": verses,
    }


@app.post("/push")
async def push_verse(body: PushVerseBody) -> dict[str, Any]:
    translation = body.translation.strip().upper()
    canonical_book = _canonical_book_or_422(body.book)

    text = get_verse(translation, canonical_book, body.chapter, body.verse)
    if text is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Verse not found: {translation} {canonical_book} "
                f"{body.chapter}:{body.verse}"
            ),
        )

    payload = {
        "type": "verse",
        "translation": translation,
        "book": canonical_book,
        "chapter": body.chapter,
        "verse": body.verse,
        "text": text,
    }
    await manager.broadcast(payload)
    return {"ok": True, "clients": len(manager.active), "message": payload}


@app.post("/push/clear")
async def push_clear() -> dict[str, Any]:
    payload = {"type": "clear"}
    await manager.broadcast(payload)
    return {"ok": True, "clients": len(manager.active), "message": payload}


@app.post("/push/chapter")
async def push_chapter(body: PushChapterBody) -> dict[str, Any]:
    translation = body.translation.strip().upper()
    canonical_book = _canonical_book_or_422(body.book)

    verses = get_chapter(translation, canonical_book, body.chapter)
    if not verses:
        raise HTTPException(
            status_code=404,
            detail=f"Chapter not found: {translation} {canonical_book} {body.chapter}",
        )

    payload = {
        "type": "chapter",
        "translation": translation,
        "book": canonical_book,
        "chapter": body.chapter,
        "verses": verses,
    }
    await manager.broadcast(payload)
    return {"ok": True, "clients": len(manager.active), "message": payload}


@app.websocket("/ws/display")
async def display_websocket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive; clients may send pings or ignore.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
        raise
