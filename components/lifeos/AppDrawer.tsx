"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sun,
  Inbox,
  Wallet,
  HeartPulse,
  BookOpen,
  Hammer,
  Users,
  House,
  PenLine,
  Archive,
  Settings,
  X,
} from "lucide-react";

interface DrawerModule {
  id: string;
  label: string;
  href?: string;
  color: string;
  soon?: boolean;
}

const GROUPS: { label: string; items: DrawerModule[] }[] = [
  {
    label: "Daily",
    items: [
      { id: "home", label: "Home", href: "/", color: "#ff8c42" },
      { id: "today", label: "Today", href: "/today", color: "#ff9f5a" },
      { id: "inbox", label: "Inbox", href: "/inbox", color: "#8b9fff" },
    ],
  },
  {
    label: "Life",
    items: [
      { id: "finance", label: "Finance", href: "/finance", color: "#6b72ff" },
      { id: "vitality", label: "Vitality", href: "/vitality", color: "#2dd4a8" },
      { id: "learn", label: "Learn", href: "/learn", color: "#c4a1ff" },
      { id: "build", label: "Build", href: "/build", color: "#94a3b8" },
      { id: "circle", label: "Circle", color: "#f472b6", soon: true },
      { id: "space", label: "Space", color: "#fbbf24", soon: true },
      { id: "create", label: "Create", color: "#fb7185", soon: true },
    ],
  },
  {
    label: "Library",
    items: [{ id: "vault", label: "Vault", color: "#64748b", soon: true }],
  },
];

const ICONS: Record<string, typeof Home> = {
  home: Home,
  today: Sun,
  inbox: Inbox,
  finance: Wallet,
  vitality: HeartPulse,
  learn: BookOpen,
  build: Hammer,
  circle: Users,
  space: House,
  create: PenLine,
  vault: Archive,
};

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const pathname = usePathname();

  function isActive(href?: string) {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <div
        className={`lo-drawer-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside className={`lo-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="lo-drawer-head">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2>LifeOS</h2>
              <p>Your life in one place</p>
            </div>
            <button type="button" className="lo-icon-btn" aria-label="Close menu" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        <nav className="lo-drawer-scroll" aria-label="Life modules">
          {GROUPS.map((group) => (
            <div key={group.label} className="lo-drawer-group">
              <div className="lo-drawer-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = ICONS[item.id] ?? Home;
                const active = isActive(item.href);
                if (item.soon || !item.href) {
                  return (
                    <div key={item.id} className="lo-drawer-link disabled" aria-disabled>
                      <span className="lo-drawer-dot" style={{ background: item.color }} />
                      <Icon size={18} strokeWidth={1.75} style={{ opacity: 0.7 }} />
                      <span>{item.label}</span>
                      <span className="lo-drawer-soon">Soon</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`lo-drawer-link ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={onClose}
                  >
                    <span className="lo-drawer-dot" style={{ background: item.color }} />
                    <Icon size={18} strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="lo-drawer-group">
            <Link
              href="/finance/more"
              className={`lo-drawer-link ${pathname === "/finance/more" ? "active" : ""}`}
              onClick={onClose}
            >
              <Settings size={18} strokeWidth={1.75} />
              <span>Settings</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
