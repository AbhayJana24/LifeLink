import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
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
  title: {
    default: "LifeLink — Blood & Plasma Donor Finder (Delhi NCR)",
    template: "%s | LifeLink",
  },
  description:
    "Geospatial blood & plasma donor finder for Delhi NCR with PostGIS matching, Leaflet maps, SMS emergency alerts, and offline PWA donor ID card.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#fffafa] text-neutral-900">
        <Navbar />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="mt-16 border-t border-red-100 bg-white py-8 text-center text-xs text-neutral-500">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-semibold text-neutral-700">
              🩸 LifeLink — Geospatial Blood & Plasma Donor Network (Delhi NCR)
            </p>
            <p className="mt-1">
              Built with Next.js App Router, TypeScript, PostgreSQL + PostGIS (Supabase), Drizzle
              ORM, Leaflet & OpenStreetMap, and PWA Service Workers. Always follow final medical
              screening at a licensed blood bank.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
