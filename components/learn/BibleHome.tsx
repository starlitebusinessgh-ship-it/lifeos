"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronRight, Search } from "lucide-react";
import { BIBLE_BOOKS, getBibleBook, bibleChapterHref } from "@/lib/bible/books";
import {
  BIBLE_TRANSLATIONS,
  BIBLE_TRANSLATION_STORAGE_KEY,
  type BibleTranslationId,
} from "@/lib/bible/translations";
import { useBibleBookmarks } from "@/lib/bible/useBookmarks";
import { BibleReadingPlanCard } from "@/components/learn/BibleReadingPlanCard";
import { haptic } from "@/lib/finance/haptics";

export function BibleHome() {
  const [translation, setTranslation] = useState<BibleTranslationId>("kjv");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<
    { reference: string; text: string; bookId?: string; chapter?: number; verse?: number }[]
  >([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { bookmarks } = useBibleBookmarks();

  useEffect(() => {
    const saved = localStorage.getItem(BIBLE_TRANSLATION_STORAGE_KEY) as BibleTranslationId | null;
    if (saved && BIBLE_TRANSLATIONS.some((t) => t.id === saved)) {
      setTranslation(saved);
    }
  }, []);

  const persistTranslation = useCallback((id: BibleTranslationId) => {
    setTranslation(id);
    localStorage.setItem(BIBLE_TRANSLATION_STORAGE_KEY, id);
    haptic("light");
  }, []);

  const ot = useMemo(() => BIBLE_BOOKS.filter((b) => b.testament === "OT"), []);
  const nt = useMemo(() => BIBLE_BOOKS.filter((b) => b.testament === "NT"), []);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) return;
    setSearching(true);
    setSearchError(null);
    setHits([]);
    try {
      const res = await fetch(
        `/api/bible/search?q=${encodeURIComponent(q)}&translation=${translation}`
      );
      const data = (await res.json()) as { hits?: typeof hits; error?: string };
      if (!res.ok || data.error) {
        setSearchError(data.error ?? "Search failed");
      } else {
        setHits(data.hits ?? []);
      }
    } catch {
      setSearchError("Search unavailable");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="ln-shell ln-shell-bible">
      <header className="ln-shelf-page-head">
        <Link href="/learn" className="ln-shelf-back-link" onClick={() => haptic("light")}>
          Library
        </Link>
        <h1 className="ln-rn-page-title">Bible</h1>
        <p className="ln-shelf-page-sub">6 translations · fully offline · Greek & Hebrew study</p>
      </header>

      <div className="ln-bible-hero">
        <img src="/learn/categories/bible.png" alt="" className="ln-bible-hero-photo" loading="lazy" />
        <div className="ln-bible-hero-overlay" aria-hidden />
        <div className="ln-bible-hero-body">
          <span className="ln-bible-hero-kicker">Holy Bible</span>
          <p className="ln-bible-hero-copy">Tap verse number to study · long-press to highlight</p>
        </div>
      </div>

      <BibleReadingPlanCard />

      {bookmarks.length > 0 && (
        <section className="ln-bible-bookmarks" aria-label="Bookmarks">
          <h2 className="ln-bible-books-title">
            <Bookmark size={16} /> Bookmarks
          </h2>
          <ul className="ln-bible-bookmark-list">
            {bookmarks.slice(0, 8).map((b) => {
              const book = getBibleBook(b.book_id);
              return (
                <li key={b.id}>
                  <Link
                    href={bibleChapterHref(b.book_id, b.chapter)}
                    className="ln-bible-bookmark-link"
                    onClick={() => haptic("light")}
                  >
                    {book?.name ?? b.book_id} {b.chapter}:{b.verse}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="ln-bible-controls" aria-label="Translation and search">
        <div className="ln-bible-translation-row">
          <span className="ln-bible-control-label">Translation</span>
          <div className="ln-bible-translation-pills ln-bible-translation-pills--scroll">
            {BIBLE_TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`ln-bible-pill${translation === t.id ? " ln-bible-pill--active" : ""}`}
                onClick={() => persistTranslation(t.id)}
              >
                {t.short}
              </button>
            ))}
          </div>
        </div>

        <form className="ln-bible-search" onSubmit={runSearch}>
          <Search size={18} strokeWidth={2} className="ln-bible-search-icon" />
          <input
            type="search"
            className="ln-bible-search-input"
            placeholder="Search e.g. John 3:16 or love"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="ln-bible-search-btn" disabled={searching || query.trim().length < 3}>
            {searching ? "…" : "Go"}
          </button>
        </form>
        {searchError && <p className="ln-bible-search-error">{searchError}</p>}
        {hits.length > 0 && (
          <ul className="ln-bible-search-hits">
            {hits.map((hit) => {
              const href =
                hit.bookId && hit.chapter ? bibleChapterHref(hit.bookId, hit.chapter) : null;
              return (
                <li key={hit.reference}>
                  {href ? (
                    <Link href={href} className="ln-bible-search-hit-link" onClick={() => haptic("light")}>
                      <strong>{hit.reference}</strong>
                      <span>{hit.text}</span>
                    </Link>
                  ) : (
                    <>
                      <strong>{hit.reference}</strong>
                      <span>{hit.text}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <BibleBookSection title="Old Testament" books={ot} />
      <BibleBookSection title="New Testament" books={nt} />
    </div>
  );
}

function BibleBookSection({ title, books }: { title: string; books: typeof BIBLE_BOOKS }) {
  return (
    <section className="ln-bible-books" aria-label={title}>
      <h2 className="ln-bible-books-title">{title}</h2>
      <div className="ln-bible-books-grid">
        {books.map((book) => (
          <Link
            key={book.id}
            href={bibleChapterHref(book.id, 1)}
            className="ln-bible-book-card"
            onClick={() => haptic("light")}
          >
            <span className="ln-bible-book-name">{book.name}</span>
            <span className="ln-bible-book-meta">{book.chapters} ch</span>
            <ChevronRight size={14} className="ln-bible-book-chevron" />
          </Link>
        ))}
      </div>
    </section>
  );
}
