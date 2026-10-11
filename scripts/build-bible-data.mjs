#!/usr/bin/env node
/**
 * Downloads all Bible translations from Bolls.life + builds Strong's + Greek/Hebrew study data.
 *
 * Usage:
 *   node scripts/build-bible-data.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const morphhb = require("morphhb");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DATA_DIR = path.join(ROOT, "data", "bible");
const PUBLIC_DIR = path.join(ROOT, "public", "bible", "data");
const STUDY_DIR = path.join(ROOT, "data", "bible", "study");
const PUBLIC_STUDY_DIR = path.join(PUBLIC_DIR, "study");
const SEARCH_DIR = path.join(ROOT, "data", "bible", "search");
const PUBLIC_SEARCH_DIR = path.join(PUBLIC_DIR, "search");

const BOLLS_CDN = "https://bolls.life/static/translations";
const MORPHGNT = "https://raw.githubusercontent.com/morphgnt/sblgnt/master";
const STRONGS_HEB = "https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js";
const STRONGS_GRK = "https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js";
const FETCH_TIMEOUT_MS = 45_000;
const MORPHGNT_CONCURRENCY = 4;

const TRANSLATIONS = [
  { id: "kjv", slug: "KJV" },
  { id: "nkjv", slug: "NKJV" },
  { id: "niv", slug: "NIV" },
  { id: "nlt", slug: "NLT" },
  { id: "nasb", slug: "NASB" },
  { id: "msg", slug: "MSG" },
];

const BIBLE_BOOKS = [
  { id: "genesis", name: "Genesis", testament: "OT", chapters: 50, bolls: 1 },
  { id: "exodus", name: "Exodus", testament: "OT", chapters: 40, bolls: 2 },
  { id: "leviticus", name: "Leviticus", testament: "OT", chapters: 27, bolls: 3 },
  { id: "numbers", name: "Numbers", testament: "OT", chapters: 36, bolls: 4 },
  { id: "deuteronomy", name: "Deuteronomy", testament: "OT", chapters: 34, bolls: 5 },
  { id: "joshua", name: "Joshua", testament: "OT", chapters: 24, bolls: 6 },
  { id: "judges", name: "Judges", testament: "OT", chapters: 21, bolls: 7 },
  { id: "ruth", name: "Ruth", testament: "OT", chapters: 4, bolls: 8 },
  { id: "1-samuel", name: "1 Samuel", testament: "OT", chapters: 31, bolls: 9 },
  { id: "2-samuel", name: "2 Samuel", testament: "OT", chapters: 24, bolls: 10 },
  { id: "1-kings", name: "1 Kings", testament: "OT", chapters: 22, bolls: 11 },
  { id: "2-kings", name: "2 Kings", testament: "OT", chapters: 25, bolls: 12 },
  { id: "1-chronicles", name: "1 Chronicles", testament: "OT", chapters: 29, bolls: 13 },
  { id: "2-chronicles", name: "2 Chronicles", testament: "OT", chapters: 36, bolls: 14 },
  { id: "ezra", name: "Ezra", testament: "OT", chapters: 10, bolls: 15 },
  { id: "nehemiah", name: "Nehemiah", testament: "OT", chapters: 13, bolls: 16 },
  { id: "esther", name: "Esther", testament: "OT", chapters: 10, bolls: 17 },
  { id: "job", name: "Job", testament: "OT", chapters: 42, bolls: 18 },
  { id: "psalms", name: "Psalms", testament: "OT", chapters: 150, bolls: 19 },
  { id: "proverbs", name: "Proverbs", testament: "OT", chapters: 31, bolls: 20 },
  { id: "ecclesiastes", name: "Ecclesiastes", testament: "OT", chapters: 12, bolls: 21 },
  { id: "song-of-solomon", name: "Song of Solomon", testament: "OT", chapters: 8, bolls: 22 },
  { id: "isaiah", name: "Isaiah", testament: "OT", chapters: 66, bolls: 23 },
  { id: "jeremiah", name: "Jeremiah", testament: "OT", chapters: 52, bolls: 24 },
  { id: "lamentations", name: "Lamentations", testament: "OT", chapters: 5, bolls: 25 },
  { id: "ezekiel", name: "Ezekiel", testament: "OT", chapters: 48, bolls: 26 },
  { id: "daniel", name: "Daniel", testament: "OT", chapters: 12, bolls: 27 },
  { id: "hosea", name: "Hosea", testament: "OT", chapters: 14, bolls: 28 },
  { id: "joel", name: "Joel", testament: "OT", chapters: 3, bolls: 29 },
  { id: "amos", name: "Amos", testament: "OT", chapters: 9, bolls: 30 },
  { id: "obadiah", name: "Obadiah", testament: "OT", chapters: 1, bolls: 31 },
  { id: "jonah", name: "Jonah", testament: "OT", chapters: 4, bolls: 32 },
  { id: "micah", name: "Micah", testament: "OT", chapters: 7, bolls: 33 },
  { id: "nahum", name: "Nahum", testament: "OT", chapters: 3, bolls: 34 },
  { id: "habakkuk", name: "Habakkuk", testament: "OT", chapters: 3, bolls: 35 },
  { id: "zephaniah", name: "Zephaniah", testament: "OT", chapters: 3, bolls: 36 },
  { id: "haggai", name: "Haggai", testament: "OT", chapters: 2, bolls: 37 },
  { id: "zechariah", name: "Zechariah", testament: "OT", chapters: 14, bolls: 38 },
  { id: "malachi", name: "Malachi", testament: "OT", chapters: 4, bolls: 39 },
  { id: "matthew", name: "Matthew", testament: "NT", chapters: 28, bolls: 40 },
  { id: "mark", name: "Mark", testament: "NT", chapters: 16, bolls: 41 },
  { id: "luke", name: "Luke", testament: "NT", chapters: 24, bolls: 42 },
  { id: "john", name: "John", testament: "NT", chapters: 21, bolls: 43 },
  { id: "acts", name: "Acts", testament: "NT", chapters: 28, bolls: 44 },
  { id: "romans", name: "Romans", testament: "NT", chapters: 16, bolls: 45 },
  { id: "1-corinthians", name: "1 Corinthians", testament: "NT", chapters: 16, bolls: 46 },
  { id: "2-corinthians", name: "2 Corinthians", testament: "NT", chapters: 13, bolls: 47 },
  { id: "galatians", name: "Galatians", testament: "NT", chapters: 6, bolls: 48 },
  { id: "ephesians", name: "Ephesians", testament: "NT", chapters: 6, bolls: 49 },
  { id: "philippians", name: "Philippians", testament: "NT", chapters: 4, bolls: 50 },
  { id: "colossians", name: "Colossians", testament: "NT", chapters: 4, bolls: 51 },
  { id: "1-thessalonians", name: "1 Thessalonians", testament: "NT", chapters: 5, bolls: 52 },
  { id: "2-thessalonians", name: "2 Thessalonians", testament: "NT", chapters: 3, bolls: 53 },
  { id: "1-timothy", name: "1 Timothy", testament: "NT", chapters: 6, bolls: 54 },
  { id: "2-timothy", name: "2 Timothy", testament: "NT", chapters: 4, bolls: 55 },
  { id: "titus", name: "Titus", testament: "NT", chapters: 3, bolls: 56 },
  { id: "philemon", name: "Philemon", testament: "NT", chapters: 1, bolls: 57 },
  { id: "hebrews", name: "Hebrews", testament: "NT", chapters: 13, bolls: 58 },
  { id: "james", name: "James", testament: "NT", chapters: 5, bolls: 59 },
  { id: "1-peter", name: "1 Peter", testament: "NT", chapters: 5, bolls: 60 },
  { id: "2-peter", name: "2 Peter", testament: "NT", chapters: 3, bolls: 61 },
  { id: "1-john", name: "1 John", testament: "NT", chapters: 5, bolls: 62 },
  { id: "2-john", name: "2 John", testament: "NT", chapters: 1, bolls: 63 },
  { id: "3-john", name: "3 John", testament: "NT", chapters: 1, bolls: 64 },
  { id: "jude", name: "Jude", testament: "NT", chapters: 1, bolls: 65 },
  { id: "revelation", name: "Revelation", testament: "NT", chapters: 22, bolls: 66 },
];

const MORPHGNT_BOOKS = [
  { file: "61-Mt-morphgnt.txt", bookId: "matthew" },
  { file: "62-Mk-morphgnt.txt", bookId: "mark" },
  { file: "63-Lk-morphgnt.txt", bookId: "luke" },
  { file: "64-Jn-morphgnt.txt", bookId: "john" },
  { file: "65-Ac-morphgnt.txt", bookId: "acts" },
  { file: "66-Ro-morphgnt.txt", bookId: "romans" },
  { file: "67-1Co-morphgnt.txt", bookId: "1-corinthians" },
  { file: "68-2Co-morphgnt.txt", bookId: "2-corinthians" },
  { file: "69-Ga-morphgnt.txt", bookId: "galatians" },
  { file: "70-Eph-morphgnt.txt", bookId: "ephesians" },
  { file: "71-Php-morphgnt.txt", bookId: "philippians" },
  { file: "72-Col-morphgnt.txt", bookId: "colossians" },
  { file: "73-1Th-morphgnt.txt", bookId: "1-thessalonians" },
  { file: "74-2Th-morphgnt.txt", bookId: "2-thessalonians" },
  { file: "75-1Ti-morphgnt.txt", bookId: "1-timothy" },
  { file: "76-2Ti-morphgnt.txt", bookId: "2-timothy" },
  { file: "77-Tit-morphgnt.txt", bookId: "titus" },
  { file: "78-Phm-morphgnt.txt", bookId: "philemon" },
  { file: "79-Heb-morphgnt.txt", bookId: "hebrews" },
  { file: "80-Jas-morphgnt.txt", bookId: "james" },
  { file: "81-1Pe-morphgnt.txt", bookId: "1-peter" },
  { file: "82-2Pe-morphgnt.txt", bookId: "2-peter" },
  { file: "83-1Jn-morphgnt.txt", bookId: "1-john" },
  { file: "84-2Jn-morphgnt.txt", bookId: "2-john" },
  { file: "85-3Jn-morphgnt.txt", bookId: "3-john" },
  { file: "86-Jud-morphgnt.txt", bookId: "jude" },
  { file: "87-Re-morphgnt.txt", bookId: "revelation" },
];

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function stripTags(text) {
  return text
    .replace(/<S>\d+<\/S>/gi, "")     // remove Strong's number tags entirely
    .replace(/<br\s*\/?>/gi, " ")      // <br/> → space (prevents word merging)
    .replace(/<[^>]+>/g, "")           // strip remaining HTML tags
    .replace(/\s+/g, " ")
    .trim();
}

const bollsToBook = new Map(BIBLE_BOOKS.map((b) => [b.bolls, b]));

async function buildTranslation(transId, bollsSlug) {
  console.log(`\n📖 Downloading ${transId} (${bollsSlug})...`);
  const outDir = path.join(DATA_DIR, transId);
  const pubDir = path.join(PUBLIC_DIR, transId);
  ensureDir(outDir);
  ensureDir(pubDir);

  const url = `${BOLLS_CDN}/${bollsSlug}.json`;
  console.log(`  Fetching ${url}...`);
  const allVerses = await fetchJson(url);
  console.log(`  Got ${allVerses.length} verses`);

  const byBook = new Map();
  for (const row of allVerses) {
    const book = bollsToBook.get(row.book);
    if (!book) continue;
    if (!byBook.has(book.id)) byBook.set(book.id, {});
    const chapters = byBook.get(book.id);
    const ch = String(row.chapter);
    if (!chapters[ch]) chapters[ch] = [];
    chapters[ch].push({
      verse: row.verse,
      text: stripTags(row.text),
    });
  }

  const searchIndex = [];
  for (const book of BIBLE_BOOKS) {
    const chapters = byBook.get(book.id) ?? {};
    const file = {
      bookId: book.id,
      book: book.name,
      translation: transId.toUpperCase(),
      chapters,
    };
    const json = JSON.stringify(file);
    fs.writeFileSync(path.join(outDir, `${book.id}.json`), json);
    fs.writeFileSync(path.join(pubDir, `${book.id}.json`), json);

    for (const [ch, verses] of Object.entries(chapters)) {
      for (const v of verses) {
        searchIndex.push({
          reference: `${book.name} ${ch}:${v.verse}`,
          text: v.text,
          bookId: book.id,
          chapter: Number(ch),
          verse: v.verse,
        });
      }
    }
  }

  ensureDir(SEARCH_DIR);
  ensureDir(PUBLIC_SEARCH_DIR);
  const searchJson = JSON.stringify(searchIndex);
  fs.writeFileSync(path.join(SEARCH_DIR, `${transId}.json`), searchJson);
  fs.writeFileSync(path.join(PUBLIC_SEARCH_DIR, `${transId}.json`), searchJson);
  console.log(`  ✓ ${transId} done (${searchIndex.length} verses)`);
}

function sanitizeJson(s) {
  return s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
}

function extractJson(raw) {
  const start = raw.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    if (c === "}") { depth--; if (depth === 0) return raw.slice(start, i + 1); }
  }
  return raw.slice(start);
}

async function buildStrongs() {
  console.log("\n📚 Building Strong's lexicon...");
  ensureDir(STUDY_DIR);

  function stripNulls(s) { return s.replace(/\0/g, ""); }

  const [hebJsRaw, grkJsRaw] = await Promise.all([
    fetchText(STRONGS_HEB),
    fetchText(STRONGS_GRK),
  ]);
  const hebJs = stripNulls(hebJsRaw);
  const grkJs = stripNulls(grkJsRaw);

  const lexicon = {};

  function parseDict(js, lang) {
    const jsonStr = sanitizeJson(extractJson(js) ?? "");
    if (!jsonStr) return;
    let dict;
    try { dict = JSON.parse(jsonStr); } catch { return; }
    for (const [key, entry] of Object.entries(dict)) {
      const num = key.toUpperCase();
      lexicon[num] = {
        number: num,
        lemma: entry.lemma || entry.l || "",
        transliteration: entry.xlit || entry.translit || entry.x || "",
        pronunciation: entry.pron || "",
        definition: (entry.strongs_def || entry.kjv_def || entry.d || "").replace(/"/g, ""),
        language: lang,
      };
    }
  }

  parseDict(hebJs, "hebrew");
  parseDict(grkJs, "greek");
  const lexiconJson = JSON.stringify(lexicon);
  fs.writeFileSync(path.join(STUDY_DIR, "strongs.json"), lexiconJson);
  ensureDir(PUBLIC_STUDY_DIR);
  fs.writeFileSync(path.join(PUBLIC_STUDY_DIR, "strongs.json"), lexiconJson);
  console.log(`  ✓ ${Object.keys(lexicon).length} Strong's entries`);
  return lexicon;
}

const MORPHHB_TO_BOOK_ID = {
  Genesis: "genesis",
  Exodus: "exodus",
  Leviticus: "leviticus",
  Numbers: "numbers",
  Deuteronomy: "deuteronomy",
  Joshua: "joshua",
  Judges: "judges",
  Ruth: "ruth",
  "I Samuel": "1-samuel",
  "II Samuel": "2-samuel",
  "I Kings": "1-kings",
  "II Kings": "2-kings",
  "I Chronicles": "1-chronicles",
  "II Chronicles": "2-chronicles",
  Ezra: "ezra",
  Nehemiah: "nehemiah",
  Esther: "esther",
  Job: "job",
  Psalms: "psalms",
  Proverbs: "proverbs",
  Ecclesiastes: "ecclesiastes",
  "Song of Solomon": "song-of-solomon",
  Isaiah: "isaiah",
  Jeremiah: "jeremiah",
  Lamentations: "lamentations",
  Ezekiel: "ezekiel",
  Daniel: "daniel",
  Hosea: "hosea",
  Joel: "joel",
  Amos: "amos",
  Obadiah: "obadiah",
  Jonah: "jonah",
  Micah: "micah",
  Nahum: "nahum",
  Habakkuk: "habakkuk",
  Zephaniah: "zephaniah",
  Haggai: "haggai",
  Zechariah: "zechariah",
  Malachi: "malachi",
};

const GREEK_ROMAN = {
  α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "ē", θ: "th",
  ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p",
  ρ: "r", σ: "s", ς: "s", τ: "t", υ: "u", φ: "ph", χ: "ch", ψ: "ps", ω: "ō",
  ἀ: "a", ἁ: "ha", ἂ: "a", ἃ: "ha", ἄ: "a", ἅ: "ha",
  ἐ: "e", ἑ: "he", ἒ: "e", ἓ: "he", ἔ: "e", ἕ: "he",
  ἠ: "ē", ἡ: "hē", ἢ: "ē", ἣ: "hē", ἤ: "ē", ἥ: "hē",
  ἰ: "i", ἱ: "hi", ἲ: "i", ἳ: "hi", ἴ: "i", ἵ: "hi",
  ὀ: "o", ὁ: "ho", ὂ: "o", ὃ: "ho", ὄ: "o", ὅ: "ho",
  ὐ: "u", ὑ: "hu", ὒ: "u", ὓ: "hu", ὔ: "u", ὕ: "hu",
  ὠ: "ō", ὡ: "hō", ὢ: "ō", ὣ: "hō", ὤ: "ō", ὥ: "hō",
  ᾳ: "a", ᾴ: "a", ᾶ: "a", ᾷ: "a", ᾰ: "a", ᾱ: "a", ᾲ: "a", ᾳ: "a", ᾴ: "a", ᾶ: "a", ᾷ: "a",
};

function stripDiacritics(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

function transliterateGreek(text) {
  let out = "";
  for (const ch of stripDiacritics(text)) {
    out += GREEK_ROMAN[ch] ?? GREEK_ROMAN[ch.toLowerCase()] ?? ch;
  }
  return out;
}

function stripHebrewMarks(text) {
  return text
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/\//g, "");
}

function parseStrongsFromLemma(lemma) {
  const m = lemma.match(/H(\d+)/i);
  return m ? `H${m[1]}` : null;
}

function parseMorphPos(morph) {
  const part = morph.includes("/") ? morph.split("/").pop() : morph;
  const code = part.replace(/^[^A-Za-z]*/, "").charAt(0).toUpperCase();
  return code || undefined;
}

