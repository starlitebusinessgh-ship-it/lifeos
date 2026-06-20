"use client";

import type { FinanceInsight, MemoryEvent } from "@/lib/finance/insights";
import { BORDER, TEXT, TEXT_MUTED } from "@/lib/finance/theme";
import { card } from "./shared";

type Props = {
  insights: FinanceInsight[];
  memory: MemoryEvent[];
};

export function FinanceInsightsFeed({ insights, memory }: Props) {
  if (insights.length === 0 && memory.length === 0) return null;

  return (
    <div>
      {insights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {insights.map((insight, i) => (
            <div
              key={i}
              style={{
                ...card,
                padding: "16px 18px",
              }}
            >
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: TEXT }}>
                {insight.headline}
              </p>
              {insight.detail && (
                <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: TEXT_MUTED }}>
                  {insight.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {memory.length > 0 && (
        <div style={{ ...card, padding: "16px 18px", marginTop: insights.length > 0 ? 16 : 0 }}>
          {memory.map((event, i) => (
            <div
              key={`${event.sortKey}-${i}`}
              style={{
                paddingBottom: i < memory.length - 1 ? 14 : 0,
                marginBottom: i < memory.length - 1 ? 14 : 0,
                borderBottom: i < memory.length - 1 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>{event.month}</div>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: TEXT }}>{event.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
