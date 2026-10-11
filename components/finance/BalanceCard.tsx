"use client";

import { motion } from "motion/react";
import { Wifi } from "lucide-react";
import { splitMoney } from "@/lib/finance/logic";

function MastercardMark() {
  return (
    <svg
      className="rv-mastercard-mark"
      viewBox="0 0 38 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mastercard"
      role="img"
    >
      <circle cx="14" cy="12" r="10" fill="#EB001B" />
      <circle cx="24" cy="12" r="10" fill="#F79E1B" />
      <path
        d="M19 4.8a10 10 0 0 0-3.8 7.2 10 10 0 0 0 3.8 7.2 10 10 0 0 0 3.8-7.2 10 10 0 0 0-3.8-7.2z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function BalanceCard({ balance, preview = false }: { balance: number; preview?: boolean }) {
  const { whole, cents } = splitMoney(balance);

  return (
    <motion.div
      className="rv-master-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="rv-master-card-bg" aria-hidden />
      <div className="rv-master-card-shine" aria-hidden />

      <div className="rv-master-card-top">
        <MastercardMark />
        <Wifi size={18} className="rv-master-contactless" aria-hidden />
      </div>

      <div className="rv-master-card-mid">
        <div className="rv-master-card-label">{preview ? "Private balance" : "Total balance"}</div>
        <div className="rv-master-card-amount">
          {preview ? <span className="rv-preview-mask" aria-label="Hidden in public preview">••••••</span> : <>{whole}<span className="cents">{cents}</span></>}
        </div>
      </div>

      <div className="rv-master-card-foot">
        <span className="rv-master-name">{preview ? "PRIVATE DATA HIDDEN" : "PERSONAL ACCOUNT"}</span>
      </div>
    </motion.div>
  );
}
