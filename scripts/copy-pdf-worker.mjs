import fs from "node:fs";
import path from "node:path";

const candidates = [
  "node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
];

const dest = path.join(process.cwd(), "public", "pdf.worker.min.mjs");

for (const rel of candidates) {
  const src = path.join(process.cwd(), rel);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("Copied PDF worker to public/pdf.worker.min.mjs");
    process.exit(0);
  }
}

console.warn("pdf.worker.min.mjs not found in node_modules — reader may not work until you run npm install");
process.exit(0);
