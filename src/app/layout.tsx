import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Clutch Gear — gaming mice, keyboards & headsets", template: "%s | Clutch Gear" },
  description: "Gear for the clutch moments. A portfolio demo store for a made-up gaming gear brand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <p className="bg-accent px-4 py-1.5 text-center text-xs font-medium text-accent-ink">
          Portfolio demo — Clutch Gear is a made-up brand. Nothing here is for sale, and checkout uses Stripe test mode.
        </p>
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
