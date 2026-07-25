import fs from "fs";
import path from "path";
import { BIBLE_STUDY_DIR } from "./paths";

export interface StrongsEntry {
  number: string;
  lemma: string;
  transliteration: string;
  pronunciation?: string;
  definition: string;
  language: "hebrew" | "greek";
}

let lexiconCache: Record<string, StrongsEntry> | null = null;

function loadLexicon(): Record<string, StrongsEntry> {
  if (lexiconCache) return lexiconCache;
  const fp = path.join(BIBLE_STUDY_DIR, "strongs.json");
  if (!fs.existsSync(fp)) {
    lexiconCache = {};
    return lexiconCache;
  }
  lexiconCache = JSON.parse(fs.readFileSync(fp, "utf8")) as Record<string, StrongsEntry>;
  return lexiconCache;
}

export function lookupStrongs(number: string): StrongsEntry | null {
  const key = number.toUpperCase().replace(/^([HG])/, "$1");
  const lex = loadLexicon();
  return lex[key] ?? null;
}

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

export interface VerseStudyPayload {
  book: string;
  bookId: string;
  chapter: number;
  verse: number;
  words: VerseWord[];
  language: "hebrew" | "greek";
}

export function loadVerseStudy(
  bookId: string,
  chapter: number,
  verse: number
): VerseStudyPayload | { error: string } {
  const fp = path.join(BIBLE_STUDY_DIR, "verses", bookId, `${chapter}.json`);
  if (!fs.existsSync(fp)) {
    return { error: "Study data not built. Run: npm run bible:build" };
  }

  try {
    const data = JSON.parse(fs.readFileSync(fp, "utf8")) as {
      book: string;
      bookId: string;
      language: "hebrew" | "greek";
      verses: Record<string, VerseWord[]>;
    };
    const words = data.verses[String(verse)];
    if (!words?.length) return { error: "Verse not found in study index" };
    return {
      book: data.book,
      bookId: data.bookId,
      chapter,
      verse,
      words,
      language: data.language,
    };
  } catch {
    return { error: "Could not load study data" };
  }
}
