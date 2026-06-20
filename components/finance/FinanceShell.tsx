"use client";

import { type ReactNode } from "react";
import { BG, TEXT, TEXT_MUTED } from "@/lib/finance/theme";

export function FinanceShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="finance-shell"
      style={{
        minHeight: "100%",
        background: BG,
        color: TEXT,
        fontFamily: "var(--font-body), system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </div>
  );
}

export function FinanceSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      {title && (
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            fontWeight: 600,
            color: TEXT_MUTED,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
