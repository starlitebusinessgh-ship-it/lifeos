"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LibraryBook } from "@/lib/learn/types";
import { BookSpineCard } from "./BookSpineCard";
import { haptic } from "@/lib/finance/haptics";

export function LibraryRow({
  title,
  subtitle,
  books,
  seeAllHref,
}: {
  title: string;
  subtitle?: string;
  books: LibraryBook[];
  seeAllHref?: string;
}) {
  if (books.length === 0) return null;

  return (
    <section className="ln-row" aria-label={title}>
      <div className="ln-row-head">
        <div>
          <h2 className="ln-row-title">{title}</h2>
          {subtitle && <p className="ln-row-sub">{subtitle}</p>}
        </div>
        {seeAllHref && books.length > 4 && (
          <Link
            href={seeAllHref}
            className="ln-row-see-all"
            onClick={() => haptic("light")}
          >
            See All
            <ChevronRight size={15} strokeWidth={2} />
          </Link>
        )}
      </div>
      <div className="ln-row-track">
        {books.map((book) => (
          <BookSpineCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
