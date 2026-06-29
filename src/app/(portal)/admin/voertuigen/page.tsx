import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { getVehicleStats, getAssignmentsForDate, computeAlerts } from "@/lib/services/mileage/vehicles";
import Link from "next/link";

export const metadata: Metadata = { title: "Voertuigen" };

const STATUS_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  active:      { label: "Actief",     color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  maintenance: { label: "Onderhoud",  color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" },
  inactive:    { label: "Inactief",   color: "bg-[#F3F5F7] text-[#606774]",    dot: "bg-[#95AEC1]" },
};

const URGENCY_COLOR: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  info:     "border-blue-200 bg-blue-50 text-blue-800",
};

export default async function VoertuigenPage() {
  const { profile } = await requireAdmin();

  const today = new Date().toISOString().split("T")[0];
  const [stats, assignments] = await Promise.all([
    getVehicleStats(),
    getAssignmentsForDate(today),
  ]);

  const alerts = computeAlerts(stats);

  const assignedVehicleIds = new Set(assignments.map((a) => a.vehicle_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#101536]">Voertuigen</h1>
        <Link
          href="/admin/planning"
          className="rounded-2xl border border-[#101536]/10 bg-white px-4 py-2 text-sm font-semibold text-[#606774] shadow-sm transition hover:border-[#4D7EBA]/30 hover:text-[#4D7EBA]"
        >
          Toewijzingen vandaag
        </Link>
      </div>

      {/* Meldingen */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${URGENCY_COLOR[alert.urgency]}`}>
              <span className="shrink-0">
                {alert.urgency === "critical" ? "🔴" : alert.urgency === "warning" ? "🟡" : "🔵"}
              </span>
              <span><strong>{alert.vehicleName}</strong> — {alert.message}</span>
              <Link href={`/admin/voertuigen/${stats.find(v => v.name === alert.vehicleName)?.vehicle_id ?? ""}`}
                className="ml-auto shrink-0 underline opacity-70 hover:opacity-100">
                Bekijk
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Voertuigkaarten */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((v) => {
          const s = STATUS_LABEL[v.status] ?? STATUS_LABEL.inactive;
          const assignment = assignments.find((a) => a.vehicle_id === v.vehicle_id);
          const emp = assignment?.employee as { first_name: string | null; last_name: string | null } | null | undefined;
          const driverName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(" ") : null;
          const kmToService = v.next_service_km != null ? v.next_service_km - v.current_odometer : null;

          return (
            <Link
              key={v.vehicle_id}
              href={`/admin/voertuigen/${v.vehicle_id}`}
              className="group rounded-3xl border border-[#101536]/08 bg-white p-5 shadow-sm transition hover:border-[#4D7EBA]/30 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <h2 className="font-bold text-[#101536]">{v.name}</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-[#606774]">{v.brand} {v.model} · {v.license_plate}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
              </div>

              {/* Vandaag */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#F3F5F7] px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-[#4D7EBA]">{Number(v.today_km)} km</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#606774]">Vandaag</p>
                </div>
                <div className="rounded-2xl bg-[#F3F5F7] px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-[#101536]">{Number(v.today_trips)}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#606774]">Opdrachten</p>
                </div>
              </div>

              {/* Kwartaal */}
              <div className="mt-3 flex items-center justify-between text-xs text-[#606774]">
                <span>Dit kwartaal: <strong className="text-[#101536]">{Number(v.quarter_km).toLocaleString("nl-NL")} km</strong></span>
                {v.quarter_costs > 0 && <span>Kosten: <strong className="text-[#101536]">€{Number(v.quarter_costs).toFixed(0)}</strong></span>}
              </div>

              {/* Chauffeur vandaag */}
              <div className="mt-3 border-t border-[#101536]/06 pt-3">
                {driverName
                  ? <p className="text-xs text-[#606774]">Vandaag: <strong className="text-[#101536]">{driverName}</strong></p>
                  : <p className="text-xs italic text-[#95AEC1]">Geen chauffeur toegewezen</p>
                }
              </div>

              {/* Waarschuwingen */}
              {kmToService != null && kmToService <= 1500 && (
                <div className={`mt-2 rounded-xl px-3 py-1.5 text-xs font-medium ${kmToService <= 500 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {kmToService <= 0
                    ? `Onderhoud overschreden met ${Math.abs(kmToService).toLocaleString("nl-NL")} km`
                    : `Onderhoud over ${kmToService.toLocaleString("nl-NL")} km`
                  }
                </div>
              )}
              {v.apk_expiry && (() => {
                const days = Math.ceil((new Date(v.apk_expiry).getTime() - Date.now()) / 86400000);
                if (days > 30) return null;
                return <div className={`mt-2 rounded-xl px-3 py-1.5 text-xs font-medium ${days <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  APK {days <= 0 ? "verlopen" : `over ${days} dag${days === 1 ? "" : "en"}`}
                </div>;
              })()}
            </Link>
          );
        })}
      </div>

      {/* Toewijzingsoverzicht */}
      {assignments.length > 0 && (
        <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-[#101536]/06 px-5 py-3">
            <h2 className="font-semibold text-[#101536]">Toewijzingen vandaag</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FB]">
                {["Medewerker", "Voertuig", "Kenteken"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101536]/05">
              {assignments.map((a) => {
                const emp = a.employee as { first_name: string | null; last_name: string | null } | null;
                const veh = a.vehicle as { name: string; license_plate: string } | null;
                return (
                  <tr key={a.id} className="hover:bg-[#F8F9FB]">
                    <td className="px-4 py-3 font-medium text-[#101536]">
                      {[emp?.first_name, emp?.last_name].filter(Boolean).join(" ") || "–"}
                    </td>
                    <td className="px-4 py-3 text-[#101536]">{veh?.name ?? "–"}</td>
                    <td className="px-4 py-3 text-[#606774]">{veh?.license_plate ?? "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
