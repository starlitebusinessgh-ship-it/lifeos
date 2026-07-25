import type { ReactNode } from "react";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/lifeos/AppShell";
import "../os/os.css";
import "../home/home.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${jakarta.variable} ${instrument.variable} hm-root`}>
      <AppShell tone="light" hideHeader immersive homeLight>
        {children}
      </AppShell>
    </div>
  );
}
