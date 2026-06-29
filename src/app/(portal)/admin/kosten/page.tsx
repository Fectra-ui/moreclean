import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { getExpenses, getExpenseStats, EXPENSE_TYPE_LABEL } from "@/lib/services/accounting/expenses";
import Link from "next/link";

export const metadata: Metadata = { title: "Kostenregistratie" };

export default async function KostenPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string; type?: string }>;
}) {
  const { profile } = await requireAdmin();

  const params = await searchParams;
  const year = params.year ? Number(params.year) : new Date().getFullYear();
  const quarter = params.quarter ? Number(params.quarter) : undefined;

  const [expenses, stats] = await Promise.all([
    getExpenses({ year, quarter }),
    getExpenseStats(year, quarter),
  ]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#101536]">Kostenregistratie</h1>
        <Link
          href={`/api/expenses/export?year=${year}${quarter ? `&quarter=${quarter}` : ""}`}
          className="rounded-2xl border border-[#101536]/10 bg-white px-4 py-2 text-sm font-semibold text-[#606774] shadow-sm transition hover:border-[#4D7EBA]/30 hover:text-[#4D7EBA]"
        >
          CSV exporteren
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Totale kosten", value: `€${Number(stats.total).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`, color: "text-[#101536]" },
          { label: "Brandstof", value: `€${Number(stats.byType.fuel).toFixed(0)}`, color: "text-amber-600" },
          { label: "Onderhoud", value: `€${Number(stats.byType.maintenance).toFixed(0)}`, color: "text-blue-600" },
          { label: "Goed te keuren", value: stats.pendingApproval.toString(), color: stats.pendingApproval > 0 ? "text-red-500" : "text-[#606774]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Kosten per type — minigrafiek */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-[#101536]">Verdeling per categorie</h2>
        <div className="space-y-2">
          {(Object.entries(EXPENSE_TYPE_LABEL) as [keyof typeof EXPENSE_TYPE_LABEL, { label: string; icon: string }][])
            .filter(([t]) => stats.byType[t] > 0)
            .sort(([, , a = 0], [, , b = 0]) => b - a)
            .map(([type, meta]) => {
              const amount = stats.byType[type];
              const pct = stats.total > 0 ? (amount / stats.total) * 100 : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="w-6 text-center">{meta.icon}</span>
                  <span className="w-28 text-sm text-[#606774]">{meta.label}</span>
                  <div className="flex-1 rounded-full bg-[#F3F5F7] overflow-hidden h-2">
                    <div className="h-full rounded-full bg-[#4D7EBA] transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-[#101536]">€{amount.toFixed(0)}</span>
                  <span className="w-10 text-right text-xs text-[#606774]">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[currentYear, currentYear - 1].map((y) => (
          <Link key={y} href={`?year=${y}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${year === y && !quarter ? "bg-[#4D7EBA] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}>
            {y}
          </Link>
        ))}
        <span className="mx-1 text-[#101536]/20">|</span>
        {[1, 2, 3, 4].map((q) => (
          <Link key={q} href={`?year=${year}&quarter=${q}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${quarter === q ? "bg-[#101536] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}>
            Q{q}
          </Link>
        ))}
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
        {expenses.length === 0
          ? <p className="px-6 py-12 text-center text-sm text-[#606774]">Geen kostenposten gevonden</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                  {["Datum", "Type", "Leverancier", "Voertuig", "Medewerker", "Excl. BTW", "BTW", "Incl. BTW", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101536]/05">
                {expenses.map((e) => {
                  const meta = EXPENSE_TYPE_LABEL[e.type];
                  const veh = e.vehicle as { name: string; license_plate: string } | null;
                  const emp = e.employee as { first_name: string | null; last_name: string | null } | null;
                  return (
                    <tr key={e.id} className="hover:bg-[#F8F9FB]">
                      <td className="px-4 py-3 text-[#606774]">{new Date(e.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#606774]">
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#101536]">{e.supplier ?? "–"}</td>
                      <td className="px-4 py-3 text-[#606774]">{veh ? `${veh.name}` : "–"}</td>
                      <td className="px-4 py-3 text-[#606774]">
                        {emp ? [emp.first_name, emp.last_name].filter(Boolean).join(" ") : "–"}
                      </td>
                      <td className="px-4 py-3 text-[#606774]">€{Number(e.amount_excl_vat).toFixed(2).replace(".", ",")}</td>
                      <td className="px-4 py-3 text-[#606774]">€{Number(e.vat_amount).toFixed(2).replace(".", ",")}</td>
                      <td className="px-4 py-3 font-semibold text-[#101536]">€{Number(e.amount_incl_vat).toFixed(2).replace(".", ",")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          e.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          e.status === "exported" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {e.status === "approved" ? "Goedgekeurd" : e.status === "exported" ? "Geëxporteerd" : "Concept"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#101536]/10 bg-[#F8F9FB] font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-[#101536]">Totaal ({expenses.length})</td>
                  <td className="px-4 py-3 text-[#606774]">€{expenses.reduce((s, e) => s + Number(e.amount_excl_vat), 0).toFixed(2).replace(".", ",")}</td>
                  <td className="px-4 py-3 text-[#606774]">€{expenses.reduce((s, e) => s + Number(e.vat_amount), 0).toFixed(2).replace(".", ",")}</td>
                  <td className="px-4 py-3 text-[#101536]">€{expenses.reduce((s, e) => s + Number(e.amount_incl_vat), 0).toFixed(2).replace(".", ",")}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )
        }
      </div>
    </div>
  );
}
