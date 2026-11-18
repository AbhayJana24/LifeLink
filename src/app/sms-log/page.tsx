import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { getSmsProvider } from "@/server/sms";
import { listNotifications } from "@/server/store";

export const dynamic = "force-dynamic";

export default function SmsLogPage() {
  const notifications = listNotifications();
  const provider = getSmsProvider();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            SMS Gateway Inspector · Provider: {provider.name.toUpperCase()}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Outbound SMS Alert & Notification Log ({notifications.length})
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Every urgent request and donor acceptance dispatches an SMS via the configured provider
            (Console / Twilio / Fast2SMS). Use this console to inspect outbound payloads.
          </p>
        </div>
        <Link
          href="/requests/new"
          className="rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
        >
          + Trigger New Broadcast
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-red-100 bg-red-50/70 text-xs font-bold uppercase text-red-900">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">E.164 Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SMS Payload</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-neutral-50/80">
                  <td className="px-4 py-3 font-semibold text-neutral-900">{n.recipientName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                    {formatPhone(n.to)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        n.status === "SENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {n.status}
                    </span>
                  </td>
                  <td className="max-w-xl px-4 py-3 font-mono text-xs text-neutral-700">
                    {n.body}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {n.requestId && (
                      <Link
                        href={`/requests/${n.requestId}`}
                        className="font-semibold text-red-600 hover:underline"
                      >
                        Open Request →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
