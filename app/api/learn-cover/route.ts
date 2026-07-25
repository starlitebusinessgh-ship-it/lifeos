import { NextResponse } from "next/server";
import { lookupCoverUrl } from "@/lib/learn/coverLookup";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const author = searchParams.get("author");

  if (!title?.trim()) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  const url = await lookupCoverUrl(title, author);
  return NextResponse.json({ url });
}
