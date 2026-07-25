"use client";

import { createContext, useContext, type ReactNode } from "react";

interface LearnChromeContextValue {
  openDrawer: () => void;
  openSearch: () => void;
}

const LearnChromeContext = createContext<LearnChromeContextValue | null>(null);

export function LearnChromeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: LearnChromeContextValue;
}) {
  return (
    <LearnChromeContext.Provider value={value}>{children}</LearnChromeContext.Provider>
  );
}

export function useLearnChrome(): LearnChromeContextValue | null {
  return useContext(LearnChromeContext);
}