function glossFromStrongs(lexicon, strongs) {
  if (!strongs) return null;
  const entry = lexicon[strongs];
  if (!entry?.definition) return null;
  return entry.definition.split(/[;,]/)[0]?.trim() || null;
}

function normalizeGreekLemma(lemma) {
  return stripDiacritics(lemma.replace(/[,;.:()]+$/g, "")).toLowerCase();
}

function buildGreekLemmaIndex(lexicon) {
  const index = new Map();
  for (const [num, entry] of Object.entries(lexicon)) {
    if (entry.language !== "greek") continue;
    const key = normalizeGreekLemma(entry.lemma ?? "");
    if (key && !index.has(key)) index.set(key, num);
  }
  return index;
}

function lemmaToStrongsGuess(lemma, greekLemmaIndex) {
  return greekLemmaIndex.get(normalizeGreekLemma(lemma)) ?? null;
}

function writeStudyChapter(bookId, chapter, data) {
  const dir = path.join(STUDY_DIR, "verses", bookId);
  ensureDir(dir);
  const json = JSON.stringify(data);
  fs.writeFileSync(path.join(dir, `${chapter}.json`), json);
  const publicDir = path.join(PUBLIC_STUDY_DIR, "verses", bookId);
  ensureDir(publicDir);
  fs.writeFileSync(path.join(publicDir, `${chapter}.json`), json);
}

