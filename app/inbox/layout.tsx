import type { ReactNode } from "react";
import { AppShell } from "@/components/lifeos/AppShell";
import "../os/os.css";
import "./inbox.css";

export default function InboxLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell tone="module" title="Inbox">
      <div className="ib-app ib-in-shell">{children}</div>
    </AppShell>
  );
}
