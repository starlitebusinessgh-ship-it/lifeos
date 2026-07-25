#!/usr/bin/env node
/**
 * Generates PWA / iOS home screen PNG icons from the master logo.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
const appDir = path.join(__dirname, "..", "app");
const master = path.join(outDir, "icon-source.png");

const SIZES = [
  { name: "icon-180.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function main() {
  if (!fs.existsSync(master)) {
    console.error("Missing master logo:", master);
    console.error("Add icon-source.png (512×512) to public/icons/ first.");
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const { name, size } of SIZES) {
    const out = path.join(outDir, name);
    await sharp(master)
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log("Wrote", out);
  }

  // Next.js app icon
  await sharp(master).resize(512, 512).png().toFile(path.join(appDir, "icon.png"));
  await sharp(master).resize(180, 180).png().toFile(path.join(appDir, "apple-icon.png"));
  console.log("Wrote app/icon.png and app/apple-icon.png");

  // Maskable: same art with extra padding for Android adaptive icons
  const maskableSize = 512;
  const inner = Math.round(maskableSize * 0.72);
  const pad = Math.round((maskableSize - inner) / 2);
  await sharp(master)
    .resize(inner, inner, { fit: "cover" })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 73, g: 79, b: 223, alpha: 1 },
    })
    .png()
    .toFile(path.join(outDir, "icon-maskable-512.png"));
  console.log("Wrote icon-maskable-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
