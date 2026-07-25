"use client";

import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Menu, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppDrawer } from "./AppDrawer";
import { DailyBar } from "./DailyBar";
import { SearchPalette } from "./SearchPalette";
import { ShellProvider } from "./ShellContext";
import { useCaptureOptional } from "@/components/inbox/CaptureContext";
import { haptic } from "@/lib/finance/haptics";
import { dayPhase, type DayPhase } from "@/lib/home/briefing";

export type ShellTone = "cockpit" | "light" | "module";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  tone?: ShellTone;
  phase?: DayPhase;
  showDailyBar?: boolean;
  hideHeader?: boolean;
  immersive?: boolean;
  homeLight?: boolean;
}

export function AppShell({
  children,
  title = "LifeOS",
  tone = "cockpit",
  phase: phaseProp,
  showDailyBar = true,
  hideHeader = false,
  immersive = false,
  homeLight = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [phase, setPhase] = useState<DayPhase>(phaseProp ?? dayPhase());
  const capture = useCaptureOptional();

  const openDrawer = useCallback(() => {
    haptic("light");
    setDrawerOpen(true);
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  const openCapture = useCallback(() => {
    haptic("light");
    capture?.openCapture();
  }, [capture]);

  useEffect(() => {
    if (phaseProp) setPhase(phaseProp);
    const id = window.setInterval(() => setPhase(dayPhase()), 60_000);
    return () => window.clearInterval(id);
  }, [phaseProp]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let startX = 0;
    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      if (startX > 28) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 70) openDrawer();
    }
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [openDrawer]);

  const isFinance = pathname.startsWith("/finance");
  const isLightModule = pathname.startsWith("/learn") || pathname.startsWith("/build");
  const dailyBar = showDailyBar && !isFinance;

  const rootClass = [
    "lo-app",
    `lo-tone-${tone}`,
    tone === "cockpit" && !homeLight ? `lo-phase-${phase}` : "",
    immersive ? "lo-immersive" : "",
    homeLight ? "lo-home-light" : "",
    isLightModule ? "lo-app--learn" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shellActions = useMemo(
    () => ({ openDrawer, openSearch, openCapture }),
    [openDrawer, openSearch, openCapture]
  );

  const headerClass =
    tone === "light" || tone === "module"
      ? `lo-header lo-header-light${isLightModule ? " lo-header-learn" : ""}`
      : "lo-header";
  const titleClass =
    tone === "light" || tone === "module"
      ? "lo-header-title lo-header-title-light"
      : "lo-header-title";
  const iconClass =
    tone === "light" || tone === "module" ? "lo-icon-btn lo-icon-btn-light" : "lo-icon-btn";
  const accentIconClass =
    tone === "light" || tone === "module"
      ? `${iconClass} lo-icon-btn-accent-light`
      : `${iconClass} lo-icon-btn-accent`;

  return (
    <div className={rootClass}>
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ShellProvider actions={shellActions}>
        <div className={`lo-shell ${dailyBar ? "lo-has-daily" : ""} ${immersive ? "lo-shell-immersive" : ""}`}>
          {!hideHeader && (
            <header className={headerClass}>
              <button type="button" className={iconClass} aria-label="Open menu" onClick={openDrawer}>
                <Menu size={20} strokeWidth={1.75} />
              </button>
              <div className="lo-header-center">
                <span className={titleClass}>{title}</span>
              </div>
              <button type="button" className={accentIconClass} aria-label="Quick capture" onClick={openCapture}>
                <Plus size={20} strokeWidth={2} />
              </button>
            </header>
          )}
          {children}
        </div>
      </ShellProvider>
      {dailyBar && <DailyBar onSearch={openSearch} light={isLightModule} />}
    </div>
  );
}

/** Minimal LifeOS nav for Finance — drawer + capture, no daily bar. */
export function LifeOSNavBar({ title = "Finance" }: { title?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const capture = useCaptureOptional();

  const openCapture = useCallback(() => {
    haptic("light");
    capture?.openCapture();
  }, [capture]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="lo-finance-nav">
        <header className="lo-header lo-header-finance">
        <button
          type="button"
          className="lo-icon-btn lo-icon-btn-finance"
          aria-label="Open menu"
          onClick={() => {
            haptic("light");
            setDrawerOpen(true);
          }}
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <span className="lo-header-title lo-header-title-finance">{title}</span>
        <button
          type="button"
          className="lo-icon-btn lo-icon-btn-finance lo-icon-btn-finance-accent"
          aria-label="Quick capture"
          onClick={openCapture}
        >
          <Plus size={20} strokeWidth={2} />
        </button>
        </header>
      </div>
    </>
  );
}
