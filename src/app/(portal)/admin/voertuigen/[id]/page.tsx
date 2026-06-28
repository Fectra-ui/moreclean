import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getVehicleDetail, computeAlerts } from "@/lib/services/mileage/vehicles";
import Link from "next/link";

export const metadata: Metadata = { title: "Voertuig" };

const RATE = 0.23;
const CATEGORY_LABEL: Record<string, string> = {
  brandstof: "Brandstof", materiaal: "Materiaal", gereedschap: "Gereedschap",
  parkeren: "Parkeren", reiskosten: "Reiskosten", overig: "Overig",
};

export default async function VoertuigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") redirect("/klant");

  const { vehicle, logs, receipts } = await getVehicleDetail(id);
  if (!vehicle) notFound();

  const alerts = computeAlerts([vehicle]);
  const totalKm = logs.reduce((s, l) => s + Number((l as { km: number }).km ?? 0), 0);
  const totalCosts = receipts.reduce((s, r) => s + Number((r as { amount: number }).amount ?? 0), 0);
  const fuelCosts = receipts
    .filter((r) => (r as { category: string }).category === "brandstof")
    .reduce((s, r) => s + Number((r as { amount: number }).amount ?? 0), 0);
  const allowance = totalKm * RATE;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/voertuigen" className="text-sm text-[#606774] hover:text-[#4D7EBA]">← Voertuigen</Link>
      </div>

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#101536] to-[#1a2050] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[#95AEC1]">{vehicle.brand} {vehicle.model} · {vehicle.license_plate}</p>
            <h1 className="mt-1 text-2xl font-bold">{vehicle.name}</h1>
            <p className="mt-1 text-[#95AEC1] text-sm">{vehicle.fuel_type} · {vehicle.year ?? "–"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${vehicle.status === "active" ? "bg-emerald-500/20 text-emerald-300" : vehicle.status === "maintenance" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/60"}`}>
            {vehicle.status === "active" ? "Actief" : vehicle.status === "maintenance" ? "Onderhoud" : "Inactief"}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#95AEC1]">Kilometerstand</p>
            <p className="mt-1 text-xl font-bold">{vehicle.current_odometer.toLocaleString("nl-NL")} km</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#95AEC1]">APK</p>
            <p className="mt-1 text-xl font-bold">{vehicle.apk_expiry ? new Date(vehicle.apk_expiry).toLocaleDateString("nl-NL") : "–"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#95AEC1]">Volgend onderhoud</p>
            <p className="mt-1 text-xl font-bold">
              {vehicle.next_service_km
                ? `${(vehicle.next_service_km - vehicle.current_odometer).toLocaleString("nl-NL")} km`
                : vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString("nl-NL") : "–"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Meldingen */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-2xl border px-4 py-3 text-sm font-medium ${a.urgency === "critical" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {a.urgency === "critical" ? "🔴" : "🟡"} {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Statistieken */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Totaal km", value: `${totalKm.toLocaleString("nl-NL")} km`, color: "text-[#4D7EBA]" },
          { label: "Vergoeding", value: `€${allowance.toFixed(0)}`, color: "text-emerald-600" },
          { label: "Brandstof", value: `€${fuelCosts.toFixed(0)}`, color: "text-amber-600" },
          { label: "Totale kosten", value: `€${totalCosts.toFixed(0)}`, color: "text-[#101536]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#101536]/08 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{s.label}</p>
            <p className={`mt-2 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Kilometerlog */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#101536]/06 px-5 py-3">
          <h2 className="font-semibold text-[#101536]">Kilometerregistraties</h2>
        </div>
        {logs.length === 0
          ? <p className="px-5 py-8 text-center text-sm text-[#606774]">Geen ritten geregistreerd</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FB]">
                  {["Datum", "Medewerker", "Route", "Begin", "Eind", "KM", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101536]/05">
                {logs.map((log) => {
                  const l = log as { id: string; date: string; km: number; start_odometer: number; end_odometer: number; route: string | null; approved: boolean; employee: { first_name: string | null; last_name: string | null } | null };
                  const empName = [l.employee?.first_name, l.employee?.last_name].filter(Boolean).join(" ") || "–";
                  return (
                    <tr key={l.id} className="hover:bg-[#F8F9FB]">
                      <td className="px-4 py-3 text-[#606774]">{new Date(l.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</td>
                      <td className="px-4 py-3 font-medium text-[#101536]">{empName}</td>
                      <td className="px-4 py-3 text-[#606774] max-w-[200px] truncate" title={l.route ?? undefined}>{l.route ?? "–"}</td>
                      <td className="px-4 py-3 tabular-nums text-[#606774]">{l.start_odometer.toLocaleString("nl-NL")}</td>
                      <td className="px-4 py-3 tabular-nums text-[#606774]">{l.end_odometer.toLocaleString("nl-NL")}</td>
                      <td className="px-4 py-3 font-semibold text-[#4D7EBA]">{l.km} km</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${l.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {l.approved ? "Goedgekeurd" : "Openstaand"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>

      {/* Bonnetjes / kosten */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#101536]/06 px-5 py-3">
          <h2 className="font-semibold text-[#101536]">Kosten &amp; bonnetjes</h2>
        </div>
        {receipts.length === 0
          ? <p className="px-5 py-8 text-center text-sm text-[#606774]">Geen bonnetjes gekoppeld</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FB]">
                  {["Datum", "Leverancier", "Categorie", "Bedrag", "BTW"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101536]/05">
                {receipts.map((r) => {
                  const rec = r as { id: string; receipt_date: string; supplier: string | null; category: string; amount: number; vat_amount: number };
                  return (
                    <tr key={rec.id} className="hover:bg-[#F8F9FB]">
                      <td className="px-4 py-3 text-[#606774]">{new Date(rec.receipt_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</td>
                      <td className="px-4 py-3 text-[#101536]">{rec.supplier ?? "–"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#F3F5F7] px-2.5 py-0.5 text-xs font-semibold text-[#606774]">
                          {CATEGORY_LABEL[rec.category] ?? rec.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#101536]">€{Number(rec.amount).toFixed(2).replace(".", ",")}</td>
                      <td className="px-4 py-3 text-[#606774]">€{Number(rec.vat_amount).toFixed(2).replace(".", ",")}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#101536]/10 bg-[#F8F9FB] font-semibold">
                  <td colSpan={3} className="px-4 py-3 text-[#101536]">Totaal</td>
                  <td className="px-4 py-3 text-[#101536]">€{totalCosts.toFixed(2).replace(".", ",")}</td>
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
