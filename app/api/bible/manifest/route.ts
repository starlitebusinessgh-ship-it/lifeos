import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Legacy manifest endpoint — kept for cached clients / typegen. */
export async function GET() {
  const manifestPath = path.join(process.cwd(), "data", "bible", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return NextResponse.json({ translations: [], study: {} });
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return NextResponse.json(manifest);
  } catch {
    return NextResponse.json({ translations: [], study: {} });
  }
}
