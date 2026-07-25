const PALETTES: [string, string][] = [
  ["#6d5ce8", "#9b87f5"],
  ["#5b6ee8", "#8b9fff"],
  ["#7c3aed", "#a78bfa"],
  ["#4f46e5", "#818cf8"],
  ["#9333ea", "#c084fc"],
  ["#2563eb", "#60a5fa"],
  ["#0d9488", "#2dd4bf"],
  ["#c026d3", "#e879f9"],
  ["#dc2626", "#f87171"],
  ["#b45309", "#fbbf24"],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickCoverColor(seed: string): string {
  return PALETTES[hashString(seed) % PALETTES.length][0];
}

export function coverPatternIndex(seed: string): number {
  return hashString(seed) % 4;
}

export function coverGradient(primary: string): string {
  const match = PALETTES.find(([a]) => a === primary);
  if (match) return `linear-gradient(145deg, ${match[0]} 0%, ${match[1]} 100%)`;
  return `linear-gradient(145deg, ${primary} 0%, ${lighten(primary)} 100%)`;
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 40);
  const g = Math.min(255, ((n >> 8) & 0xff) + 40);
  const b = Math.min(255, (n & 0xff) + 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function titleFromFilename(name: string): string {
  return name
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
