/** wldeh/bible-api uses book folder names without hyphens */
export function wldehBookSlug(bookId: string): string {
  return bookId.replace(/-/g, "");
}
