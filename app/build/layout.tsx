import type { ReactNode } from "react";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "@/app/learn/learn.css";

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

export default function BuildLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${jakarta.variable} ${instrument.variable} ln-root`}>
      <div className="ln-app">{children}</div>
    </div>
  );
}
