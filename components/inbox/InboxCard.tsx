"use client";

import { formatCaptureType, formatInboxTime, type InboxItem } from "@/lib/inbox/types";
import { haptic } from "@/lib/finance/haptics";

export function InboxCard({
  item,
  onOpen,
}: {
  item: InboxItem;
  onOpen: (item: InboxItem) => void;
}) {
  const preview =
    item.content.length > 160 ? `${item.content.slice(0, 160).trim()}…` : item.content;

  return (
    <button
      type="button"
      className="ib-card"
      onClick={() => {
        haptic("light");
        onOpen(item);
      }}
    >
      <div className="ib-card-top">
        <span className="ib-type-badge">{formatCaptureType(item.capture_type)}</span>
        <span className="ib-area-badge">{item.life_area}</span>
        <time className="ib-card-time" dateTime={item.created_at}>
          {formatInboxTime(item.created_at)}
        </time>
      </div>
      {item.title && <p className="ib-card-title">{item.title}</p>}
      <p className="ib-card-body">{preview}</p>
    </button>
  );
}
