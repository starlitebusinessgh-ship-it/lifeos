"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { haptic } from "@/lib/finance/haptics";
import { useToast } from "@/components/finance/ToastProvider";
import {
  CAPTURE_TYPES,
  LIFE_AREAS,
  type CaptureType,
  type InboxDraft,
  type LifeArea,
} from "@/lib/inbox/types";

export function CaptureSheet({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: InboxDraft | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { showToast } = useToast();
  const [captureType, setCaptureType] = useState<CaptureType>("note");
  const [lifeArea, setLifeArea] = useState<LifeArea>("General");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = typeof initial?.id === "number";

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCaptureType((initial.capture_type as CaptureType) || "note");
      setLifeArea((initial.life_area as LifeArea) || "General");
      setContent(initial.content || "");
    } else {
      setCaptureType("note");
      setLifeArea("General");
      setContent("");
    }
  }, [open, initial]);

  async function handleSave() {
    const text = content.trim();
    if (!text || saving) return;

    setSaving(true);
    const payload = {
      capture_type: captureType,
      life_area: lifeArea,
      content: text,
      raw_content: isEdit ? initial?.raw_content ?? text : text,
    };

    let ok = false;
    if (isEdit && initial?.id) {
      const { error } = await supabase
        .from("lifeos_inbox_items")
        .update(payload)
        .eq("id", initial.id);
      ok = !error;
    } else {
      const { error } = await supabase.from("lifeos_inbox_items").insert(payload);
      ok = !error;
    }

    setSaving(false);
    if (!ok) {
      showToast("Could not save — try again");
      return;
    }

    haptic("success");
    showToast(isEdit ? "Updated" : "Saved to Inbox", {
      label: "View",
      onClick: () => {
        window.location.href = "/inbox";
      },
    });
    onSaved?.();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="ib-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="ib-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            role="dialog"
            aria-label={isEdit ? "Edit capture" : "Quick capture"}
          >
            <div className="ib-sheet-grab" />
            <div className="ib-sheet-head">
              <h3>{isEdit ? "Edit" : "Capture"}</h3>
              <button type="button" className="ib-sheet-close" aria-label="Close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="ib-pill-row" role="list" aria-label="Type">
              {CAPTURE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="listitem"
                  className={`ib-pill ${captureType === t.value ? "active" : ""}`}
                  onClick={() => {
                    haptic("light");
                    setCaptureType(t.value);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ib-area-row" role="list" aria-label="Life area">
              {LIFE_AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="listitem"
                  className={`ib-area-chip ${lifeArea === a ? "active" : ""}`}
                  onClick={() => {
                    haptic("light");
                    setLifeArea(a);
                  }}
                >
                  {a}
                </button>
              ))}
            </div>

            <textarea
              className="ib-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              autoFocus
            />

            <button
              type="button"
              className="ib-save-btn"
              disabled={!content.trim() || saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : isEdit ? "Update" : "Save to Inbox"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
