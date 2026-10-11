"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/finance/ThemeToggle";
import { ToastProvider } from "@/components/finance/ToastProvider";
import { PwaRegister, PwaInstallHint } from "@/components/finance/PwaInstall";
import { CaptureProvider } from "@/components/inbox/CaptureContext";
import { GlobalCapture } from "@/components/inbox/GlobalCapture";

export function LifeOSProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CaptureProvider>
          <PwaRegister />
          {children}
          <GlobalCapture />
          <PwaInstallHint />
        </CaptureProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
