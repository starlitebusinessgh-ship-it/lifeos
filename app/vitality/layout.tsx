import type { ReactNode } from "react";
import { AppShell } from "@/components/lifeos/AppShell";
import "../os/os.css";
import "./vitality.css";

export default function VitalityLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell tone="module" title="Vitality">
      <div className="vt-app vt-in-shell">{children}</div>
    </AppShell>
  );
}
