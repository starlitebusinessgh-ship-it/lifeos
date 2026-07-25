"use client";

import { useMemo, useState } from "react";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import { useInbox } from "@/lib/inbox/useInbox";
import { CAPTURE_TYPES, type InboxDraft, type InboxItem } from "@/lib/inbox/types";
import { InboxCard } from "@/components/inbox/InboxCard";
import { CaptureSheet } from "@/components/inbox/CaptureSheet";
import { useCapture } from "@/components/inbox/CaptureContext";
import { haptic } from "@/lib/finance/haptics";

export default function InboxPage() {
  const { items, loading, reload } = useInbox("inbox");
  const { openCapture } = useCapture();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editDraft, setEditDraft] = useState<InboxDraft | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return items;
    return items.filter((i) => i.capture_type === typeFilter);
  }, [items, typeFilter]);

  function openEdit(item: InboxItem) {
    setEditDraft({
      id: item.id,
      capture_type: item.capture_type as InboxDraft["capture_type"],
      life_area: item.life_area as InboxDraft["life_area"],
      title: item.title,
      content: item.content,
      raw_content: item.raw_content,
      tags: item.tags,
    });
    setEditOpen(true);
  }

  return (
    <>
      <div className="ib-shell">
        <header className="ib-head">
          <div className="ib-head-icon" aria-hidden>
            <InboxIcon size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h1>Inbox</h1>
            <p>
              {loading
                ? "Loading…"
                : filtered.length === 0
                  ? "Nothing captured yet"
                  : `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
            </p>
          </div>
        </header>

        <div className="ib-filters" role="tablist" aria-label="Filter by type">
          <button
            type="button"
            role="tab"
            aria-selected={typeFilter === "all"}
            className={`ib-filter ${typeFilter === "all" ? "active" : ""}`}
            onClick={() => {
              haptic("light");
              setTypeFilter("all");
            }}
          >
            All
          </button>
          {CAPTURE_TYPES.slice(0, 6).map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={typeFilter === t.value}
              className={`ib-filter ${typeFilter === t.value ? "active" : ""}`}
              onClick={() => {
                haptic("light");
                setTypeFilter(t.value);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && items.length === 0 ? (
          <div className="ib-skel-list">
            <div className="ib-skel-card" />
            <div className="ib-skel-card" />
            <div className="ib-skel-card" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="ib-empty">
            <p className="ib-empty-title">Your mind, captured</p>
            <p className="ib-empty-sub">
              Thoughts, ideas, prayers, lessons — anything worth keeping lands here.
            </p>
            <button
              type="button"
              className="ib-empty-btn"
              onClick={() => {
                haptic("light");
                openCapture();
              }}
            >
              Capture something
            </button>
          </div>
        ) : (
          <div className="ib-list">
            {filtered.map((item) => (
              <InboxCard key={item.id} item={item} onOpen={openEdit} />
            ))}
          </div>
        )}

        <button
          type="button"
          className="ib-fab"
          aria-label="New capture"
          onClick={() => {
            haptic("light");
            openCapture();
          }}
        >
          <Plus size={24} strokeWidth={2} />
        </button>
      </div>

      <CaptureSheet
        open={editOpen}
        initial={editDraft}
        onClose={() => setEditOpen(false)}
        onSaved={() => void reload()}
      />
    </>
  );
}
