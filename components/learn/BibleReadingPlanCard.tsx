"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Check, Pause, Play, Plus, Trash2 } from "lucide-react";
import { getBibleBook, bibleChapterHref } from "@/lib/bible/books";
import {
  resolvePlanDefinition,
  type BibleReadingPlanProgress,
} from "@/lib/bible/readingPlanActions";
import { useReadingPlans } from "@/lib/bible/useReadingPlans";
import {
  BiblePlanBuilderSheet,
  buildScheduleFromConfig,
} from "@/components/learn/BiblePlanBuilderSheet";
import type { PlanBuilderConfig } from "@/lib/bible/planBuilder";
import { haptic } from "@/lib/finance/haptics";

export function BibleReadingPlanCard() {
  const { plans, active, loading, create, activate, pause, remove, completeDay } =
    useReadingPlans();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);

  const planDef = active ? resolvePlanDefinition(active) : null;
  const todayDay = active?.current_day ?? 1;
  const todayReadings = useMemo(() => {
    if (!planDef) return [];
    return planDef.schedule.find((d) => d.day === todayDay)?.readings ?? [];
  }, [planDef, todayDay]);

  const doneToday = active?.completed_days.includes(todayDay) ?? false;
  const pct = planDef
    ? Math.round(((active?.completed_days.length ?? 0) / planDef.days) * 100)
    : 0;

  async function handleCreate(config: PlanBuilderConfig, makeActive: boolean) {
    const built = buildScheduleFromConfig(config);
    await create(built, makeActive);
  }

  if (loading) return null;

  return (
    <>
      <section className="ln-bible-plan">
        <div className="ln-bible-plan-head ln-bible-plan-head--row">
          <div className="ln-bible-plan-head-main">
            <Calendar size={18} />
            <h2>Reading plans</h2>
          </div>
          <button
            type="button"
            className="ln-bible-plan-add"
            onClick={() => {
              setBuilderOpen(true);
              haptic("light");
            }}
          >
            <Plus size={16} /> New plan
          </button>
        </div>

        {active && planDef ? (
          <div className="ln-bible-plan ln-bible-plan--active">
            <div className="ln-bible-plan-active-head">
              <div>
                <h3>{planDef.title}</h3>
                <p>
                  Day {todayDay} of {planDef.days} · {pct}% complete
                </p>
              </div>
              <button
                type="button"
                className="ln-bible-plan-icon-btn"
                aria-label="Pause plan"
                onClick={() => void pause(active.id)}
              >
                <Pause size={16} />
              </button>
            </div>
            <div className="ln-bible-plan-bar">
              <div className="ln-bible-plan-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="ln-bible-plan-today-label">Today&apos;s reading</p>
            <ul className="ln-bible-plan-readings">
              {todayReadings.map((r) => {
                const book = getBibleBook(r.bookId);
                return (
                  <li key={`${r.bookId}-${r.chapter}`}>
                    <Link href={bibleChapterHref(r.bookId, r.chapter)} onClick={() => haptic("light")}>
                      {book?.name ?? r.bookId} {r.chapter}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!doneToday && (
              <button
                type="button"
                className="ln-bible-plan-done"
                onClick={() => {
                  void completeDay(todayDay, planDef.days);
                  haptic("success");
                }}
              >
                <Check size={16} /> Mark today complete
              </button>
            )}
          </div>
        ) : (
          <p className="ln-bible-plan-empty">
            No active plan. Create one or resume a paused plan below.
          </p>
        )}

        {plans.length > 0 && (
          <div className="ln-bible-plan-list-wrap">
            <button
              type="button"
              className="ln-bible-plan-list-toggle"
              onClick={() => setShowAllPlans((v) => !v)}
            >
              {showAllPlans ? "Hide" : "Show"} all plans ({plans.length})
            </button>
            {showAllPlans && (
              <ul className="ln-bible-plan-list">
                {plans.map((p) => (
                  <PlanListItem
                    key={p.id}
                    row={p}
                    isActive={p.status === "active"}
                    onActivate={() => void activate(p.id)}
                    onPause={() => void pause(p.id)}
                    onDelete={() => {
                      if (window.confirm("Delete this plan?")) void remove(p.id);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <BiblePlanBuilderSheet
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}

function PlanListItem({
  row,
  isActive,
  onActivate,
  onPause,
  onDelete,
}: {
  row: BibleReadingPlanProgress;
  isActive: boolean;
  onActivate: () => void;
  onPause: () => void;
  onDelete: () => void;
}) {
  const def = resolvePlanDefinition(row);
  const pct = def
    ? Math.round((row.completed_days.length / def.days) * 100)
    : 0;

  return (
    <li className={`ln-bible-plan-list-item${isActive ? " ln-bible-plan-list-item--active" : ""}`}>
      <div>
        <strong>{row.title ?? def?.title ?? "Plan"}</strong>
        <span>
          {row.status} · {pct}% · day {row.current_day}
        </span>
      </div>
      <div className="ln-bible-plan-list-actions">
        {isActive ? (
          <button type="button" aria-label="Pause" onClick={onPause}>
            <Pause size={14} />
          </button>
        ) : (
          <button type="button" aria-label="Activate" onClick={onActivate}>
            <Play size={14} />
          </button>
        )}
        <button type="button" aria-label="Delete" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
