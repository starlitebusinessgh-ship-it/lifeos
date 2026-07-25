"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TodayModuleSwitcher() {
  const pathname = usePathname();
  const onToday = !pathname.startsWith("/finance");

  return (
    <div className="td-module-bar">
      <nav className="td-module-switch" aria-label="LifeOS modules">
        <Link
          href="/today"
          className={`td-module-pill ${onToday ? "active" : ""}`}
          aria-current={onToday ? "page" : undefined}
        >
          Today
        </Link>
        <Link href="/finance" className={`td-module-pill ${!onToday ? "active" : ""}`}>
          Finance
        </Link>
      </nav>
    </div>
  );
}
