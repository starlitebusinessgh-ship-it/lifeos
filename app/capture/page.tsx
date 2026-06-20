"use client";

import "./capture.css";
import { useState, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CAPTURE_TYPE_VALUES, LIFE_AREA_VALUES } from "@/lib/capture/constants";

/* ── Types ── */

type OrganizeResponse = {
  title: string;
  enhanced_content: string;
  capture_type: string;
  life_area: string;
  tags: string[];
};

/* ── Constants ── */

const CAPTURE_TYPES = ["Note", "Decision", "Journal", "Lesson", "Idea", "Prayer", "Book Note", "Goal Update", "Reflection"];
const LIFE_AREAS    = ["General", "Finance", "Health", "Career", "Learning", "Spiritual", "Relationships"];

const TYPE_MAP: Record<string, string> = {
  "Note": "note", "Decision": "decision", "Journal": "journal",
  "Lesson": "lesson", "Idea": "idea", "Prayer": "prayer",
  "Book Note": "book_note", "Goal Update": "goal_update", "Reflection": "reflection",
};

/* ── Page ── */

export default function WritePage() {
  const [content,     setContent]     = useState("");
  const [captureType, setCaptureType] = useState("Note");
  const [lifeArea,    setLifeArea]    = useState("General");
  const [organizing,  setOrganizing]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  async function handleAIOrganize() {
    const text = content.trim();
    if (!text || organizing || saving) return;
    setOrganizing(true);

    try {
      const res = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: unknown = await res.json();
      if (!res.ok) { showToast("AI organize failed"); return; }

      const result = data as OrganizeResponse;

      /* update type chip */
      const mappedType = Object.entries(TYPE_MAP).find(([, v]) => v === result.capture_type)?.[0];
      if (mappedType) setCaptureType(mappedType);

      /* update area chip */
      const areaLabel = LIFE_AREAS.find(
        (a) => a.toLowerCase() === result.life_area.toLowerCase()
      );
      if (areaLabel) setLifeArea(areaLabel);

      /* update content with enhanced version */
      setContent(result.title ? `${result.title}\n\n${result.enhanced_content}` : result.enhanced_content);
      showToast("AI organised your entry");
    } catch {
      showToast("Could not reach AI");
    } finally {
      setOrganizing(false);
    }
  }

  async function handleCapture() {
    const text = content.trim();
    if (!text || saving) return;
    setSaving(true);

    const rawType  = TYPE_MAP[captureType] ?? "note";
    const rawArea  = LIFE_AREA_VALUES.has(lifeArea) ? lifeArea : "General";
    const finalType = CAPTURE_TYPE_VALUES.has(rawType) ? rawType : "note";

    const { error } = await supabase.from("entries").insert({
      capture_type: finalType,
      life_area:    rawArea,
      content:      text,
      title:        null,
      raw_content:  text,
      tags:         null,
      created_at:   new Date().toISOString(),
    });

    if (error) {
      showToast("Failed to save");
    } else {
      setContent("");
      setCaptureType("Note");
      setLifeArea("General");
      showToast("Captured ✓");
      textareaRef.current?.focus();
    }

    setSaving(false);
  }

  const hasContent = content.trim().length > 0;
  const busy = organizing || saving;

  return (
    <div className="write-page">

      {/* Masthead */}
      <div className="write-masthead">
        <span className="write-brand">LIFE·OS</span>
        <span className="write-date">{dateStr}</span>
      </div>

      <div className="write-body">

        <h1 className="write-title">Capture.</h1>
        <p className="write-subtitle">What is on your mind right now?</p>

        {/* Type chips */}
        <div className="write-chips-label">TYPE</div>
        <div className="write-chips-scroll">
          {CAPTURE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`write-chip${captureType === t ? " write-chip--active" : ""}`}
              onClick={() => setCaptureType(t)}
              disabled={busy}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="write-textarea-wrap">
          <textarea
            ref={textareaRef}
            className="write-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write anything —\na ${captureType.toLowerCase()}, lesson, prayer, idea,\nor thought that matters to you...`}
            disabled={busy}
          />
        </div>

        <div className="write-textarea-footer">
          <span className="write-textarea-hint">start writing...</span>
          <span className="write-textarea-status">{captureType} · {lifeArea}</span>
        </div>

        {/* Area chips */}
        <div className="write-chips-label">LIFE AREA</div>
        <div className="write-area-chips">
          {LIFE_AREAS.map((a) => (
            <button
              key={a}
              type="button"
              className={`write-area-chip${lifeArea === a ? " write-area-chip--active" : ""}`}
              onClick={() => setLifeArea(a)}
              disabled={busy}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="write-actions">
          <button
            type="button"
            className="write-btn-ai"
            onClick={() => void handleAIOrganize()}
            disabled={!hasContent || busy}
          >
            {organizing ? (
              <Loader2 size={14} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Sparkles size={14} strokeWidth={1.75} />
            )}
            AI Organize
          </button>

          <button
            type="button"
            className="write-btn-capture"
            onClick={() => void handleCapture()}
            disabled={!hasContent || busy}
          >
            {saving ? "Saving…" : "Capture"}
          </button>
        </div>

      </div>

      {/* Toast */}
      {toast && <div className="write-toast">{toast}</div>}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
