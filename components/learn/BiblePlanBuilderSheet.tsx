"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/bible/books";
import {
  PLAN_PRESETS,
  buildScheduleFromConfig,
  previewPlan,
  type PlanBuilderConfig,
  type PlanScope,
  type PlanSplitMode,
} from "@/lib/bible/planBuilder";
import { haptic } from "@/lib/finance/haptics";

export function BiblePlanBuilderSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (config: PlanBuilderConfig, activate: boolean) => Promise<void>;
}) {
  const [title, setTitle] = useState("My reading plan");
  const [scope, setScope] = useState<PlanScope>("whole");
  const [splitMode, setSplitMode] = useState<PlanSplitMode>("days");
  const [totalDays, setTotalDays] = useState(365);
  const [chaptersPerDay, setChaptersPerDay] = useState(3);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [activate, setActivate] = useState(true);

  const config = useMemo(
    (): PlanBuilderConfig => ({
      title,
      scope,
      bookIds: scope === "custom" ? selectedBooks : undefined,
      splitMode,
      totalDays: splitMode === "days" ? totalDays : undefined,
      chaptersPerDay: splitMode === "chapters_per_day" ? chaptersPerDay : undefined,
    }),
    [title, scope, selectedBooks, splitMode, totalDays, chaptersPerDay]
  );

  const preview = useMemo(() => previewPlan(config), [config]);

  function applyPreset(preset: (typeof PLAN_PRESETS)[number]) {
    const c = preset.config;
    setTitle(c.title);
    setScope(c.scope);
    setSplitMode(c.splitMode);
    if (c.totalDays) setTotalDays(c.totalDays);
    if (c.chaptersPerDay) setChaptersPerDay(c.chaptersPerDay);
    if (c.bookIds) setSelectedBooks(c.bookIds);
    haptic("light");
  }

  function toggleBook(id: string) {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    if (preview.totalChapters === 0) return;
    setSaving(true);
    await onCreate(config, activate);
    setSaving(false);
    onClose();
    haptic("success");
  }

  if (!open) return null;

  return (
    <div className="ln-bible-study-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ln-bible-study-sheet ln-bible-plan-builder"
        role="dialog"
        aria-label="Create reading plan"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ln-bible-study-head">
          <div>
            <span className="ln-bible-study-kicker">Reading plan</span>
            <h2 className="ln-bible-study-title">Build your plan</h2>
          </div>
          <button type="button" className="ln-bible-study-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="ln-bible-plan-builder-body">
          <label className="ln-bible-plan-field">
            <span>Plan name</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Bible"
            />
          </label>

          <fieldset className="ln-bible-plan-field">
            <legend>What to read</legend>
            <div className="ln-bible-plan-segments">
              {(
                [
                  ["whole", "Whole Bible"],
                  ["ot", "Old Testament"],
                  ["nt", "New Testament"],
                  ["custom", "Pick books"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`ln-bible-pill${scope === val ? " ln-bible-pill--active" : ""}`}
                  onClick={() => setScope(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {scope === "custom" && (
            <div className="ln-bible-plan-books">
              {BIBLE_BOOKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`ln-bible-plan-book-chip${selectedBooks.includes(b.id) ? " ln-bible-plan-book-chip--on" : ""}`}
                  onClick={() => toggleBook(b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}

          <fieldset className="ln-bible-plan-field">
            <legend>How to split</legend>
            <div className="ln-bible-plan-segments">
              <button
                type="button"
                className={`ln-bible-pill${splitMode === "days" ? " ln-bible-pill--active" : ""}`}
                onClick={() => setSplitMode("days")}
              >
                Finish in X days
              </button>
              <button
                type="button"
                className={`ln-bible-pill${splitMode === "chapters_per_day" ? " ln-bible-pill--active" : ""}`}
                onClick={() => setSplitMode("chapters_per_day")}
              >
                X chapters per day
              </button>
            </div>
          </fieldset>

          {splitMode === "days" ? (
            <label className="ln-bible-plan-field">
              <span>Total days</span>
              <input
                type="number"
                min={1}
                max={2000}
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
              />
            </label>
          ) : (
            <label className="ln-bible-plan-field">
              <span>Chapters per day</span>
              <input
                type="number"
                min={1}
                max={50}
                value={chaptersPerDay}
                onChange={(e) => setChaptersPerDay(Number(e.target.value))}
              />
            </label>
          )}

          <div className="ln-bible-plan-preview">
            <strong>Preview</strong>
            <p>
              {preview.totalChapters} chapters → {preview.totalDays} days · ~{preview.chaptersPerDay}{" "}
              chapters/day
            </p>
          </div>

          <details className="ln-bible-plan-presets">
            <summary>Quick presets (customize after)</summary>
            <ul>
              {PLAN_PRESETS.map((p) => (
                <li key={p.label}>
                  <button type="button" onClick={() => applyPreset(p)}>
                    <strong>{p.label}</strong>
                    <span>{p.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <label className="ln-bible-plan-check">
            <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
            Start this plan immediately
          </label>

          <button
            type="button"
            className="ln-bible-plan-create-btn"
            disabled={saving || preview.totalChapters === 0}
            onClick={() => void handleCreate()}
          >
            {saving ? "Building…" : "Create plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { buildScheduleFromConfig };
