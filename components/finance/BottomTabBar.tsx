"use client";

import { Home, PieChart, Wallet, PiggyBank, ArrowLeftRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Home", href: "/finance", Icon: Home },
  { label: "Charts", href: "/finance/analytics", Icon: PieChart },
  { label: "Budgets", href: "/finance/budgets", Icon: Wallet },
  { label: "Debts", href: "/finance/debts", Icon: ArrowLeftRight },
  { label: "Save", href: "/finance/savings", Icon: PiggyBank },
  { label: "More", href: "/finance/more", Icon: MoreHorizontal },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const moreActive = pathname === "/finance/more" || pathname === "/finance/recurring";

  return (
    <nav className="rv-tabbar" aria-label="Finance sections">
      {TABS.map(({ label, href, Icon }) => {
        const active = href === "/finance/more" ? moreActive : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`rv-tab ${active ? "active" : ""}`}
            aria-label={label}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={21} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
