"use client";



import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";

import { X, ImageIcon, RefreshCw } from "lucide-react";

import { CategoryPicker } from "@/components/learn/CategoryCards";

import type { CategoryId } from "@/lib/learn/categories";

import type { LibraryBook, LibraryBookMetaUpdate } from "@/lib/learn/types";

import { formatTagsInput, parseTagsInput } from "@/lib/learn/tags";

import { haptic } from "@/lib/finance/haptics";

import { useToast } from "@/components/finance/ToastProvider";



export function EditBookSheet({

  book,

  open,

  saving,

  onClose,

  onSave,

}: {

  book: LibraryBook | null;

  open: boolean;

  saving: boolean;

  onClose: () => void;

  onSave: (id: string, meta: LibraryBookMetaUpdate) => void;

}) {

  const { showToast } = useToast();

  const [title, setTitle] = useState("");

  const [author, setAuthor] = useState("");

  const [category, setCategory] = useState<CategoryId>("Other");

  const [tagsInput, setTagsInput] = useState("");

  const [series, setSeries] = useState("");

  const [seriesIndex, setSeriesIndex] = useState("");

  const [publisher, setPublisher] = useState("");

  const [year, setYear] = useState("");

  const [coverUrl, setCoverUrl] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [lookingUpCover, setLookingUpCover] = useState(false);



  useEffect(() => {

    if (!book || !open) return;

    setTitle(book.title);

    setAuthor(book.author ?? "");

    setCategory(book.category as CategoryId);

    setTagsInput(formatTagsInput(book.tags));

    setSeries(book.series ?? "");

    setSeriesIndex(book.series_index != null ? String(book.series_index) : "");

    setPublisher(book.publisher ?? "");

    setYear(book.published_year != null ? String(book.published_year) : "");

    setCoverUrl(book.cover_url ?? "");
    setRating(book.rating ?? 0);
    setReview(book.review ?? "");

  }, [book, open]);



  const canSave = !!book && title.trim().length > 0 && !saving;



  async function lookupCover() {

    if (!book) return;

    setLookingUpCover(true);

    try {

      const params = new URLSearchParams({ title: title.trim() || book.title });

      if (author.trim()) params.set("author", author.trim());

      const res = await fetch(`/api/learn-cover?${params}`);

      const data = (await res.json()) as { url?: string | null };

      if (data.url) {

        setCoverUrl(data.url);

        haptic("success");

        showToast("Cover found");

      } else {

        showToast("No cover found — paste a URL instead");

      }

    } catch {

      showToast("Cover lookup failed");

    } finally {

      setLookingUpCover(false);

    }

  }



  return (
    <BottomSheet
      open={open && !!book}
      onClose={onClose}
      className="ln-sheet ln-sheet--tall"
      aria-label="Edit book"
    >
      {book && (
        <>
            <div className="ln-sheet-grab" />

            <div className="ln-sheet-head">

              <h3>Edit details</h3>

              <button type="button" className="ln-sheet-close" aria-label="Close" onClick={onClose}>

                <X size={18} />

              </button>

            </div>



            <div className="ln-field">

              <span className="ln-label">Cover art</span>

              <div className="ln-cover-edit">

                {coverUrl ? (

                  <img src={coverUrl} alt="" className="ln-cover-edit-preview" />

                ) : (

                  <div className="ln-cover-edit-placeholder">

                    <ImageIcon size={22} strokeWidth={1.5} />

                  </div>

                )}

                <div className="ln-cover-edit-fields">

                  <input

                    className="ln-input"

                    value={coverUrl}

                    onChange={(e) => setCoverUrl(e.target.value)}

                    placeholder="https://… cover image URL"

                  />

                  <button

                    type="button"

                    className="ln-cover-lookup-btn"

                    disabled={lookingUpCover}

                    onClick={() => void lookupCover()}

                  >

                    <RefreshCw size={14} className={lookingUpCover ? "ln-spin" : ""} />

                    {lookingUpCover ? "Looking up…" : "Find on Open Library"}

                  </button>

                </div>

              </div>

            </div>



            <label className="ln-field">

              <span className="ln-label">Title</span>

              <input className="ln-input" value={title} onChange={(e) => setTitle(e.target.value)} />

            </label>



            <label className="ln-field">

              <span className="ln-label">Author</span>

              <input className="ln-input" value={author} onChange={(e) => setAuthor(e.target.value)} />

            </label>



            <div className="ln-field">

              <span className="ln-label">Collection</span>

              <CategoryPicker selected={category} onSelect={setCategory} variant="grid" />

            </div>



            <label className="ln-field">

              <span className="ln-label">Tags</span>

              <input

                className="ln-input"

                value={tagsInput}

                onChange={(e) => setTagsInput(e.target.value)}

                placeholder="habits, leadership, faith"

              />

              <span className="ln-field-hint">Comma-separated</span>

            </label>



            <div className="ln-field-row">

              <label className="ln-field ln-field--half">

                <span className="ln-label">Series</span>

                <input

                  className="ln-input"

                  value={series}

                  onChange={(e) => setSeries(e.target.value)}

                  placeholder="e.g. Atomic series"

                />

              </label>

              <label className="ln-field ln-field--half">

                <span className="ln-label">Book #</span>

                <input

                  className="ln-input"

                  type="number"

                  min={1}

                  value={seriesIndex}

                  onChange={(e) => setSeriesIndex(e.target.value)}

                  placeholder="1"

                />

              </label>

            </div>



            <div className="ln-field-row">

              <label className="ln-field ln-field--half">

                <span className="ln-label">Publisher</span>

                <input

                  className="ln-input"

                  value={publisher}

                  onChange={(e) => setPublisher(e.target.value)}

                />

              </label>

              <label className="ln-field ln-field--half">

                <span className="ln-label">Year</span>

                <input

                  className="ln-input"

                  type="number"

                  min={1000}

                  max={2100}

                  value={year}

                  onChange={(e) => setYear(e.target.value)}

                />

              </label>

            </div>

            <label className="ln-field">
              <span>Rating</span>
              <div className="ln-star-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`ln-star${rating >= n ? " ln-star--on" : ""}`}
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </label>

            <label className="ln-field">
              <span>Review</span>
              <textarea
                className="ln-input ln-input--area"
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Your thoughts on this book…"
              />
            </label>

            <button

              type="button"

              className="ln-save-btn"

              disabled={!canSave}

              onClick={() => {

                haptic("light");

                onSave(book.id, {

                  title: title.trim(),

                  author: author.trim() || null,

                  category,

                  cover_url: coverUrl.trim() || null,

                  tags: parseTagsInput(tagsInput),

                  series: series.trim() || null,

                  series_index: seriesIndex ? Number(seriesIndex) : null,

                  publisher: publisher.trim() || null,

                  published_year: year ? Number(year) : null,
                  rating: rating || null,
                  review: review.trim() || null,
                });

              }}

            >

              {saving ? "Saving…" : "Save changes"}

            </button>
        </>
      )}
    </BottomSheet>

  );

}