async function buildMorphGnt(lexicon) {
  console.log("\n🇬🇷 Building Greek word study index...");
  const greekLemmaIndex = buildGreekLemmaIndex(lexicon);
  let chapterCount = 0;
  let nextIndex = 0;
  let firstError = null;

  async function worker() {
    while (!firstError) {
      const index = nextIndex++;
      if (index >= MORPHGNT_BOOKS.length) return;

      const { file, bookId } = MORPHGNT_BOOKS[index];
      const book = BIBLE_BOOKS.find((b) => b.id === bookId);
      if (!book) continue;

      try {
        console.log(`  Fetching ${book.name} (${file})...`);
        const text = await fetchText(`${MORPHGNT}/${file}`);
        const byChapter = {};

        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          const parts = line.trim().split(/\s+/);
          if (parts.length < 7) continue;
          const ref = parts[0];
          const morph = parts[1];
          const word = parts[3];
          const lemma = parts[parts.length - 1];
          if (!ref || ref.length < 6) continue;

          const chapter = Number(ref.slice(2, 4));
          const verse = Number(ref.slice(4, 6));
          if (!chapter || !verse) continue;

          if (!byChapter[chapter]) {
            byChapter[chapter] = { book: book.name, bookId, language: "greek", verses: {} };
          }
          const vk = String(verse);
          if (!byChapter[chapter].verses[vk]) byChapter[chapter].verses[vk] = [];

          const strongs = lemmaToStrongsGuess(lemma, greekLemmaIndex);
          const strongsEntry = strongs ? lexicon[strongs] : null;
          const pos = morph.replace(/-$/, "").charAt(0).toUpperCase() || parseMorphPos(morph);

          byChapter[chapter].verses[vk].push({
            position: byChapter[chapter].verses[vk].length + 1,
            original: word,
            transliteration: strongsEntry?.transliteration || transliterateGreek(lemma),
            lemma,
            strongs,
            gloss: glossFromStrongs(lexicon, strongs) || transliterateGreek(lemma),
            language: "greek",
            pos,
          });
        }

        const chapters = Object.entries(byChapter);
        for (const [ch, data] of chapters) writeStudyChapter(bookId, ch, data);
        chapterCount += chapters.length;
        console.log(`  ✓ ${book.name}: ${chapters.length} chapters`);
      } catch (error) {
        firstError ??= error;
      }
    }
  }

  const workerCount = Math.min(MORPHGNT_CONCURRENCY, MORPHGNT_BOOKS.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  if (firstError) throw firstError;
  console.log(`  ✓ Greek study: ${chapterCount} chapters`);
}

