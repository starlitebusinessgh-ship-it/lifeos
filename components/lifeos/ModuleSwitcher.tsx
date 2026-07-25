"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Module switcher for Finance — cobalt Revolut style */
export function ModuleSwitcher() {
  const pathname = usePathname();
  const isFinance = pathname.startsWith("/finance");

  return (
    <nav className="rv-module-switch" aria-label="LifeOS modules">
      <Link
        href="/today"
        className={`rv-module-pill ${!isFinance ? "active" : ""}`}
        aria-current={!isFinance ? "page" : undefined}
      >
        Today
      </Link>
      <Link
        href="/finance"
        className={`rv-module-pill ${isFinance ? "active" : ""}`}
        aria-current={isFinance ? "page" : undefined}
      >
        Finance
      </Link>
    </nav>
  );
}
