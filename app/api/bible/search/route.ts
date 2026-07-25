import { NextResponse } from "next/server";
import { searchBible } from "@/lib/bible/fetch";
import type { BibleTranslationId } from "@/lib/bible/translations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const translation = (searchParams.get("translation") ?? "kjv") as BibleTranslationId;

  const result = await searchBible(q, translation);
  if ("error" in result) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json({ hits: result });
}
