"use client";

import { useRef, useState, type ReactNode } from "react";

export function TodayPullRefresh({
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
      onTouchStart={(e) => {
        if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (refreshing || window.scrollY > 0) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy > 0) setPull(Math.min(64, dy * 0.4));
      }}
      onTouchEnd={() => {
        if (pull > 44 && !refreshing) {
          setRefreshing(true);
          void onRefresh().finally(() => {
            setRefreshing(false);
            setPull(0);
          });
        } else setPull(0);
      }}
    >
      <div className="td-ptr-hint" style={{ height: pull || (refreshing ? 36 : 0) }}>
        {refreshing ? "Refreshing…" : pull > 44 ? "Release" : pull > 8 ? "Pull down" : ""}
      </div>
      {children}
    </div>
  );
}
