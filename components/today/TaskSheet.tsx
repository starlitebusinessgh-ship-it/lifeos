"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { DayTaskDraft } from "@/lib/today/taskTypes";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function TaskSheet({
  open,
  initial,
  saving,
  focusMode,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: DayTaskDraft | null;
  saving: boolean;
  focusMode?: boolean;
  onClose: () => void;
  onSave: (draft: DayTaskDraft) => void;
  onDelete?: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [isFocus, setIsFocus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (initial) {
      setTitle(initial.title);
      setTime(
        initial.hour !== null && initial.minute !== null
          ? `${pad(initial.hour)}:${pad(initial.minute)}`
          : ""
      );
      setDuration(initial.duration_mins);
      setIsFocus(initial.is_focus || focusMode === true);
    } else {
      setTitle(focusMode ? "" : "New task");
      setTime(focusMode ? "" : "09:00");
      setDuration(30);
      setIsFocus(focusMode === true);
    }
    setConfirmDelete(false);
  }, [open, initial, focusMode]);

  const isEdit = typeof initial?.id === "number";
  let hour: number | null = null;
  let minute: number | null = null;
  if (time.trim()) {
    const [h, m] = time.split(":").map((x) => parseInt(x, 10));
    if (Number.isFinite(h) && Number.isFinite(m)) {
      hour = h;
      minute = m;
    }
  }

  const valid = title.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="td-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="td-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="td-sheet-grab" />
            <div className="td-sheet-head">
              <h3>{isEdit ? "Edit" : focusMode ? "Today's focus" : "Add task"}</h3>
              <button type="button" className="td-sheet-close" aria-label="Close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <label className="td-field">
              <span className="td-label">Title</span>
              <input
                className="td-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={focusMode ? "What matters most today?" : "Task name"}
              />
            </label>

            {!focusMode && (
              <>
                <label className="td-field">
                  <span className="td-label">Time (optional)</span>
                  <input
                    type="time"
                    className="td-input td-time-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>

                <label className="td-field">
                  <span className="td-label">Duration (minutes)</span>
                  <input
                    type="number"
                    className="td-input"
                    min={5}
                    max={480}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) || 30)}
                  />
                </label>
              </>
            )}

            {!focusMode && (
              <label className="td-row-toggle">
                <span className="td-label" style={{ margin: 0 }}>
                  Set as today&apos;s focus
                </span>
                <button
                  type="button"
                  className={`td-switch ${isFocus ? "on" : ""}`}
                  aria-pressed={isFocus}
                  onClick={() => setIsFocus(!isFocus)}
                >
                  <span className="knob" />
                </button>
              </label>
            )}

            <button
              type="button"
              className="td-btn"
              disabled={!valid || saving}
              onClick={() =>
                onSave({
                  id: initial?.id,
                  day_date: initial?.day_date ?? "",
                  title: title.trim(),
                  hour: focusMode ? null : hour,
                  minute: focusMode ? null : minute,
                  duration_mins: duration,
                  completed: initial?.completed ?? false,
                  is_focus: focusMode || isFocus,
                })
              }
            >
              {saving ? "Saving…" : isEdit ? "Save" : "Add"}
            </button>

            {isEdit && onDelete && initial?.id && (
              <button
                type="button"
                className={`td-btn-ghost ${confirmDelete ? "confirm" : ""}`}
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  onDelete(initial.id!);
                }}
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
