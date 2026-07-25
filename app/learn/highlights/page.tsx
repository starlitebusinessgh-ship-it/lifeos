"use client";

import { GlobalHighlights } from "@/components/learn/GlobalHighlights";

export default function LearnHighlightsPage() {
  return (
    <div className="ln-in-shell">
      <div className="ln-shell ln-shell-highlights">
        <header className="ln-rn-page-head ln-rn-page-head--library">
          <h1 className="ln-rn-page-title">Highlights</h1>
        </header>
        <p className="ln-page-lead">Every passage you marked, across your library</p>
        <GlobalHighlights />
      </div>
    </div>
  );
}
