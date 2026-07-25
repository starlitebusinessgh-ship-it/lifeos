"use client";



import { useMemo, useState } from "react";

import Link from "next/link";

import { GitBranch, Highlighter, Plus } from "lucide-react";

import { useLibrary } from "@/lib/learn/useLibrary";

import { pickCoverColor } from "@/lib/learn/covers";

import { computeReadingStats } from "@/lib/learn/analytics";

import { useReadingAnalytics } from "@/lib/learn/useReadingAnalytics";

import type { LibraryBook } from "@/lib/learn/types";

import { CollectionCategoryGrid } from "@/components/learn/CollectionCategoryGrid";
import { LibraryHomeEmpty } from "@/components/learn/LibraryHomeEmpty";

import { LearnStatsBar } from "@/components/learn/LearnStatsBar";

import { LearnAiBriefing } from "@/components/learn/LearnAiBriefing";

import { LearnLifePicks } from "@/components/learn/LearnLifePicks";

import { ReadingNowView } from "@/components/learn/ReadingNowView";
import { LearnBooksTabBar, type LearnBooksTab } from "@/components/learn/LearnBooksTabBar";
import { CollectionsList } from "@/components/learn/CollectionsList";
import { ReadingHistoryChart } from "@/components/learn/ReadingHistoryChart";
import { ReadingChallenges } from "@/components/learn/ReadingChallenges";
import { ReadingGoalBar } from "@/components/learn/ReadingGoalBar";

import { useLearnChrome } from "@/components/learn/LearnChromeContext";

import { AddBookSheet, type AddBookMeta } from "@/components/learn/AddBookSheet";

import { haptic } from "@/lib/finance/haptics";

import { useToast } from "@/components/finance/ToastProvider";



export function LearnCollections() {

  const { books, loading, addBook, deleteBook, updateReadingState } = useLibrary();

  const { log, highlightsThisWeek } = useReadingAnalytics(books.length);

  const { showToast } = useToast();

  const chrome = useLearnChrome();

  const [tab, setTab] = useState<LearnBooksTab>("reading");

  const [sheetOpen, setSheetOpen] = useState(false);

  const [saving, setSaving] = useState(false);



  const categoryCounts = useMemo(() => {

    const counts: Record<string, number> = { all: books.length };

    for (const b of books) {

      counts[b.category] = (counts[b.category] ?? 0) + 1;

    }

    return counts;

  }, [books]);



  const readingStats = useMemo(

    () => computeReadingStats(books, log, highlightsThisWeek),

    [books, log, highlightsThisWeek]

  );



  async function handleAdd(file: File, meta: AddBookMeta) {

    setSaving(true);

    const { book, error } = await addBook(file, {

      title: meta.title,

      author: meta.author,

      category: meta.category,

      cover_color: pickCoverColor(meta.title),

      reading_state: meta.reading_state,

      tags: meta.tags,

      series: meta.series,

      series_index: meta.series_index,

      publisher: meta.publisher,

      published_year: meta.published_year,

    });

    setSaving(false);

    if (error || !book) {

      showToast(error ?? "Could not add book");

      return;

    }

    haptic("success");

    showToast("Added to your library");

    setSheetOpen(false);

  }



  async function handleDelete(book: LibraryBook) {

    if (!window.confirm(`Remove "${book.title}" from your library?`)) return;

    const ok = await deleteBook(book);

    if (ok) {

      haptic("light");

      showToast("Book removed");

    } else {

      showToast("Could not remove book");

    }

  }



  async function handlePause(book: LibraryBook) {

    const ok = await updateReadingState(book.id, "paused");

    if (ok) showToast("Marked as paused");

  }



  async function handleMarkFinished(book: LibraryBook) {

    const ok = await updateReadingState(book.id, "finished");

    if (ok) showToast("Marked as finished");

  }



  return (

    <>

      <div className={`ln-shell ln-shell-home ln-shell-tab-${tab}`}>

        {loading && books.length === 0 ? (

          <div className="ln-home-loading">

            <div className="ln-skel-row" />

            <div className="ln-skel-row" />

            <div className="ln-skel-shelf ln-skel-shelf--featured" />

          </div>

        ) : books.length === 0 ? (

          <LibraryHomeEmpty onAdd={() => setSheetOpen(true)} />

        ) : (

          <>

            {tab === "reading" && (
              <ReadingNowView
                books={books}
                onRemove={(book) => void handleDelete(book)}
                onPause={(book) => void handlePause(book)}
                onMarkFinished={(book) => void handleMarkFinished(book)}
                onOpenMenu={() => chrome?.openDrawer()}
              />
            )}



            {tab === "library" && (

              <div className="ln-home-panel ln-home-panel--library">

                <header className="ln-rn-page-head ln-rn-page-head--library">

                  <h1 className="ln-rn-page-title">Library</h1>

                </header>

                <CollectionCategoryGrid counts={categoryCounts} books={books} />
                <CollectionsList books={books} />
              </div>

            )}



            {tab === "insights" && (

              <div className="ln-home-panel ln-home-panel--insights">

                <header className="ln-rn-page-head ln-rn-page-head--library">

                  <h1 className="ln-rn-page-title">Insights</h1>

                </header>

                <LearnStatsBar stats={readingStats} />
                <ReadingGoalBar stats={readingStats} />
                <ReadingHistoryChart log={log} />
                <ReadingChallenges books={books} />

                <LearnLifePicks
                  books={books}
                  stats={readingStats}
                  onMarkWantToRead={async (id) => updateReadingState(id, "want_to_read")}
                />

                <LearnAiBriefing books={books} log={log} stats={readingStats} />

                <div className="ln-insights-links">

                  <Link href="/learn/highlights" className="ln-insights-link" onClick={() => haptic("light")}>

                    <Highlighter size={18} strokeWidth={2} />

                    <span>All highlights</span>

                  </Link>

                  <Link href="/learn/mind" className="ln-insights-link" onClick={() => haptic("light")}>

                    <GitBranch size={18} strokeWidth={2} />

                    <span>Mind map</span>

                  </Link>

                </div>

              </div>

            )}

          </>

        )}

      </div>



      {books.length > 0 && tab === "library" && (

        <button

          type="button"

          className="ln-fab"

          aria-label="Add book"

          onClick={() => {

            haptic("light");

            setSheetOpen(true);

          }}

        >

          <Plus size={24} strokeWidth={2} />

        </button>

      )}



      {books.length > 0 && (

        <LearnBooksTabBar

          active={tab}

          onChange={setTab}

          onSearch={() => chrome?.openSearch()}

        />

      )}



      <AddBookSheet

        open={sheetOpen}

        saving={saving}

        onClose={() => setSheetOpen(false)}

        onAdd={handleAdd}

      />

    </>

  );

}

