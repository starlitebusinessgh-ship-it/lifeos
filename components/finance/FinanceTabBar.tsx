"use client";

import { FINANCE_TABS } from "@/lib/finance/theme";
import type { FinanceTabId } from "@/lib/finance/types";
import { ACCENT, BORDER, TEXT, TEXT_MUTED } from "@/lib/finance/theme";

export function FinanceTabBar({
  active,
  onChange,
}: {
  active: FinanceTabId;
  onChange: (id: FinanceTabId) => void;
}) {
  return (
    <nav
      aria-label="Finance sections"
      style={{
        display: "flex",
        gap: 0,
        overflowX: "auto",
        borderBottom: `1px solid ${BORDER}`,
        marginBottom: 0,
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        position: "sticky",
        top: 0,
        zIndex: 20,
        backgroundColor: "#FFFFFF",
      }}
    >
      {FINANCE_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink: 0,
              padding: "12px 16px",
              border: "none",
              borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
              marginBottom: -1,
              background: "transparent",
              color: isActive ? TEXT : TEXT_MUTED,
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
