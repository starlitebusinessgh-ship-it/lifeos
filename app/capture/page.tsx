"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const CAPTURE_TYPES = [
  { value: "decision", label: "Decision" },
  { value: "journal", label: "Journal" },
  { value: "lesson", label: "Lesson" },
  { value: "idea", label: "Idea" },
  { value: "note", label: "Note" },
  { value: "prayer", label: "Prayer" },
  { value: "book_note", label: "Book Note" },
  { value: "goal_update", label: "Goal Update" },
  { value: "reflection", label: "Reflection" },
  { value: "other", label: "Other" },
] as const;

const LIFE_AREAS = [
  "Finance",
  "Health",
  "Career",
  "Learning",
  "Spiritual",
  "Relationships",
  "General",
] as const;

export default function CapturePage() {
  const [captureType, setCaptureType] = useState<string>(CAPTURE_TYPES[0].value);
  const [lifeArea, setLifeArea] = useState<string>(LIFE_AREAS[0]);
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = content.trim().length > 0 && !saving;

  function handleContentChange(value: string) {
    setContent(value);
  }

  async function handleSave() {
    const rawContent = contentRef.current?.value ?? content;
    const trimmedContent = rawContent.trim();
    if (!trimmedContent || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: insertError } = await supabase.from("entries").insert({
        capture_type: captureType,
        life_area: lifeArea,
        content: trimmedContent,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setCaptureType(CAPTURE_TYPES[0].value);
      setLifeArea(LIFE_AREAS[0]);
      setContent("");
      if (contentRef.current) {
        contentRef.current.value = "";
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Capture
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Save a thought, decision, or moment.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="flex flex-1 flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="capture_type"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Type
            </label>
            <select
              id="capture_type"
              value={captureType}
              onChange={(e) => setCaptureType(e.target.value)}
              className="h-14 w-full rounded-xl border border-zinc-300 bg-white px-4 text-lg text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            >
              {CAPTURE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="life_area"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Life Area
            </label>
            <select
              id="life_area"
              value={lifeArea}
              onChange={(e) => setLifeArea(e.target.value)}
              className="h-14 w-full rounded-xl border border-zinc-300 bg-white px-4 text-lg text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            >
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="content"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Content
            </label>
            <textarea
              ref={contentRef}
              id="content"
              name="content"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onInput={(e) => handleContentChange(e.currentTarget.value)}
              placeholder="What's on your mind?"
              rows={8}
              className="min-h-48 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-4 text-lg leading-relaxed text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-base font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              Saved successfully!
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            className={`h-14 w-full rounded-xl text-lg font-semibold transition-colors ${
              canSave
                ? "cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                : "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
            }`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </main>
    </div>
  );
}
