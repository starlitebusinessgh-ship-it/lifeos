import type { ShelfSortKey, ShelfViewMode } from "./shelfQuery";
import { DEFAULT_SHELF_FILTERS, type ShelfFilters } from "./shelfQuery";

export interface ShelfPrefs {
  view: ShelfViewMode;
  sort: ShelfSortKey;
  filters: ShelfFilters;
}

const DEFAULT: ShelfPrefs = {
  view: "grid",
  sort: "recently_read",
  filters: DEFAULT_SHELF_FILTERS,
};

function storageKey(categorySlug: string): string {
  return `lifeos.learn.shelf.${categorySlug}`;
}

export function loadShelfPrefs(categorySlug: string): ShelfPrefs {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(storageKey(categorySlug));
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<ShelfPrefs>;
    return {
      view: parsed.view === "list" ? "list" : "grid",
      sort: parsed.sort ?? DEFAULT.sort,
      filters: { ...DEFAULT.filters, ...parsed.filters },
    };
  } catch {
    return DEFAULT;
  }
}

export function saveShelfPrefs(categorySlug: string, prefs: ShelfPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(categorySlug), JSON.stringify(prefs));
}
