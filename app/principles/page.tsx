"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Fingerprint, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PLACEHOLDER = `I believe in…

My core values:
—

What I stand for:
—

Rules I live by:
—

What I am working toward:
—`;

export default function PrinciplesPage() {
  const [content, setContent]         = useState("");
  const textareaRef                    = useRef<HTMLTextAreaElement>(null);
  const [principlesId, setPrinciplesId] = useState<string | null>(null);
  const [loading, setLoading]          = useState(true);
  const [saving, setSaving]            = useState(false);
  const [saved, setSaved]              = useState(false);
  const [error, setError]              = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data, error: err } = await supabase
        .from("principles")
        .select("id, content")
        .limit(1)
        .maybeSingle();

      if (err) setError(err.message);
      else if (data) {
        setPrinciplesId(data.id as string);
        setContent((data.content as string) ?? "");
      }

      setLoading(false);
    }
    void fetch();
  }, []);

  async function handleSave() {
    const raw = textareaRef.current?.value ?? content;
    if (saving) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = { content: raw, updated_at: new Date().toISOString() };

    try {
      if (principlesId) {
        const { error: err } = await supabase
          .from("principles")
          .update(payload)
          .eq("id", principlesId);
        if (err) { setError(err.message); return; }
      } else {
        const { data, error: err } = await supabase
          .from("principles")
          .insert(payload)
          .select("id")
          .single();
        if (err) { setError(err.message); return; }
        if (data) setPrinciplesId((data as { id: string }).id);
      }

      setContent(raw);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="os-page" style={{ minHeight: "100%", paddingBottom: "7rem" }}>
      <main style={{ maxWidth: "34rem", margin: "0 auto", padding: "2rem 1.25rem 0" }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: "2rem" }}>
          <Link
            href="/spaces"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.8125rem",
              color: "var(--os-ink-4)",
              textDecoration: "none",
              marginBottom: "1.5rem",
            }}
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            Spaces
          </Link>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "0.875rem",
                background: "rgba(123, 108, 240, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "0.125rem",
              }}
            >
              <Fingerprint size={20} color="#7b6cf0" strokeWidth={1.75} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                  fontSize: "1.875rem",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  margin: "0 0 0.25rem",
                  lineHeight: 1.15,
                }}
              >
                Principles
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--os-ink-4)", margin: 0 }}>
                Your values, rules, and personal constitution
              </p>
            </div>
          </div>
        </header>

        {/* ── Loading ── */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              color: "var(--os-ink-4)",
              fontSize: "0.9375rem",
              padding: "2rem 0",
            }}
          >
            <Loader2 size={16} className="sanctum-spin" />
            Loading your principles…
          </div>
        )}

        {/* ── Editor ── */}
        {!loading && (
          <form
            onSubmit={(e) => { e.preventDefault(); void handleSave(); }}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Preamble */}
            <p
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "0.9375rem",
                fontStyle: "italic",
                lineHeight: 1.75,
                color: "var(--os-ink-3)",
                margin: 0,
              }}
            >
              Your personal constitution — the values you live by, the rules you
              hold yourself to, the person you are working to become.
            </p>

            {/* Textarea */}
            <div
              style={{
                background: "var(--os-surface)",
                border: "1px solid var(--os-border-mid)",
                borderRadius: "var(--os-r-md)",
                boxShadow: "var(--os-shadow-sm)",
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={20}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  padding: "1.5rem",
                  fontFamily: "var(--font-display), Georgia, serif",
                  fontSize: "1.0625rem",
                  lineHeight: 1.85,
                  color: "var(--os-ink)",
                  resize: "vertical",
                  minHeight: "24rem",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  background: "rgba(201, 74, 58, 0.08)",
                  border: "1px solid rgba(201, 74, 58, 0.2)",
                  borderRadius: "var(--os-r)",
                  padding: "0.875rem 1rem",
                  fontSize: "0.875rem",
                  color: "var(--os-error)",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            {/* Actions row */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1.75rem",
                  background: saving ? "var(--os-ink-4)" : "var(--os-ink)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "100px",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: saving ? "wait" : "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: saving ? "none" : "0 4px 14px rgba(0,0,0,0.15)",
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
              >
                {saving && <Loader2 size={15} className="sanctum-spin" />}
                {saving ? "Saving…" : "Save principles"}
              </button>

              {saved && (
                <span
                  className="os-fade-in"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontSize: "0.875rem",
                    color: "var(--os-success)",
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle2 size={15} strokeWidth={2} />
                  Saved
                </span>
              )}
            </div>
          </form>
        )}

        {/* ── Prompts ── */}
        {!loading && (
          <aside
            style={{
              marginTop: "2.5rem",
              padding: "1.25rem",
              background: "rgba(123, 108, 240, 0.05)",
              border: "1px solid rgba(123, 108, 240, 0.12)",
              borderRadius: "var(--os-r-md)",
            }}
          >
            <h2
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#7b6cf0",
                margin: "0 0 0.875rem",
              }}
            >
              Reflection prompts
            </h2>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              {[
                "What do I believe about how people should treat each other?",
                "What are the non-negotiables I will never compromise?",
                "What does success look like at the end of my life?",
                "What am I willing to sacrifice? What am I not?",
                "What would the best version of me do right now?",
              ].map((q) => (
                <li
                  key={q}
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--os-ink-3)",
                    lineHeight: 1.6,
                    paddingLeft: "1rem",
                    borderLeft: "2px solid rgba(123, 108, 240, 0.25)",
                  }}
                >
                  {q}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>
    </div>
  );
}
