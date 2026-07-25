"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { X } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

export function PinIdeaSheet({
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
  onSave: (title: string, asBuild: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [asBuild, setAsBuild] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(quote.length > 60 ? `${quote.slice(0, 57)}…` : quote);
      setAsBuild(false);
    }
  }, [open, quote]);

  return (
    <BottomSheet open={open} onClose={onClose} aria-label="Pin idea">
            <div className="ln-sheet-grab" />
            <div className="ln-sheet-head">
              <h3>Pin to your mind map</h3>
              <button type="button" className="ln-sheet-close" aria-label="Close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <blockquote className="ln-hl-quote-preview ln-hl-quote-preview--light">
              &ldquo;{quote}&rdquo;
            </blockquote>

            <label className="ln-field">
              <span className="ln-label">Idea label</span>
              <input
                className="ln-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is this idea?"
              />
            </label>

            <label className="ln-mind-build-toggle">
              <input
                type="checkbox"
                checked={asBuild}
                onChange={(e) => setAsBuild(e.target.checked)}
              />
              <span>Seed a Build project (shows in Build when that module launches)</span>
            </label>

            <button
              type="button"
              className="ln-save-btn"
              disabled={saving || !title.trim()}
              onClick={() => {
                haptic("light");
                onSave(title.trim(), asBuild);
              }}
            >
              {saving ? "Saving…" : "Pin idea"}
            </button>
    </BottomSheet>
  );
}
