"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { AlarmDraft } from "@/lib/today/alarmLogic";
import { DAY_LABELS } from "@/lib/today/alarmLogic";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function AlarmSheet({
  open,
  initial,
  saving,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: AlarmDraft | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: AlarmDraft) => void;
  onDelete?: (id: number) => void;
}) {
  const [label, setLabel] = useState("Alarm");
  const [time, setTime] = useState("07:00");
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [enabled, setEnabled] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (initial) {
      setLabel(initial.label);
      setTime(`${pad(initial.hour)}:${pad(initial.minute)}`);
      setRepeatDays(initial.repeat_days);
      setEnabled(initial.enabled);
    } else {
      setLabel("Alarm");
      setTime("07:00");
      setRepeatDays([1, 2, 3, 4, 5]);
      setEnabled(true);
    }
    setConfirmDelete(false);
  }, [open, initial]);

  const isEdit = typeof initial?.id === "number";
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  const valid = label.trim().length > 0 && Number.isFinite(h) && Number.isFinite(m);

  function toggleDay(day: number) {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

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
              <h3>{isEdit ? "Edit alarm" : "New alarm"}</h3>
              <button type="button" className="td-sheet-close" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="td-field">
              <label className="td-label" htmlFor="alarm-label">Label</label>
              <input
                id="alarm-label"
                className="td-input"
                placeholder="Wake up"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="td-field">
              <label className="td-label" htmlFor="alarm-time">Time</label>
              <input
                id="alarm-time"
                className="td-input td-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div className="td-field">
              <span className="td-label">Repeat</span>
              <div className="td-days">
                {DAY_LABELS.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    className={`td-day ${repeatDays.includes(i) ? "on" : ""}`}
                    onClick={() => toggleDay(i)}
                    aria-label={name}
                    aria-pressed={repeatDays.includes(i)}
                  >
                    {name.charAt(0)}
                  </button>
                ))}
              </div>
              <p className="td-hint">Tap letters to toggle days</p>
            </div>

            <div className="td-row-toggle">
              <span className="td-label" style={{ margin: 0 }}>Alarm on</span>
              <button
                type="button"
                className={`td-switch ${enabled ? "on" : ""}`}
                onClick={() => setEnabled((e) => !e)}
                aria-pressed={enabled}
              >
                <span className="knob" />
              </button>
            </div>

            <button
              type="button"
              className="td-btn"
              disabled={!valid || saving || repeatDays.length === 0}
              onClick={() =>
                onSave({
                  id: initial?.id,
                  label: label.trim(),
                  hour: h,
                  minute: m,
                  repeat_days: repeatDays,
                  enabled,
                })
              }
            >
              {saving ? "Saving…" : isEdit ? "Save" : "Add alarm"}
            </button>

            {isEdit && onDelete && (
              <button
                type="button"
                className={`td-btn-ghost ${confirmDelete ? "confirm" : ""}`}
                disabled={saving}
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  onDelete(initial!.id!);
                }}
              >
                {confirmDelete ? "Tap again to delete" : "Delete alarm"}
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
