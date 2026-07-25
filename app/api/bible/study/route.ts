import { NextResponse } from "next/server";
import { loadVerseStudy } from "@/lib/bible/study";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const book = searchParams.get("book");
  const chapter = Number(searchParams.get("chapter"));
  const verse = Number(searchParams.get("verse"));

  if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
    return NextResponse.json({ error: "book, chapter, and verse required" }, { status: 400 });
  }

  const result = loadVerseStudy(book, chapter, verse);
  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }
  return NextResponse.json(result);
}
