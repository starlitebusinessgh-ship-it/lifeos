import type { ReactNode } from "react";

export default function EntriesLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ backgroundColor: "#EDE9E1", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
