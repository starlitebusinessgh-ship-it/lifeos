"use client";

import { createContext, useContext, type ReactNode } from "react";

interface ShellActions {
  openDrawer: () => void;
  openSearch: () => void;
  openCapture: () => void;
}

const ShellContext = createContext<ShellActions | null>(null);

export function ShellProvider({
  children,
  actions,
}: {
  children: ReactNode;
  actions: ShellActions;
}) {
  return <ShellContext.Provider value={actions}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within AppShell");
  return ctx;
}

export function useShellOptional() {
  return useContext(ShellContext);
}
