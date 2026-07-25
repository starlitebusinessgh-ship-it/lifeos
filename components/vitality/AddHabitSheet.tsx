"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

const ICONS = ["✦", "🏃", "💧", "📖", "🙏", "🧘", "🥗", "💪", "😴", "📝"];
const COLORS = ["#2dd4a8", "#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1"];

export function AddHabitSheet({
  open,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);

  function handleClose() {
    setName("");
    setIcon(ICONS[0]);
    setColor(COLORS[0]);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="vt-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} />
          <motion.div
            className="vt-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            role="dialog"
            aria-label="New habit"
          >
            <div className="vt-sheet-grab" />
            <div className="vt-sheet-head">
              <h3>New habit</h3>
              <button type="button" className="vt-sheet-close" onClick={handleClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <label className="vt-field">
              <span className="vt-label">Name</span>
              <input
                className="vt-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning walk"
                autoFocus
              />
            </label>
            <div className="vt-field">
              <span className="vt-label">Icon</span>
              <div className="vt-icon-row">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`vt-icon-pick ${icon === i ? "active" : ""}`}
                    onClick={() => {
                      haptic("light");
                      setIcon(i);
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="vt-field">
              <span className="vt-label">Color</span>
              <div className="vt-color-row">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`vt-color-pick ${color === c ? "active" : ""}`}
                    style={{ background: c }}
                    aria-label="Color"
                    onClick={() => {
                      haptic("light");
                      setColor(c);
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              className="vt-save-btn"
              disabled={!name.trim() || saving}
              onClick={() => {
                haptic("light");
                onSave(name.trim(), icon, color);
              }}
            >
              {saving ? "Adding…" : "Add habit"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
