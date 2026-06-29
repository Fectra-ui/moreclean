import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { getMileageLogs, getMileageStats } from "@/lib/services/mileage/mileage";
import Link from "next/link";
import MileageApproveButton from "./MileageApproveButton";

export const metadata: Metadata = { title: "Kilometeroverzicht" };

const RATE_PER_KM = 0.23;

export default async function KilometersPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; quarter?: string; employee?: string }>;
}) {
  const { profile } = await requireAdmin();

  const params = await searchParams;
  const year = params.year ? Number(params.year) : new Date().getFullYear();
  const month = params.month ? Number(params.month) : undefined;
  const quarter = params.quarter ? Number(params.quarter) : undefined;
  const employeeId = params.employee;

  const [logs, stats] = await Promise.all([
    getMileageLogs({ year, month, quarter, employeeId }),
    getMileageStats(year, quarter),
  ]);

  const currentYear = new Date().getFullYear();
  const MONTH_NAMES = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#101536]">Kilometeroverzicht</h1>
        <a
          href={`/api/mileage/export?year=${year}${quarter ? `&quarter=${quarter}` : ""}${month ? `&month=${month}` : ""}`}
          className="flex items-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-4 py-2 text-sm font-semibold text-[#606774] shadow-sm transition hover:border-[#4D7EBA]/30 hover:text-[#4D7EBA]"
        >
          CSV exporteren
        </a>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Totaal km", value: `${stats.totalKm.toFixed(0)} km`, color: "text-[#4D7EBA]" },
          { label: "Reistijd", value: `${Math.floor(stats.totalTravelMin / 60)}u ${stats.totalTravelMin % 60}min`, color: "text-[#101536]" },
          { label: "Vergoeding (€0,23/km)", value: `€${stats.totalAllowance.toFixed(2).replace(".", ",")}`, color: "text-emerald-600" },
          { label: "Openstaand goedkeuring", value: stats.pendingApproval.toString(), color: stats.pendingApproval > 0 ? "text-amber-600" : "text-[#606774]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[currentYear, currentYear - 1].map((y) => (
          <Link key={y} href={`?year=${y}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${year === y && !month && !quarter ? "bg-[#4D7EBA] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}>
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
        <span className="mx-1 text-[#101536]/20">|</span>
        {MONTH_NAMES.map((m, i) => (
          <Link key={i} href={`?year=${year}&month=${i + 1}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${month === i + 1 ? "bg-[#101536] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}>
            {m}
          </Link>
        ))}
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
        {logs.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[#606774]">Geen kilometerregistraties gevonden</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                {["Datum", "Medewerker", "Voertuig", "Klant / Route", "Begin km", "Eind km", "KM", "Vergoeding", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101536]/05">
              {logs.map((log) => {
                const emp = log.employee as { first_name: string | null; last_name: string | null } | null;
                const empName = [emp?.first_name, emp?.last_name].filter(Boolean).join(" ") || "–";
                const veh = log.vehicle as { name: string; license_plate: string } | null;
                const appt = log.appointment as { scheduled_date: string; clients: { contact_name: string; company_name: string | null } | null } | null;
                const clientName = appt?.clients?.company_name ?? appt?.clients?.contact_name ?? log.route ?? "–";
                const allowance = Number(log.km) * RATE_PER_KM;
                return (
                  <tr key={log.id} className="hover:bg-[#F8F9FB]">
                    <td className="px-4 py-3 text-[#606774]">
                      {new Date(log.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#101536]">{empName}</td>
                    <td className="px-4 py-3 text-[#606774]">
                      <span className="block">{veh?.name ?? "–"}</span>
                      {veh && <span className="text-xs text-[#606774]/60">{veh.license_plate}</span>}
                    </td>
                    <td className="px-4 py-3 text-[#101536] max-w-[160px] truncate" title={log.route ?? undefined}>{clientName}</td>
                    <td className="px-4 py-3 tabular-nums text-[#606774]">{log.start_odometer.toLocaleString("nl-NL")}</td>
                    <td className="px-4 py-3 tabular-nums text-[#606774]">{log.end_odometer.toLocaleString("nl-NL")}</td>
                    <td className="px-4 py-3 font-semibold text-[#4D7EBA]">{Number(log.km)} km</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">€{allowance.toFixed(2).replace(".", ",")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${log.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {log.approved ? "Goedgekeurd" : "Openstaand"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!log.approved && <MileageApproveButton id={log.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#101536]/10 bg-[#F8F9FB] font-semibold">
                <td colSpan={6} className="px-4 py-3 text-[#101536]">Totaal ({logs.length} ritten)</td>
                <td className="px-4 py-3 text-[#4D7EBA]">{logs.reduce((s, l) => s + Number(l.km), 0)} km</td>
                <td className="px-4 py-3 text-emerald-700">
                  €{(logs.reduce((s, l) => s + Number(l.km), 0) * RATE_PER_KM).toFixed(2).replace(".", ",")}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
