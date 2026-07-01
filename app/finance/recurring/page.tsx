"use client";

import { RecurringCard } from "@/components/finance/RecurringCard";
import { useEntries } from "@/lib/finance/useEntries";
import { PullToRefresh } from "@/components/finance/PullToRefresh";
import { SkeletonScreen } from "@/components/finance/Skeleton";

export default function RecurringPage() {
  const { entries, loading, reload } = useEntries();

  if (loading && entries.length === 0) {
    return (
      <div className="rv-shell">
        <SkeletonScreen />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={reload}>
      <div className="rv-shell">
        <div className="rv-screen-head">
          <h1>Recurring</h1>
          <p>Salary, tithe, savings — log each month with one tap</p>
        </div>
        <RecurringCard entries={entries} onChanged={reload} fullPage />
      </div>
    </PullToRefresh>
  );
}
