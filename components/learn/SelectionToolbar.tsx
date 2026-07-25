"use client";

import { Highlighter, Inbox, Sun, StickyNote } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

export type SelectionToolbarProps = {
  top: number;
  left: number;
  onHighlight: () => void;
  onNote: () => void;
  onInbox: () => void;
  onToday: () => void;
  onDismiss: () => void;
};

export function SelectionToolbar({
  top,
  left,
  onHighlight,
  onNote,
  onInbox,
  onToday,
  onDismiss,
}: SelectionToolbarProps) {
  return (
    <>
      <button
        type="button"
        className="ln-sel-backdrop"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div
        className="ln-sel-toolbar"
        style={{ top: `${top}px`, left: `${left}px` }}
        role="toolbar"
        aria-label="Selection actions"
      >
        <button
          type="button"
          className="ln-sel-btn ln-sel-btn--primary"
          onClick={() => {
            haptic("light");
            onHighlight();
          }}
        >
          <Highlighter size={15} strokeWidth={2} />
          Highlight
        </button>
        <button
          type="button"
          className="ln-sel-btn"
          onClick={() => {
            haptic("light");
            onNote();
          }}
        >
          <StickyNote size={15} strokeWidth={2} />
          Note
        </button>
        <button
          type="button"
          className="ln-sel-btn"
          onClick={() => {
            haptic("light");
            onInbox();
          }}
        >
          <Inbox size={15} strokeWidth={2} />
          Inbox
        </button>
        <button
          type="button"
          className="ln-sel-btn"
          onClick={() => {
            haptic("light");
            onToday();
          }}
        >
          <Sun size={15} strokeWidth={2} />
          Today
        </button>
      </div>
    </>
  );
}
