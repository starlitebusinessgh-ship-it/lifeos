"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PrinciplesPage() {
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [principlesId, setPrinciplesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrinciples() {
      const { data, error: fetchError } = await supabase
        .from("principles")
        .select("id, content, updated_at")
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setPrinciplesId(data.id);
        setContent(data.content ?? "");
      }

      setLoading(false);
    }

    void fetchPrinciples();
  }, []);

  function handleContentChange(value: string) {
    setContent(value);
  }

  async function handleSave() {
    const rawContent = contentRef.current?.value ?? content;
    if (saving) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload = {
      content: rawContent,
      updated_at: new Date().toISOString(),
    };

    try {
      if (principlesId) {
        const { error: updateError } = await supabase
          .from("principles")
          .update(payload)
          .eq("id", principlesId);

        if (updateError) {
          setError(updateError.message);
          return;
        }
      } else {
        const { data, error: insertError } = await supabase
          .from("principles")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) {
          setError(insertError.message);
          return;
        }

        if (data) {
          setPrinciplesId(data.id);
        }
      }

      setContent(rawContent);
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
            Principles
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Your personal values and guiding principles.
          </p>
        </header>

        {loading ? (
          <p className="text-base text-zinc-600 dark:text-zinc-400">Loading…</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
            className="flex flex-1 flex-col gap-5"
          >
            <div className="flex flex-1 flex-col gap-2">
              <label
                htmlFor="principles"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Your Principles
              </label>
              <textarea
                ref={contentRef}
                id="principles"
                name="principles"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onInput={(e) => handleContentChange(e.currentTarget.value)}
                placeholder="Write what matters most to you — values, rules, beliefs…"
                rows={16}
                className="min-h-80 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-4 text-lg leading-relaxed text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
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
              disabled={saving}
              className={`h-14 w-full rounded-xl text-lg font-semibold transition-colors ${
                saving
                  ? "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
                  : "cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              }`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