function buildHebrewStudy(lexicon) {
  console.log("\n🇮🇱 Building Hebrew word study index...");
  let chapterCount = 0;

  for (const [morphName, bookId] of Object.entries(MORPHHB_TO_BOOK_ID)) {
    const chapters = morphhb[morphName];
    if (!chapters) continue;
    const book = BIBLE_BOOKS.find((b) => b.id === bookId);
    if (!book) continue;

    chapters.forEach((verses, chapterIdx) => {
      const chapter = chapterIdx + 1;
      const data = { book: book.name, bookId, language: "hebrew", verses: {} };

      verses.forEach((words, verseIdx) => {
        const vk = String(verseIdx + 1);
        data.verses[vk] = words.map((w, i) => {
          const [wordStr, lemmaField, morph] = w;
          const strongs = parseStrongsFromLemma(lemmaField);
          const strongsEntry = strongs ? lexicon[strongs] : null;
          const display = stripHebrewMarks(wordStr);
          return {
            position: i + 1,
            original: display,
            transliteration: strongsEntry?.transliteration || "",
            lemma: strongsEntry?.lemma || display,
            strongs,
            gloss: glossFromStrongs(lexicon, strongs) || display,
            language: "hebrew",
            pos: parseMorphPos(morph),
          };
        });
      });

      writeStudyChapter(bookId, chapter, data);
      chapterCount++;
    });
  }
  console.log(`  ✓ Hebrew study: ${chapterCount} chapters`);
}

