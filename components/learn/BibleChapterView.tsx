"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Highlighter } from "lucide-react";
import { getBibleBook, bibleChapterHref } from "@/lib/bible/books";
import {
  BIBLE_TRANSLATIONS,
  BIBLE_TRANSLATION_STORAGE_KEY,
  type BibleTranslationId,
} from "@/lib/bible/translations";
import type { BibleChapterPayload } from "@/lib/bible/fetch";
import { loadChapterClient, prefetchBook } from "@/lib/bible/client";
import { verseHighlightColor } from "@/lib/bible/bibleHighlightActions";
import { useBibleChapterHighlights } from "@/lib/bible/useBibleHighlights";
import { useBibleBookmarks } from "@/lib/bible/useBookmarks";
import { BibleVerseStudy } from "@/components/learn/BibleVerseStudy";
import { BibleHighlightSheet } from "@/components/learn/BibleHighlightSheet";
import { haptic } from "@/lib/finance/haptics";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BibleChapterView({ bookId, chapter }: { bookId: string; chapter: number }) {
  const book = getBibleBook(bookId);
  const [translation, setTranslation] = useState<BibleTranslationId>("kjv");
  const [payload, setPayload] = useState<BibleChapterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studyVerse, setStudyVerse] = useState<number | null>(null);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const { highlights, add: addHighlight } = useBibleChapterHighlights(bookId, chapter, translation);
  const { bookmarks, add: addBookmark, remove: removeBookmark } = useBibleBookmarks();

  const load = useCallback(
    async (t: BibleTranslationId) => {
      setLoading(true);
      setError(null);
      const data = await loadChapterClient(bookId, chapter, t);
      if ("error" in data) {
        setError(data.error);
        setPayload(null);
      } else {
        setPayload(data);
      }
      setLoading(false);
    },
    [bookId, chapter]
  );

  useEffect(() => {
    const saved = localStorage.getItem(BIBLE_TRANSLATION_STORAGE_KEY) as BibleTranslationId | null;
    const t =
      saved && BIBLE_TRANSLATIONS.some((x) => x.id === saved) ? saved : ("kjv" as BibleTranslationId);
    setTranslation(t);
    void load(t);
  }, [load]);

  useEffect(() => {
    if (!book) return;
    prefetchBook(translation, bookId);
  }, [book, bookId, chapter, translation]);

  function changeTranslation(id: BibleTranslationId) {
    setTranslation(id);
    localStorage.setItem(BIBLE_TRANSLATION_STORAGE_KEY, id);
    haptic("light");
    void load(id);
  }

  function isBookmarked(verse: number) {
    return bookmarks.some(
      (b) =>
        b.book_id === bookId &&
        b.chapter === chapter &&
        b.verse === verse &&
        b.translation === translation
    );
  }

  async function toggleBookmark(verse: number) {
    const existing = bookmarks.find(
      (b) =>
        b.book_id === bookId &&
        b.chapter === chapter &&
        b.verse === verse &&
        b.translation === translation
    );
    if (existing) {
      await removeBookmark(existing.id);
      haptic("light");
    } else {
      await addBookmark(bookId, chapter, verse, translation);
      haptic("success");
    }
  }

  if (!book) {
    return (
      <div className="ln-shell ln-shell-bible">
        <p className="ln-bible-error">Book not found.</p>
        <Link href="/learn/bible" className="ln-shelf-back-link">
          Back to Bible
        </Link>
      </div>
    );
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  return (
    <div className="ln-shell ln-shell-bible ln-shell-bible-read">
      <header className="ln-bible-read-head">
        <Link href="/learn/bible" className="ln-shelf-back-link" onClick={() => haptic("light")}>
          Bible
        </Link>
        <div className="ln-bible-read-titles">
          <h1 className="ln-bible-read-title">
            {book.name} {chapter}
          </h1>
          {payload && <p className="ln-bible-read-ref">{payload.translation}</p>}
        </div>
        <div className="ln-bible-translation-pills ln-bible-translation-pills--scroll">
          {BIBLE_TRANSLATIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ln-bible-pill${translation === t.id ? " ln-bible-pill--active" : ""}`}
              onClick={() => changeTranslation(t.id)}
            >
              {t.short}
            </button>
          ))}
        </div>
      </header>

      <article className="ln-bible-chapter">
        {loading && <p className="ln-bible-loading">Opening chapter…</p>}
        {error && <p className="ln-bible-error">{error}</p>}
        {payload?.verses.map((v) => {
          const hlColor = verseHighlightColor(highlights, v.verse);
          const bookmarked = isBookmarked(v.verse);
          return (
            <p
              key={v.verse}
              className="ln-bible-verse"
              style={hlColor ? { backgroundColor: `${hlColor}33`, borderRadius: 6 } : undefined}
              onTouchStart={() => {
                longPressTimer.current = window.setTimeout(() => {
                  haptic("light");
                  setHighlightVerse(v.verse);
                }, 500);
              }}
              onTouchEnd={() => {
                if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setHighlightVerse(v.verse);
              }}
            >
              <button
                type="button"
                className="ln-bible-verse-num"
                aria-label={`Study verse ${v.verse}`}
                onClick={() => {
                  haptic("light");
                  setStudyVerse(v.verse);
                }}
              >
                {v.verse}
              </button>
              {v.text}
              <span className="ln-bible-verse-actions">
                <button
                  type="button"
                  className={`ln-bible-verse-action${bookmarked ? " ln-bible-verse-action--active" : ""}`}
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark verse"}
                  onClick={() => void toggleBookmark(v.verse)}
                >
                  <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  className="ln-bible-verse-action"
                  aria-label="Highlight verse"
                  onClick={() => setHighlightVerse(v.verse)}
                >
                  <Highlighter size={14} />
                </button>
              </span>
            </p>
          );
        })}
      </article>

      <nav className="ln-bible-chapter-nav" aria-label="Chapter navigation">
        {prevChapter ? (
          <Link
            href={bibleChapterHref(bookId, prevChapter)}
            className="ln-bible-nav-btn"
            onClick={() => haptic("light")}
          >
            <ChevronLeft size={18} />
            Ch. {prevChapter}
          </Link>
        ) : (
          <span />
        )}
        {nextChapter ? (
          <Link
            href={bibleChapterHref(bookId, nextChapter)}
            className="ln-bible-nav-btn ln-bible-nav-btn--next"
            onClick={() => haptic("light")}
          >
            Ch. {nextChapter}
            <ChevronRight size={18} />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {studyVerse !== null && (
        <BibleVerseStudy
          bookId={bookId}
          chapter={chapter}
          verse={studyVerse}
          onClose={() => setStudyVerse(null)}
        />
      )}

      {highlightVerse !== null && (
        <BibleHighlightSheet
          verse={highlightVerse}
          onClose={() => setHighlightVerse(null)}
          onSave={async (color, note) => {
            await addHighlight(highlightVerse, highlightVerse, color, note);
            haptic("success");
            setHighlightVerse(null);
          }}
        />
      )}
    </div>
  );
}
