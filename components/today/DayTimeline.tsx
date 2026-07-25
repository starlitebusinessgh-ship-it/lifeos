"use client";

import type { DayTimeline, TimelineEntry } from "@/lib/today/timeline";
import { formatDuration, formatTimeLabel } from "@/lib/today/timeline";
import type { DayTask } from "@/lib/today/taskTypes";
import { AlarmClock, Check } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

interface DayTimelineViewProps {
  timeline: DayTimeline;
  onToggleTask: (task: DayTask) => void;
  onEditAlarm?: () => void;
}

function TimelineRow({
  entry,
  onToggleTask,
  onEditAlarm,
}: {
  entry: TimelineEntry;
  onToggleTask: (task: DayTask) => void;
  onEditAlarm?: () => void;
}) {
  const isTask = entry.kind === "task";
  const done = entry.completed;

  return (
    <div className={`td-tl-row ${done ? "done" : ""}`}>
      <div className="td-tl-time">
        <span>{formatTimeLabel(entry.hour, entry.minute)}</span>
      </div>
      <div className="td-tl-rail" aria-hidden>
        <span className="td-tl-dot" />
      </div>
      <button
        type="button"
        className={`td-tl-card ${entry.kind}`}
        onClick={() => {
          haptic("light");
          if (isTask && entry.task) onToggleTask(entry.task);
          else onEditAlarm?.();
        }}
      >
        <div className="td-tl-card-top">
          {entry.kind === "alarm" ? (
            <AlarmClock size={14} strokeWidth={2} className="td-tl-icon alarm" />
          ) : (
            <span className={`td-tl-check ${done ? "on" : ""}`} aria-hidden>
              {done && <Check size={12} strokeWidth={3} />}
            </span>
          )}
          <span className="td-tl-kind">{entry.kind === "alarm" ? "Alarm" : "Task"}</span>
          {entry.kind === "task" && (
            <span className="td-tl-dur">{formatDuration(entry.durationMins)}</span>
          )}
        </div>
        <p className="td-tl-title">{entry.title}</p>
        {entry.subtitle && <p className="td-tl-sub">{entry.subtitle}</p>}
      </button>
    </div>
  );
}

export function DayTimelineView({ timeline, onToggleTask, onEditAlarm }: DayTimelineViewProps) {
  const { anytime, entries } = timeline;

  return (
    <section className="td-timeline" aria-label="Day timeline">
      {anytime.length > 0 && (
        <div className="td-anytime">
          <h3 className="td-tl-section">Anytime</h3>
          <ul className="td-anytime-list">
            {anytime.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`td-anytime-item ${t.completed ? "done" : ""}`}
                  onClick={() => {
                    haptic("light");
                    onToggleTask(t);
                  }}
                >
                  <span className={`td-tl-check sm ${t.completed ? "on" : ""}`}>
                    {t.completed && <Check size={10} strokeWidth={3} />}
                  </span>
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entries.length === 0 && anytime.length === 0 ? (
        <div className="td-tl-empty">
          <p>Nothing scheduled yet.</p>
          <p className="td-tl-empty-sub">Add a task or set an alarm for this day.</p>
        </div>
      ) : (
        <div className="td-tl-list">
          {entries.map((e) => (
            <TimelineRow
              key={e.key}
              entry={e}
              onToggleTask={onToggleTask}
              onEditAlarm={onEditAlarm}
            />
          ))}
        </div>
      )}
    </section>
  );
}
