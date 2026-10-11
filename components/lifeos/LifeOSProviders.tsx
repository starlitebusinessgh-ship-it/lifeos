"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/finance/ThemeToggle";
import { ToastProvider } from "@/components/finance/ToastProvider";
import { PwaRegister, PwaInstallHint } from "@/components/finance/PwaInstall";
import { CaptureProvider } from "@/components/inbox/CaptureContext";
import { GlobalCapture } from "@/components/inbox/GlobalCapture";
import { AuthGate } from "@/components/auth/AuthGate";

export function LifeOSProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CaptureProvider>
          <PwaRegister />
          <AuthGate>
            {children}
            <GlobalCapture />
          </AuthGate>
          <PwaInstallHint />
        </CaptureProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
