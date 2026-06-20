import type { Metadata } from "next";
import { DM_Sans, Fraunces, Geist_Mono, Barlow_Condensed } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LifeOS",
  description: "Personal life operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} ${geistMono.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          backgroundColor: "#EDE9E1",
          color: "#1E1E1C",
          fontFamily: "var(--font-body), system-ui, sans-serif",
        }}
      >
        <div
          className="flex flex-1 flex-col"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
