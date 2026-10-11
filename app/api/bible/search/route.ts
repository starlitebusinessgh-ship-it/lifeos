import { NextResponse } from "next/server";
import { BIBLE_TRANSLATIONS, getTranslation } from "@/lib/bible/translations";

interface BibleSearchHit {
  reference: string;
  text: string;
  bookId?: string;
  chapter?: number;
  verse?: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const requestedTranslation = searchParams.get("translation") ?? "kjv";

  if (!BIBLE_TRANSLATIONS.some((item) => item.id === requestedTranslation)) {
    return NextResponse.json({ error: "Unknown translation" }, { status: 400 });
  }

  if (query.length < 3) return NextResponse.json({ hits: [] });

  const translation = getTranslation(requestedTranslation);
  const assetUrl = new URL(`/bible/data/search/${translation.id}.json`, req.url);

  try {
    const headers = new Headers();
    for (const name of ["cookie", "authorization", "x-vercel-protection-bypass"]) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = await fetch(assetUrl, { cache: "force-cache", headers });
    if (!response.ok) {
      return NextResponse.json({ error: "Bible search index is unavailable" }, { status: 502 });
    }

    const index = (await response.json()) as BibleSearchHit[];
    const needle = query.toLowerCase();
    const hits = index.filter((hit) => hit.text.toLowerCase().includes(needle)).slice(0, 40);
    return NextResponse.json({ hits });
  } catch {
    return NextResponse.json({ error: "Unable to search Bible text" }, { status: 502 });
  }
}
