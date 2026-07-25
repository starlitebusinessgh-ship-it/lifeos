"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { HIGHLIGHT_COLORS, DEFAULT_HIGHLIGHT_COLOR } from "@/lib/learn/highlightColors";

export function BibleHighlightSheet({
  verse,
  onClose,
  onSave,
}: {
  verse: number;
  onClose: () => void;
  onSave: (color: string, note: string) => Promise<void>;
}) {
  const [color, setColor] = useState<string>(DEFAULT_HIGHLIGHT_COLOR);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(color, note);
    setSaving(false);
  }

  return (
    <div className="ln-bible-study-backdrop" role="presentation" onClick={onClose}>
      <div className="ln-bible-study-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="ln-bible-study-head">
          <div>
            <span className="ln-bible-study-kicker">Highlight</span>
            <h2 className="ln-bible-study-title">Verse {verse}</h2>
          </div>
          <button type="button" className="ln-bible-study-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="ln-bible-highlight-colors">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`ln-bible-highlight-swatch${color === c.value ? " ln-bible-highlight-swatch--active" : ""}`}
              style={{ backgroundColor: c.value }}
              aria-label={c.label}
              onClick={() => setColor(c.value)}
            />
          ))}
        </div>
        <textarea
          className="ln-bible-highlight-note"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        <button
          type="button"
          className="ln-bible-highlight-save"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save highlight"}
        </button>
      </div>
    </div>
  );
}
