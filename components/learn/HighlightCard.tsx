"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Inbox, Pin, Sun, Trash2 } from "lucide-react";
import type { LibraryHighlight } from "@/lib/learn/types";
import type { HighlightWithBook } from "@/lib/learn/highlightActions";
import type { KnowledgeLink } from "@/lib/learn/knowledge";
import { linkTypeLabel } from "@/lib/learn/knowledge";
import { haptic } from "@/lib/finance/haptics";

type HighlightItem = LibraryHighlight | HighlightWithBook;

function bookTitle(h: HighlightItem): string | null {
  return "book_title" in h ? h.book_title : null;
}

export function HighlightCard({
  highlight,
  bookId,
  links = [],
  onInbox,
  onToday,
  onPin,
  onDelete,
  onJumpToPage,
}: {
  highlight: HighlightItem;
  bookId?: string;
  links?: KnowledgeLink[];
  onInbox?: () => void;
  onToday?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
  onJumpToPage?: (page: number) => void;
}) {
  const title = bookTitle(highlight);
  const showBook = title && !bookId;

  return (
    <article className="ln-hl-card" style={{ "--hl-accent": highlight.color } as CSSProperties}>
      <div className="ln-hl-card-stripe" aria-hidden />
      <div className="ln-hl-card-body">
        {showBook && (
          <Link href={`/learn/${highlight.book_id}`} className="ln-hl-card-book" onClick={() => haptic("light")}>
            {title}
          </Link>
        )}
        {highlight.page != null && (
          <button
            type="button"
            className="ln-hl-card-page"
            onClick={() => {
              if (highlight.page && onJumpToPage) {
                haptic("light");
                onJumpToPage(highlight.page);
              }
            }}
          >
            Page {highlight.page}
          </button>
        )}
        <blockquote className="ln-hl-card-quote">&ldquo;{highlight.quote}&rdquo;</blockquote>
        {highlight.note && <p className="ln-hl-card-note">{highlight.note}</p>}

        {links.length > 0 && (
          <ul className="ln-hl-links">
            {links.map((link) => (
              <li key={link.id} className={`ln-hl-link ln-hl-link--${link.link_type}`}>
                {linkTypeLabel(link.link_type)}
                {link.idea_title ? ` · ${link.idea_title}` : ""}
              </li>
            ))}
          </ul>
        )}

        <div className="ln-hl-card-actions">
          {onPin && (
            <button type="button" className="ln-hl-action" onClick={() => { haptic("light"); onPin(); }}>
              <Pin size={14} />
              Pin
            </button>
          )}
          {onInbox && (
            <button type="button" className="ln-hl-action" onClick={() => { haptic("light"); onInbox(); }}>
              <Inbox size={14} />
              Inbox
            </button>
          )}
          {onToday && (
            <button type="button" className="ln-hl-action" onClick={() => { haptic("light"); onToday(); }}>
              <Sun size={14} />
              Today
            </button>
          )}
          {onDelete && (
            <button type="button" className="ln-hl-action danger" onClick={() => { haptic("light"); onDelete(); }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
