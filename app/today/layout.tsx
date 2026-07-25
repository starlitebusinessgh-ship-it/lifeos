import type { ReactNode } from "react";
import { AppShell } from "@/components/lifeos/AppShell";
import "../os/os.css";
import "./today.css";

export default function TodayLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell tone="module" title="Today">
      <div className="td-app td-in-shell">{children}</div>
    </AppShell>
  );
}
