"use client";



import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { Plus } from "lucide-react";

import { useLibrary } from "@/lib/learn/useLibrary";

import { pickCoverColor } from "@/lib/learn/covers";

import type { LibraryBook, LibraryBookMetaUpdate, ReadingState } from "@/lib/learn/types";

import type { CategoryId } from "@/lib/learn/categories";

import { getCategoryDef } from "@/lib/learn/categories";

import { collectionHref, categoryToSlug } from "@/lib/learn/routes";

import {

  applyShelfQuery,

  collectSeriesFromBooks,

  type ShelfFilters,

  type ShelfSortKey,

  type ShelfViewMode,

} from "@/lib/learn/shelfQuery";

import { loadShelfPrefs, saveShelfPrefs } from "@/lib/learn/shelfPrefs";

import { collectTagsFromBooks } from "@/lib/learn/tags";

import { BookTile } from "@/components/learn/BookTile";

import { BookListRow } from "@/components/learn/BookListRow";

import { ShelfToolbar } from "@/components/learn/ShelfToolbar";

import { AddBookSheet } from "@/components/learn/AddBookSheet";

import type { AddBookMeta } from "@/components/learn/AddBookSheet";

import { EditBookSheet } from "@/components/learn/EditBookSheet";

import { haptic } from "@/lib/finance/haptics";

import { useToast } from "@/components/finance/ToastProvider";



