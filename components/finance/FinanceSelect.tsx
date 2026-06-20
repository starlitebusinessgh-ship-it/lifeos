"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { BORDER, SURFACE, TEXT, TEXT_MUTED } from "@/lib/finance/theme";

type SelectOption = { value: string; label: string };

export function FinanceSelect({
  value,
  onChange,
  options,
  ariaLabel,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      minWidth: rect.width,
      zIndex: 10000,
    });
  }, [open]);

  const menu = open ? (
    <ul
      ref={menuRef}
      role="listbox"
      aria-label={ariaLabel}
      style={{
        ...menuStyle,
        maxHeight: 260,
        overflowY: "auto",
        margin: 0,
        padding: 6,
        listStyle: "none",
        backgroundColor: SURFACE,
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(46, 42, 39, 0.12)",
      }}
    >
      {options.map((opt) => (
        <li key={opt.value} role="option" aria-selected={opt.value === value}>
          <button
            type="button"
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              border: "none",
              borderRadius: 10,
              backgroundColor: opt.value === value ? BORDER : "transparent",
              color: opt.value === value ? TEXT : TEXT_MUTED,
              fontWeight: opt.value === value ? 500 : 400,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: compact ? "6px 14px" : "8px 16px",
          borderRadius: 999,
          border: `1px solid ${BORDER}`,
          backgroundColor: SURFACE,
          color: TEXT,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          minWidth: compact ? 130 : 160,
          justifyContent: "space-between",
        }}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          aria-hidden
          style={{
            color: TEXT_MUTED,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        />
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
