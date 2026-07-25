import type { ReactNode } from "react";
import { BottomTabBar } from "@/components/finance/BottomTabBar";
import { DebtNotifications } from "@/components/finance/DebtNotifications";
import { EntriesProvider } from "@/lib/finance/EntriesContext";
import { ErrorBanner } from "@/components/finance/ErrorBanner";
import { LifeOSNavBar } from "@/components/lifeos/AppShell";
import "../os/os.css";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <EntriesProvider>
      <DebtNotifications />
      <ErrorBanner />
      <LifeOSNavBar title="Finance" />
      {children}
      <BottomTabBar />
    </EntriesProvider>
  );
}
