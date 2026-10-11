import type { ReactNode } from "react";
import { AppShell } from "@/components/lifeos/AppShell";
import "../os/os.css";
import "./review.css";

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <AppShell tone="module" title="Weekly review"><div className="rv-app">{children}</div></AppShell>;
}
