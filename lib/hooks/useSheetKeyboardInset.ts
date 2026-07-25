"use client";

import { useEffect } from "react";

/** Keeps bottom sheets above the on-screen keyboard (iOS PWA / mobile Safari). */
export function useSheetKeyboardInset(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const root = document.documentElement;
    const vv = window.visualViewport;

    const sync = () => {
      if (!vv) {
        root.style.removeProperty("--sheet-keyboard-inset");
        return;
      }
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--sheet-keyboard-inset", `${inset}px`);
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      root.style.removeProperty("--sheet-keyboard-inset");
    };
  }, [active]);
}
