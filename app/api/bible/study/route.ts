import { NextResponse } from "next/server";
import { getBibleBook } from "@/lib/bible/books";

interface VerseStudyFile {
  book: string;
  bookId: string;
  language: "hebrew" | "greek";
  verses: Record<string, unknown[]>;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("book") ?? "";
  const chapter = Number(searchParams.get("chapter"));
  const verse = Number(searchParams.get("verse"));
  const book = getBibleBook(bookId);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters ||
      !Number.isInteger(verse) || verse < 1) {
    return NextResponse.json(
      { error: "Valid book, chapter, and verse required" },
      { status: 400 }
    );
  }

  try {
    const assetUrl = new URL(
      `/bible/data/study/verses/${encodeURIComponent(book.id)}/${chapter}.json`,
      req.url
    );
    const response = await fetch(assetUrl, { cache: "force-cache" });
    if (!response.ok) {
      return NextResponse.json({ error: "Study data not found for this chapter" }, { status: 404 });
    }

    const data = (await response.json()) as VerseStudyFile;
    const words = data.verses[String(verse)];
    if (!words?.length) {
      return NextResponse.json({ error: "Verse not found in study index" }, { status: 404 });
    }

    return NextResponse.json({
      book: data.book,
      bookId: data.bookId,
      chapter,
      verse,
      words,
      language: data.language,
    });
  } catch {
    return NextResponse.json({ error: "Unable to load study data" }, { status: 502 });
  }
}
