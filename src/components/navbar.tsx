"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const NAV_ITEMS = [
  { href: "/find", label: "Donor Map & Finder" },
  { href: "/requests", label: "Urgent Requests" },
  { href: "/requests/new", label: "Post Request" },
  { href: "/donor", label: "Donor Hub & ID Card" },
  { href: "/sms-log", label: "SMS Alert Log" },
];

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function Navbar() {
  const pathname = usePathname();
  const online = useSyncExternalStore(
    subscribeOnlineStatus,
    () => navigator.onLine,
    () => true,
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration errors in dev
      });
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-red-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white shadow-sm">
              🩸
            </span>
            <span>LifeLink</span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              Delhi NCR
            </span>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/requests" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                  active
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-neutral-700 hover:bg-red-50 hover:text-red-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              online
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-300 bg-amber-50 text-amber-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {online ? "PWA Ready" : "Offline Mode"}
          </span>
        </div>
      </div>
    </header>
  );
}
