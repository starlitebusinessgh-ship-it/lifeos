"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { posLabel } from "@/lib/bible/posLabels";
import { haptic } from "@/lib/finance/haptics";

export interface VerseWord {
  position: number;
  original: string;
  transliteration: string;
  lemma: string;
  strongs: string | null;
  gloss: string;
  language: "hebrew" | "greek";
  pos?: string;
}

export interface StrongsDetail {
  number: string;
  lemma: string;
  transliteration: string;
  definition: string;
  language: "hebrew" | "greek";
}

export function BibleVerseStudy({
  bookId,
  chapter,
  verse,
  onClose,
}: {
  bookId: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<VerseWord[]>([]);
  const [language, setLanguage] = useState<"hebrew" | "greek">("greek");
  const [strongsDetail, setStrongsDetail] = useState<StrongsDetail | null>(null);
  const [strongsLoading, setStrongsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setStrongsDetail(null);
      try {
        const res = await fetch(
          `/api/bible/study?book=${encodeURIComponent(bookId)}&chapter=${chapter}&verse=${verse}`
        );
        const data = await res.json();
        if (!res.ok || data.error) {
          if (!cancelled) setError(data.error ?? "Study data unavailable");
          return;
        }
        if (!cancelled) {
          setWords(data.words ?? []);
          setLanguage(data.language ?? "greek");
        }
      } catch {
        if (!cancelled) setError("Could not load study data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter, verse]);

  async function openStrongs(number: string) {
    setStrongsLoading(true);
    haptic("light");
    try {
      const res = await fetch(`/api/bible/strongs?number=${encodeURIComponent(number)}`);
      const data = await res.json();
      if (res.ok && !data.error) setStrongsDetail(data);
    } finally {
      setStrongsLoading(false);
    }
  }

  return (
    <div className="ln-bible-study-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ln-bible-study-sheet"
        role="dialog"
        aria-label={`Study verse ${verse}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ln-bible-study-head">
          <div>
            <span className="ln-bible-study-kicker">
              {language === "hebrew" ? "Hebrew" : "Greek"} · Verse {verse}
            </span>
            <h2 className="ln-bible-study-title">Word study</h2>
          </div>
          <button type="button" className="ln-bible-study-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        {loading && <p className="ln-bible-study-loading">Loading words…</p>}
        {error && <p className="ln-bible-study-error">{error}</p>}

        {!loading && !error && (
          <ul className="ln-bible-study-words">
            {words.map((w) => (
              <li key={w.position} className="ln-bible-study-word">
                <div className="ln-bible-study-word-top">
                  <span
                    className={`ln-bible-study-original ln-bible-study-original--${w.language}`}
                    dir={w.language === "hebrew" ? "rtl" : "ltr"}
                  >
                    {w.original}
                  </span>
                  {w.strongs && (
                    <button
                      type="button"
                      className="ln-bible-study-strongs-btn"
                      onClick={() => void openStrongs(w.strongs!)}
                    >
                      {w.strongs}
                    </button>
                  )}
                </div>
                {w.transliteration && (
                  <p className="ln-bible-study-translit">{w.transliteration}</p>
                )}
                <p className="ln-bible-study-gloss">{w.gloss}</p>
                {w.pos && (
                  <span className="ln-bible-study-pos">{posLabel(w.pos) ?? w.pos}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {strongsLoading && <p className="ln-bible-study-loading">Loading definition…</p>}
        {strongsDetail && (
          <article className="ln-bible-strongs-card">
            <h3>
              {strongsDetail.number} · {strongsDetail.transliteration || strongsDetail.lemma}
            </h3>
            <p className="ln-bible-strongs-lemma" dir={strongsDetail.language === "hebrew" ? "rtl" : "ltr"}>
              {strongsDetail.lemma}
            </p>
            <p className="ln-bible-strongs-def">{strongsDetail.definition}</p>
          </article>
        )}
      </div>
    </div>
  );
}
