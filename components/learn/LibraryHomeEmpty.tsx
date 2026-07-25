"use client";

import { BookOpen, Plus } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

export function LibraryHomeEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="ln-home-empty">
      <div className="ln-home-empty-visual" aria-hidden>
        <div className="ln-home-empty-stack">
          <span className="ln-home-empty-vol ln-home-empty-vol--1" />
          <span className="ln-home-empty-vol ln-home-empty-vol--2" />
          <span className="ln-home-empty-vol ln-home-empty-vol--3" />
        </div>
        <BookOpen className="ln-home-empty-icon" size={28} strokeWidth={1.4} />
      </div>
      <h2 className="ln-home-empty-title">Your library is waiting</h2>
      <p className="ln-home-empty-sub">
        Add PDFs you are studying — track progress, pick up where you left off, and
        organize by what you want to learn.
      </p>
      <button
        type="button"
        className="ln-home-empty-btn"
        onClick={() => {
          haptic("light");
          onAdd();
        }}
      >
        <Plus size={18} strokeWidth={2} />
        Add your first book
      </button>
    </div>
  );
}
