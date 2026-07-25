const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000/ws/display";

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data.detail ?? data);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function fetchTranslations(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/translations`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.translations as string[];
}

export async function pushVerse(body: {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function pushChapter(body: {
  translation: string;
  book: string;
  chapter: number;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/push/chapter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function pushClear(): Promise<void> {
  const res = await fetch(`${API_BASE}/push/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await parseError(res));
}
