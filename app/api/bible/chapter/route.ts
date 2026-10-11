import { NextResponse } from "next/server";
import { getBibleBook } from "@/lib/bible/books";
import { BIBLE_TRANSLATIONS, getTranslation } from "@/lib/bible/translations";

interface LocalBookFile {
  bookId: string;
  book: string;
  translation: string;
  chapters: Record<string, { verse: number; text: string }[]>;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("book") ?? "";
  const chapter = Number(searchParams.get("chapter"));
  const requestedTranslation = searchParams.get("translation") ?? "kjv";
  const book = getBibleBook(bookId);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return NextResponse.json({ error: "Unknown book or invalid chapter" }, { status: 404 });
  }

  if (!BIBLE_TRANSLATIONS.some((item) => item.id === requestedTranslation)) {
    return NextResponse.json({ error: "Unknown translation" }, { status: 400 });
  }

  const translation = getTranslation(requestedTranslation);
  const assetUrl = new URL(
    `/bible/data/${translation.id}/${encodeURIComponent(book.id)}.json`,
    req.url
  );

  try {
    const headers = new Headers();
    for (const name of ["cookie", "authorization", "x-vercel-protection-bypass"]) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = await fetch(assetUrl, { cache: "force-cache", headers });
    if (!response.ok) {
      return NextResponse.json({ error: "Bible text is unavailable" }, { status: 404 });
    }

    const file = (await response.json()) as LocalBookFile;
    const verses = file.chapters[String(chapter)];
    if (!verses?.length) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({
      book: book.name,
      bookId: book.id,
      chapter,
      translation: translation.short,
      reference: `${book.name} ${chapter}`,
      verses,
    });
  } catch {
    return NextResponse.json({ error: "Unable to load Bible text" }, { status: 502 });
  }
}
