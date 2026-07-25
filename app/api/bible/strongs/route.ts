import { NextResponse } from "next/server";
import { lookupStrongs } from "@/lib/bible/study";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = searchParams.get("number");
  if (!number) {
    return NextResponse.json({ error: "number required (e.g. G26 or H7225)" }, { status: 400 });
  }

  const entry = lookupStrongs(number);
  if (!entry) {
    return NextResponse.json({ error: "Strong's entry not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}
