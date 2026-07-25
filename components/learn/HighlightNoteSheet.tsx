"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { X } from "lucide-react";
import { DEFAULT_HIGHLIGHT_COLOR, HIGHLIGHT_COLORS } from "@/lib/learn/highlightColors";
import { haptic } from "@/lib/finance/haptics";

export function HighlightNoteSheet({
  open,
  quote,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  quote: string;
  saving: boolean;
  onClose: () => void;
  onSave: (note: string, color: string) => void;
}) {
  const [note, setNote] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_HIGHLIGHT_COLOR);

  useEffect(() => {
    if (open) {
      setNote("");
      setColor(DEFAULT_HIGHLIGHT_COLOR);
    }
  }, [open, quote]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      className="ln-sheet ln-sheet--reader"
      scrimClassName="ln-scrim ln-scrim--reader"
      aria-label="Save highlight"
    >
            <div className="ln-sheet-grab" />
            <div className="ln-sheet-head">
              <h3>Save highlight</h3>
              <button type="button" className="ln-sheet-close" aria-label="Close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <blockquote className="ln-hl-quote-preview">&ldquo;{quote}&rdquo;</blockquote>

            <label className="ln-field">
              <span className="ln-label">Your note (optional)</span>
              <textarea
                className="ln-textarea ln-textarea--reader"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this stood out…"
              />
            </label>

            <div className="ln-field">
              <span className="ln-label">Color</span>
              <div className="ln-hl-colors">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`ln-hl-color ${color === c.value ? "active" : ""}`}
                    style={{ background: c.value }}
                    aria-label={c.label}
                    onClick={() => {
                      haptic("light");
                      setColor(c.value);
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="ln-save-btn ln-save-btn--reader"
              disabled={saving}
              onClick={() => {
                haptic("light");
                onSave(note, color);
              }}
            >
              {saving ? "Saving…" : "Save highlight"}
            </button>
    </BottomSheet>
  );
}
