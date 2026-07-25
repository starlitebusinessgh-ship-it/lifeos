import { NextResponse } from "next/server";
import { fetchBibleChapter } from "@/lib/bible/fetch";
import type { BibleTranslationId } from "@/lib/bible/translations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const book = searchParams.get("book");
  const chapter = Number(searchParams.get("chapter"));
  const translation = (searchParams.get("translation") ?? "kjv") as BibleTranslationId;

  if (!book || !Number.isFinite(chapter)) {
    return NextResponse.json({ error: "book and chapter required" }, { status: 400 });
  }

  const result = await fetchBibleChapter(book, chapter, translation);
  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }
  return NextResponse.json(result);
}
