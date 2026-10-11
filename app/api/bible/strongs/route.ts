import { NextResponse } from "next/server";

interface StrongsEntry {
  number: string;
  lemma: string;
  transliteration: string;
  pronunciation?: string;
  definition: string;
  language: "hebrew" | "greek";
}

export async function GET(req: Request) {
  const number = new URL(req.url).searchParams.get("number");
  if (!number) {
    return NextResponse.json({ error: "number required (e.g. G26 or H7225)" }, { status: 400 });
  }

  const key = number.trim().toUpperCase();
  if (!/^[HG]\d+$/.test(key)) {
    return NextResponse.json({ error: "Invalid Strong's number" }, { status: 400 });
  }

  try {
    const assetUrl = new URL("/bible/data/study/strongs.json", req.url);
    const response = await fetch(assetUrl, { cache: "force-cache" });
    if (!response.ok) {
      return NextResponse.json({ error: "Strong's lexicon is unavailable" }, { status: 502 });
    }

    const lexicon = (await response.json()) as Record<string, StrongsEntry>;
    const entry = lexicon[key];
    if (!entry) {
      return NextResponse.json({ error: "Strong's entry not found" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Unable to load Strong's lexicon" }, { status: 502 });
  }
}
