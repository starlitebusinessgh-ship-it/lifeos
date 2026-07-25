"use client";

import type { ReactNode } from "react";
import { LearnShell } from "@/components/learn/LearnShell";

export function LearnLayoutClient({ children }: { children: ReactNode }) {
  return <LearnShell>{children}</LearnShell>;
}
