"use client";

import { useRef, useState, type ReactNode } from "react";

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) {
  const startY = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  return (
    <div
      className="rv-ptr"
      onTouchStart={(e) => {
        if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (refreshing || window.scrollY > 0) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy > 0) setPull(Math.min(72, dy * 0.45));
      }}
      onTouchEnd={() => {
        if (pull > 48 && !refreshing) {
          setRefreshing(true);
          void onRefresh().finally(() => {
            setRefreshing(false);
            setPull(0);
          });
        } else {
          setPull(0);
        }
      }}
    >
      <div className="rv-ptr-indicator" style={{ height: pull || (refreshing ? 40 : 0) }}>
        {refreshing ? "Refreshing…" : pull > 48 ? "Release to refresh" : pull > 8 ? "Pull to refresh" : ""}
      </div>
      {children}
    </div>
  );
}
