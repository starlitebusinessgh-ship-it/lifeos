"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, Bell, Plus } from "lucide-react";
import type { EntryDraft, FinanceEntry, TxnType } from "@/lib/finance/types";
import {
  computeBalance,
  savingsTotal,
  groupByDay,
  monthSummary,
  spendingByCategory,
} from "@/lib/finance/logic";
import {
  filterByMonth,
  readStoredMonth,
  storeMonth,
} from "@/lib/finance/monthFilter";
import { useEntries } from "@/lib/finance/useEntries";
import { haptic } from "@/lib/finance/haptics";
import { BalanceCard } from "@/components/finance/BalanceCard";
import { AccountsStrip } from "@/components/finance/AccountsStrip";
import { QuickActions } from "@/components/finance/QuickActions";
const SpendingDonut = dynamic(
  () => import("@/components/finance/SpendingDonut").then((m) => m.SpendingDonut),
  { ssr: false }
);
import { TransactionList } from "@/components/finance/TransactionList";
import { AddTransactionSheet } from "@/components/finance/AddTransactionSheet";
import { SearchOverlay } from "@/components/finance/SearchOverlay";
import { BudgetAlerts } from "@/components/finance/BudgetAlerts";
import { FirstRunHint } from "@/components/finance/FirstRunHint";
import { MonthPicker } from "@/components/finance/MonthPicker";
import { PullToRefresh } from "@/components/finance/PullToRefresh";
import { SkeletonHome } from "@/components/finance/Skeleton";
import { useFinanceDelete } from "@/lib/finance/useFinanceDelete";

const RECENT_LIMIT = 12;

export default function FinancePage() {
  const { entries, loading, reload, saveEntry } = useEntries();
  const { removeById, removeEntry } = useFinanceDelete();
  const [month, setMonth] = useState(readStoredMonth);
  const [showAll, setShowAll] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const monthEntries = useMemo(() => filterByMonth(entries, month), [entries, month]);
  const bank = useMemo(() => computeBalance(entries), [entries]);
  const savings = useMemo(() => savingsTotal(entries), [entries]);
  const summary = useMemo(() => monthSummary(monthEntries), [monthEntries]);
  const slices = useMemo(() => spendingByCategory(monthEntries), [monthEntries]);
  const groups = useMemo(() => {
    const list = showAll ? monthEntries : monthEntries.slice(0, RECENT_LIMIT);
    return groupByDay(list);
  }, [monthEntries, showAll]);

  function setMonthAndStore(iso: string) {
    setMonth(iso);
    storeMonth(iso);
  }

  function openNew(type: TxnType) {
    haptic("light");
    setDraft({ type, amount: 0, category: "", intent: null, date: "", description: "" });
    setSheetOpen(true);
  }

  useEffect(() => {
    const add = new URLSearchParams(window.location.search).get("add");
    if (add === "expense") openNew("Expense");
    else if (add === "income") openNew("Income");
  }, []);

  function openEdit(entry: FinanceEntry) {
    setDraft({
      id: entry.id,
      type: entry.type,
      amount: Math.abs(Number(entry.amount)),
      category: entry.category,
      intent: entry.intent,
      date: entry.date,
      description: entry.description,
      debt_id: entry.debt_id,
    });
    setSheetOpen(true);
  }

  async function handleSave(d: EntryDraft) {
    setSaving(true);
    const saved = await saveEntry(d);
    setSaving(false);
    if (saved) {
      haptic("success");
      setSheetOpen(false);
    }
  }

  async function handleDelete(id: number) {
    setSaving(true);
    await removeById(id, () => setSheetOpen(false));
    setSaving(false);
  }

  async function handleSwipeDelete(entry: FinanceEntry) {
    await removeEntry(entry);
  }

  return (
    <PullToRefresh onRefresh={reload}>
      <div className="rv-shell">
        <div className="rv-topbar">
          <div className="rv-avatar" aria-hidden>C</div>
          <MonthPicker value={month} onChange={setMonthAndStore} />
          <button type="button" className="rv-icon-btn" aria-label="Search transactions" onClick={() => setSearchOpen(true)}>
            <Search size={18} />
          </button>
          <Link href="/finance/debts" className="rv-icon-btn" aria-label="Debt reminders">
            <Bell size={18} />
          </Link>
        </div>

        <FirstRunHint />

        {loading && entries.length === 0 ? (
          <SkeletonHome />
        ) : (
          <>
            <BalanceCard balance={bank} />
            <AccountsStrip bank={bank} savings={savings} />
            <QuickActions onAdd={openNew} />
            <BudgetAlerts month={month} />
            <SpendingDonut slices={slices} summary={summary} />

            <div className="rv-section-head">
              <h2>Transactions</h2>
              {monthEntries.length > RECENT_LIMIT && (
                <button type="button" onClick={() => setShowAll((s) => !s)}>
                  {showAll ? "Show less" : "See all"}
                </button>
              )}
            </div>

            <TransactionList
              groups={groups}
              onSelect={openEdit}
              onDelete={handleSwipeDelete}
              emptyHint={`No transactions in ${month}.`}
              emptyAction={{ label: "Add expense", onClick: () => openNew("Expense") }}
            />
          </>
        )}

        <button type="button" className="rv-fab" aria-label="Add expense" onClick={() => openNew("Expense")}>
          <Plus size={22} />
        </button>

        <AddTransactionSheet
          open={sheetOpen}
          initial={draft}
          saving={saving}
          onClose={() => setSheetOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />

        <SearchOverlay
          open={searchOpen}
          entries={monthEntries}
          onClose={() => setSearchOpen(false)}
          onSelect={(e) => {
            setSearchOpen(false);
            openEdit(e);
          }}
          onDelete={handleSwipeDelete}
        />
      </div>
    </PullToRefresh>
  );
}