export function LearnCollectionShelf({
  categoryId,
  topicTag,
  titleOverride,
  taglineOverride,
  bannerImage,
  patternOverride,
  backHref = "/learn",
}: {
  categoryId: CategoryId;
  topicTag?: string;
  titleOverride?: string;
  taglineOverride?: string;
  bannerImage?: string;
  patternOverride?: string;
  backHref?: string;
}) {

  const router = useRouter();

  const cat = getCategoryDef(categoryId);

  const slug = topicTag ? `${categoryToSlug(categoryId)}-${topicTag.toLowerCase()}` : categoryToSlug(categoryId);

  const { books, loading, addBook, deleteBook, updateReadingState, updateBookMeta } = useLibrary();

  const { showToast } = useToast();



  const [sheetOpen, setSheetOpen] = useState(false);

  const [editBook, setEditBook] = useState<LibraryBook | null>(null);

  const [saving, setSaving] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [view, setView] = useState<ShelfViewMode>("grid");

  const [sort, setSort] = useState<ShelfSortKey>("recently_read");

  const [filters, setFilters] = useState<ShelfFilters>({ query: "", status: "all", tag: "all", series: "all" });



  useEffect(() => {

    const prefs = loadShelfPrefs(slug);

    setView(prefs.view);

    setSort(prefs.sort);

    setFilters(prefs.filters);

  }, [slug]);



  useEffect(() => {

    saveShelfPrefs(slug, { view, sort, filters });

  }, [slug, view, sort, filters]);



  const categoryBooks = useMemo(() => {

    let list = categoryId === "All" ? books : books.filter((b) => b.category === categoryId);

    if (topicTag) {
      const tag = topicTag.toLowerCase();
      list = list.filter((b) => (b.tags ?? []).some((t) => t.toLowerCase() === tag));
    }

    return list;

  }, [books, categoryId, topicTag]);



  const availableTags = useMemo(() => collectTagsFromBooks(categoryBooks), [categoryBooks]);

  const availableSeries = useMemo(() => collectSeriesFromBooks(categoryBooks), [categoryBooks]);



  const displayed = useMemo(

    () => applyShelfQuery(categoryBooks, filters, sort),

    [categoryBooks, filters, sort]

  );



  const defaultCategory = categoryId === "All" ? "Other" : categoryId;



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

    showToast("Added to your shelf");

    setSheetOpen(false);

    if (categoryId !== "All" && meta.category !== categoryId) {

      router.push(collectionHref(meta.category as CategoryId));

    }

  }



  async function handleEditSave(id: string, meta: LibraryBookMetaUpdate) {

    setSavingEdit(true);

    const ok = await updateBookMeta(id, meta);

    setSavingEdit(false);

    if (ok) {

      haptic("success");

      showToast("Book updated");

      setEditBook(null);

    } else {

      showToast("Could not update book");

    }

  }



  async function handleDelete(book: LibraryBook) {

    if (!window.confirm(`Remove "${book.title}" from your shelf?`)) return;

    const ok = await deleteBook(book);

    if (ok) {

      haptic("light");

      showToast("Book removed");

    } else {

      showToast("Could not remove book");

    }

  }



  async function handleStateChange(book: LibraryBook, state: ReadingState) {

    const ok = await updateReadingState(book.id, state);

    if (ok) {

      haptic("light");

      showToast(`Marked as ${state.replace(/_/g, " ")}`);

    } else {

      showToast("Could not update status");

    }

  }



  const emptyShelf = !loading && categoryBooks.length === 0;

  const noResults = !loading && categoryBooks.length > 0 && displayed.length === 0;



  return (

    <>

      <div className="ln-shell ln-shell-shelf">

        <header className="ln-shelf-page-head">

          <Link href={backHref} className="ln-shelf-back-link" onClick={() => haptic("light")}>

            {backHref.includes("/c/") ? cat.label : "Library"}

          </Link>

          <h1 className="ln-rn-page-title">{titleOverride ?? cat.label}</h1>

          <p className="ln-shelf-page-sub">{taglineOverride ?? cat.tagline}</p>

        </header>



        <div className={`ln-shelf-banner ln-shelf-banner--${patternOverride ?? cat.pattern}`}>

          <img src={bannerImage ?? cat.coverImage} alt="" className="ln-shelf-banner-photo" loading="lazy" decoding="async" />

          <div className="ln-shelf-banner-overlay" aria-hidden />

          <span className="ln-shelf-stat-pill">

            {categoryBooks.length} {categoryBooks.length === 1 ? "book" : "books"}

          </span>

        </div>



        <div className="ln-shelf-body">

          {!emptyShelf && (

            <ShelfToolbar

              resultCount={displayed.length}

              totalCount={categoryBooks.length}

              view={view}

              sort={sort}

              filters={filters}

              availableTags={availableTags}

              availableSeries={availableSeries}

              filtersOpen={filtersOpen}

              onViewChange={setView}

              onSortChange={setSort}

              onFiltersChange={setFilters}

              onFiltersOpenChange={setFiltersOpen}

            />

          )}



          {loading && books.length === 0 ? (

            <div className="ln-books-loading">

              <div className="ln-skel-book" />

              <div className="ln-skel-book" />

            </div>

          ) : emptyShelf ? (

            <div className="ln-empty-state">

              <p className="ln-empty-state-title">This shelf is empty</p>

              <p className="ln-empty-state-sub">

                Add a PDF to {cat.label} — your progress syncs as you read.

              </p>

              <button

                type="button"

                className="ln-empty-state-btn"

                onClick={() => {

                  haptic("light");

                  setSheetOpen(true);

                }}

              >

                Add a book

              </button>

            </div>

          ) : noResults ? (

            <div className="ln-empty-state">

              <p className="ln-empty-state-title">No books match</p>

              <p className="ln-empty-state-sub">Try clearing filters or a different search.</p>

              <button

                type="button"

                className="ln-empty-state-btn ln-empty-state-btn--ghost"

                onClick={() =>

                  setFilters({ query: "", status: "all", tag: "all", series: "all" })

                }

              >

                Clear filters

              </button>

            </div>

          ) : view === "grid" ? (

            <div className="ln-books-grid">

              {displayed.map((book) => (

                <BookTile

                  key={book.id}

                  book={book}

                  onDelete={handleDelete}

                  onStateChange={handleStateChange}

                  onEdit={setEditBook}

                />

              ))}

            </div>

          ) : (

            <div className="ln-books-list">

              {displayed.map((book) => (

                <BookListRow

                  key={book.id}

                  book={book}

                  onDelete={handleDelete}

                  onStateChange={handleStateChange}

                  onEdit={setEditBook}

                />

              ))}

            </div>

          )}

        </div>



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

      </div>



      <AddBookSheet

        open={sheetOpen}

        saving={saving}

        defaultCategory={defaultCategory}

        defaultTags={topicTag ? [topicTag] : undefined}

        onClose={() => setSheetOpen(false)}

        onAdd={handleAdd}

      />



      <EditBookSheet

        book={editBook}

        open={!!editBook}

        saving={savingEdit}

        onClose={() => setEditBook(null)}

        onSave={handleEditSave}

      />

    </>

  );

}

