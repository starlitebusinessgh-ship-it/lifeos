"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PenLine, AlignJustify } from "lucide-react";

const TABS = [
  { href: "/today",   label: "NOW",   Icon: Home          },
  { href: "/spaces",  label: "LIFE",  Icon: LayoutGrid    },
  { href: "/capture", label: "WRITE", Icon: PenLine, fab: true },
  { href: "/entries", label: "FEED",  Icon: AlignJustify  },
] as const;

export default function BottomNav() {
  const pathname = usePathname() ?? "";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "#EDE9E1",
        borderTop: "1px solid rgba(30,28,24,0.09)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          display: "flex",
          maxWidth: "32rem",
          margin: "0 auto",
          height: "4rem",
          alignItems: "center",
          padding: "0 0.25rem",
        }}
      >
        {TABS.map(({ href, label, Icon, fab }) => {
          const active = isActive(href);

          if (fab) {
            return (
              <Link
                key={href}
                href={href}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.1875rem",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "0.875rem",
                    background: active ? "#8B6914" : "#A67C2E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(166,124,46,0.35)",
                    marginTop: "-0.5rem",
                  }}
                >
                  <Icon size={20} strokeWidth={2} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: "0.5625rem",
                    fontFamily: "var(--font-body), system-ui, sans-serif",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    color: active ? "#8B6914" : "#A67C2E",
                    marginTop: "0.125rem",
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
                textDecoration: "none",
                paddingTop: "0.375rem",
              }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                color={active ? "#1A1A18" : "#9A9490"}
              />
              <span
                style={{
                  fontSize: "0.5625rem",
                  fontFamily: "var(--font-body), system-ui, sans-serif",
                  letterSpacing: "0.08em",
                  fontWeight: active ? 700 : 400,
                  color: active ? "#1A1A18" : "#9A9490",
                }}
              >
                {label}
              </span>
              {active && (
                <div
                  style={{
                    width: "1.25rem",
                    height: "2px",
                    borderRadius: "1px",
                    background: "#1A1A18",
                    marginTop: "-0.125rem",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
