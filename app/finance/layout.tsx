import type { ReactNode } from "react";
import { BottomTabBar } from "@/components/finance/BottomTabBar";
import { DebtNotifications } from "@/components/finance/DebtNotifications";
import { PwaRegister, PwaInstallHint } from "@/components/finance/PwaInstall";
import { EntriesProvider } from "@/lib/finance/EntriesContext";
import { ToastProvider } from "@/components/finance/ToastProvider";
import { ErrorBanner } from "@/components/finance/ErrorBanner";
import { ThemeProvider } from "@/components/finance/ThemeToggle";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <EntriesProvider>
        <ToastProvider>
          <PwaRegister />
          <PwaInstallHint />
          <DebtNotifications />
          <ErrorBanner />
          {children}
          <BottomTabBar />
        </ToastProvider>
      </EntriesProvider>
    </ThemeProvider>
  );
}
