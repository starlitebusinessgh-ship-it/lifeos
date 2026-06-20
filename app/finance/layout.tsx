import type { ReactNode } from "react";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-full flex-1 bg-white"
      style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      {children}
    </div>
  );
}
