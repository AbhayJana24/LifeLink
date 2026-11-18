import { BLOOD_GROUPS, canDonate } from "@/lib/blood";

/** Donor (rows) x recipient (columns) whole-blood compatibility grid. */
export function CompatibilityChart() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-red-100 bg-white shadow-sm">
      <table className="w-full text-center text-sm">
        <caption className="sr-only">Whole blood compatibility: donor rows, recipient columns</caption>
        <thead>
          <tr className="bg-red-50 text-red-900">
            <th scope="col" className="p-3 text-left text-xs font-medium">
              Donor ↓ / Recipient →
            </th>
            {BLOOD_GROUPS.map((g) => (
              <th key={g} scope="col" className="p-3 font-semibold">
                {g}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BLOOD_GROUPS.map((donor) => (
            <tr key={donor} className="border-t border-red-50">
              <th scope="row" className="p-3 text-left font-semibold text-red-900">
                {donor}
              </th>
              {BLOOD_GROUPS.map((recipient) => {
                const ok = canDonate(donor, recipient);
                return (
                  <td key={recipient} className="p-2">
                    <span
                      aria-label={ok ? "compatible" : "not compatible"}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        ok ? "bg-red-600 text-white" : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {ok ? "✓" : "–"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
