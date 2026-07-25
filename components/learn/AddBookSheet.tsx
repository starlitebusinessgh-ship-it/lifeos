"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { X, Upload, FileText } from "lucide-react";
import { CategoryPicker } from "@/components/learn/CategoryCards";
import type { CategoryId } from "@/lib/learn/categories";
import { pickCoverColor, titleFromFilename } from "@/lib/learn/covers";
import type { ReadingState } from "@/lib/learn/types";
import { READING_STATES, readingStateLabel } from "@/lib/learn/readingState";
import { parseTagsInput } from "@/lib/learn/tags";
import { haptic } from "@/lib/finance/haptics";

export type AddBookMeta = {
  title: string;
  author: string;
  category: string;
  reading_state: ReadingState;
  tags?: string[];
  series?: string;
  series_index?: number | null;
  publisher?: string;
  published_year?: number | null;
};

export function AddBookSheet({
  open,
  saving,
  defaultCategory = "Other",
  defaultTags,
  onClose,
  onAdd,
}: {
  open: boolean;
  saving: boolean;
  defaultCategory?: CategoryId;
  defaultTags?: string[];
  onClose: () => void;
  onAdd: (file: File, meta: AddBookMeta) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<CategoryId>(defaultCategory);
  const [readingState, setReadingState] = useState<ReadingState>("want_to_read");
  const [showMore, setShowMore] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [series, setSeries] = useState("");
  const [seriesIndex, setSeriesIndex] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setTagsInput(defaultTags?.join(", ") ?? "");
    }
  }, [open, defaultCategory, defaultTags]);

  function reset() {
    setFile(null);
    setTitle("");
    setAuthor("");
    setCategory(defaultCategory);
    setReadingState("want_to_read");
    setShowMore(false);
    setTagsInput(defaultTags?.join(", ") ?? "");
    setSeries("");
    setSeriesIndex("");
    setPublisher("");
    setYear("");
  }

  function handleFile(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return;
    }
    setFile(f);
    if (!title.trim()) setTitle(titleFromFilename(f.name));
  }

  function handleClose() {
    reset();
    onClose();
  }

  const canSave = !!file && title.trim().length > 0 && !saving;

  return (
    <BottomSheet open={open} onClose={handleClose} aria-label="Add book">
            <div className="ln-sheet-grab" />
            <div className="ln-sheet-head">
              <h3>Add to shelf</h3>
              <button type="button" className="ln-sheet-close" aria-label="Close" onClick={handleClose}>
                <X size={18} />
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="ln-file-input"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {!file ? (
              <button
                type="button"
                className="ln-upload-zone"
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={28} strokeWidth={1.5} />
                <span className="ln-upload-title">Choose a PDF</span>
                <span className="ln-upload-sub">From your device · up to 50 MB</span>
              </button>
            ) : (
              <div className="ln-file-picked">
                <FileText size={22} strokeWidth={1.5} />
                <div>
                  <p className="ln-file-name">{file.name}</p>
                  <button
                    type="button"
                    className="ln-file-change"
                    onClick={() => inputRef.current?.click()}
                  >
                    Change file
                  </button>
                </div>
              </div>
            )}

            <label className="ln-field">
              <span className="ln-label">Title</span>
              <input
                className="ln-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book title"
              />
            </label>

            <label className="ln-field">
              <span className="ln-label">Author (optional)</span>
              <input
                className="ln-input"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
              />
            </label>

            <div className="ln-field">
              <span className="ln-label">Collection</span>
              <CategoryPicker selected={category} onSelect={setCategory} variant="grid" />
            </div>

            <div className="ln-field">
              <span className="ln-label">Status</span>
              <div className="ln-state-pills" role="radiogroup" aria-label="Reading status">
                {READING_STATES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={readingState === s}
                    className={`ln-state-pill ${readingState === s ? "active" : ""}`}
                    onClick={() => {
                      haptic("light");
                      setReadingState(s);
                    }}
                  >
                    {readingStateLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="ln-more-toggle"
              onClick={() => {
                haptic("light");
                setShowMore((v) => !v);
              }}
            >
              {showMore ? "Hide details" : "More details (tags, series…)"}
            </button>

            {showMore && (
              <>
                <label className="ln-field">
                  <span className="ln-label">Tags</span>
                  <input
                    className="ln-input"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="habits, leadership"
                  />
                </label>
                <div className="ln-field-row">
                  <label className="ln-field ln-field--half">
                    <span className="ln-label">Series</span>
                    <input
                      className="ln-input"
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
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
              </>
            )}

            {file && (
              <div
                className="ln-preview-swatch"
                style={{ background: pickCoverColor(title || file.name) }}
                aria-hidden
              />
            )}

            <button
              type="button"
              className="ln-save-btn"
              disabled={!canSave}
              onClick={() => {
                if (!file) return;
                haptic("light");
                onAdd(file, {
                  title: title.trim(),
                  author: author.trim(),
                  category,
                  reading_state: readingState,
                  tags: parseTagsInput(tagsInput),
                  series: series.trim() || undefined,
                  series_index: seriesIndex ? Number(seriesIndex) : null,
                  publisher: publisher.trim() || undefined,
                  published_year: year ? Number(year) : null,
                });
              }}
            >
              {saving ? "Adding…" : "Add to shelf"}
            </button>
    </BottomSheet>
  );
}
