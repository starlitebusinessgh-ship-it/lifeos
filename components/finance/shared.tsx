"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  ACCENT,
  BG_WARM,
  BORDER,
  TEXT,
  TEXT_MUTED,
  SURFACE,
} from "@/lib/finance/theme";

export { FinanceSelect } from "./FinanceSelect";

export const card: CSSProperties = {
  backgroundColor: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
};

export const cell: CSSProperties = {
  borderBottom: `1px solid ${BORDER}`,
  borderLeft: "none",
  borderRight: "none",
  borderTop: "none",
  padding: "10px 12px",
  fontSize: 13,
  verticalAlign: "middle",
};

export function SheetTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: TEXT }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 14, color: TEXT_MUTED }}>{subtitle}</p>
      )}
    </div>
  );
}

export function StatRow({
  items,
}: {
  items: { label: string; value: string; sub?: string }[];
}) {
  return (
    <div
      className="finance-stat-row"
      style={{
        backgroundColor: BORDER,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            backgroundColor: SURFACE,
            padding: "16px 18px",
          }}
        >
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>{item.label}</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6, color: TEXT }}>
            {item.value}
          </div>
          {item.sub && (
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{item.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function KpiGrid({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return <StatRow items={items} />;
}

export function DataTable({
  headers,
  rows,
  alignRightFrom = 1,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
  alignRightFrom?: number;
}) {
  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            minWidth: 400,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: BG_WARM }}>
              {headers.map((h, i) => (
                <th
                  key={h}
                  style={{
                    ...cell,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: TEXT_MUTED,
                    textAlign: i >= alignRightFrom ? "right" : "left",
                    backgroundColor: BG_WARM,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                style={
                  row[0] === "Total" || String(row[0]).startsWith("Total")
                    ? { fontWeight: 600, backgroundColor: BG_WARM }
                    : undefined
                }
              >
                {row.map((cellVal, ci) => (
                  <td
                    key={ci}
                    style={{
                      ...cell,
                      textAlign: ci >= alignRightFrom ? "right" : "left",
                      fontWeight:
                        row[0] === "Total" || String(row[0]).includes("Total")
                          ? 600
                          : ci === 0
                            ? 500
                            : 400,
                    }}
                  >
                    {cellVal}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SectionHeader({ children, bg }: { children: ReactNode; bg: string }) {
  return (
    <tr>
      <td
        colSpan={99}
        style={{
          ...cell,
          fontWeight: 600,
          fontSize: 13,
          backgroundColor: bg,
        }}
      >
        {children}
      </td>
    </tr>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        ...card,
        padding: 12,
        marginBottom: 16,
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        color: "#B91C1C",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}

export function LoadingText() {
  return <p style={{ color: TEXT_MUTED, fontSize: 14, marginBottom: 16 }}>Loading…</p>;
}

export function ChartBox({
  height,
  children,
}: {
  height: number;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div style={{ width: "100%", height, minWidth: 0, minHeight: height }}>
      {mounted ? (
        children
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: TEXT_MUTED,
            fontSize: 12,
          }}
        >
          Loading chart…
        </div>
      )}
    </div>
  );
}

export { BG_WARM as BG, TEXT, ACCENT, BORDER, TEXT_MUTED };