async function main() {
  const studyOnly = process.argv.includes("--study-only");
  const skipIfBuilt = process.argv.includes("--skip-if-built");
  if (skipIfBuilt) {
    const marker = path.join(PUBLIC_DIR, "kjv");
    if (fs.existsSync(marker) && fs.readdirSync(marker).length > 0) {
      console.log("Bible data already present in public/, skipping build.\n");
      return;
    }
  }
  console.log("LifeOS Bible data build\n");
  if (studyOnly) console.log("Mode: study data only\n");
  else console.log("Translations: " + TRANSLATIONS.map((t) => t.id.toUpperCase()).join(", "));
  ensureDir(DATA_DIR);
  ensureDir(PUBLIC_DIR);

  const lexicon = await buildStrongs();

  if (!studyOnly) {
    for (const trans of TRANSLATIONS) {
      await buildTranslation(trans.id, trans.slug);
    }
  }

  buildHebrewStudy(lexicon);
  await buildMorphGnt(lexicon);

  const manifest = {
    builtAt: new Date().toISOString(),
    translations: TRANSLATIONS.map((t) => t.id),
    study: { strongs: true, greek: true, hebrew: true },
  };
  fs.writeFileSync(path.join(DATA_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\n✅ Bible data build complete!");
  if (!studyOnly) console.log("   All 6 translations fully offline.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
