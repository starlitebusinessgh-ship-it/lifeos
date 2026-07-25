import type { ReactNode } from "react";
import { LearnLayoutClient } from "@/components/learn/LearnLayoutClient";
import "./learn.css";

export default function LearnRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ln-root">
      <div className="ln-app">
        <LearnLayoutClient>{children}</LearnLayoutClient>
      </div>
    </div>
  );
}
