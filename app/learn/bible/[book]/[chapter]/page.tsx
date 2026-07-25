import { notFound } from "next/navigation";
import { BibleChapterView } from "@/components/learn/BibleChapterView";
import { getBibleBook } from "@/lib/bible/books";

export default async function BibleChapterPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const { book: bookId, chapter: chapterStr } = await params;
  const book = getBibleBook(bookId);
  const chapter = Number(chapterStr);
  if (!book || !Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  return (
    <div className="ln-in-shell">
      <BibleChapterView bookId={bookId} chapter={chapter} />
    </div>
  );
}
