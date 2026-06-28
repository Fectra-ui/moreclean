import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBusinessHealth, getClientProfitability } from "@/lib/services/accounting/expenses";
import Link from "next/link";

export const metadata: Metadata = { title: "Rapportages" };

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export default async function RapportagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") redirect("/klant");

  const currentYear = new Date().getFullYear();

  const [health, profitability, appointmentStats] = await Promise.all([
    getBusinessHealth(6),
    getClientProfitability(currentYear),
    supabase
      .from("appointments")
      .select("status, scheduled_date")
      .eq("company_id", COMPANY_ID)
      .gte("scheduled_date", currentYear + "-01-01"),
  ]);

  const totalApts = appointmentStats.data?.length ?? 0;
  const completedApts = appointmentStats.data?.filter((a) => a.status === "completed").length ?? 0;
  const completionRate = totalApts > 0 ? Math.round((completedApts / totalApts) * 100) : 0;

  const totalRevenue = health.reduce((s, m) => s + Number(m.total_costs), 0);
  const top5 = profitability.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Rapportages</h1>
          <p className="mt-1 text-sm text-[#606774]">Overzicht {currentYear}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/administratie/export"
            className="rounded-2xl border border-[#101536]/10 bg-white px-4 py-2 text-sm font-medium text-[#606774] shadow-sm transition hover:text-[#4D7EBA]">
            Kwartaalexport
          </Link>
          <Link href="/admin/kosten"
            className="rounded-2xl border border-[#101536]/10 bg-white px-4 py-2 text-sm font-medium text-[#606774] shadow-sm transition hover:text-[#4D7EBA]">
            Kostenrapport
          </Link>
        </div>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Opdrachten dit jaar", value: totalApts.toString(), sub: `${completedApts} afgerond` },
          { label: "Voltooiingsgraad", value: `${completionRate}%`, sub: "Afgerond vs. gepland" },
          { label: "Actieve klanten", value: (profitability.length).toString(), sub: `met omzet ${currentYear}` },
          { label: "Maanden geanalyseerd", value: health.length.toString(), sub: "Laatste 6 maanden" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#101536]">{s.value}</p>
            <p className="mt-1 text-xs text-[#606774]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* MAANDELIJKSE KOSTEN */}
      {health.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#101536]">Kostenontwikkeling — laatste 6 maanden</h2>
          <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                  {["Maand", "Totale kosten", "Brandstof", "Onderhoud", "Materiaal", "Reiskosten"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101536]/05">
                {[...health].reverse().map((m) => (
                  <tr key={m.month} className="hover:bg-[#F8F9FB]">
                    <td className="px-5 py-3 font-medium text-[#101536]">
                      {new Date(m.month + "-01").toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#101536]">€{Number(m.total_costs).toFixed(0)}</td>
                    <td className="px-5 py-3 text-[#606774]">€{Number(m.fuel_costs).toFixed(0)}</td>
                    <td className="px-5 py-3 text-[#606774]">€{Number(m.maintenance_costs).toFixed(0)}</td>
                    <td className="px-5 py-3 text-[#606774]">€{Number(m.material_costs).toFixed(0)}</td>
                    <td className="px-5 py-3 text-[#606774]">€{Number(m.travel_costs).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TOP KLANTEN */}
      {top5.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#101536]">Top klanten op omzet — {currentYear}</h2>
          <div className="space-y-3">
            {top5.map((c, i) => {
              const margin = c.revenue > 0 ? ((c.gross_profit / c.revenue) * 100) : 0;
              return (
                <div key={c.client_id} className="flex items-center gap-4 rounded-2xl border border-[#101536]/08 bg-white p-4 shadow-sm">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4D7EBA]/10 text-sm font-bold text-[#4D7EBA]">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#101536] truncate">{c.company_name || c.contact_name}</p>
                    <p className="text-xs text-[#606774]">{c.appointment_count} afspraken</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#101536]">€{Number(c.revenue).toLocaleString("nl-NL", { minimumFractionDigits: 0 })}</p>
                    <p className={`text-xs font-medium ${margin >= 40 ? "text-emerald-600" : "text-amber-600"}`}>{margin.toFixed(0)}% marge</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* QUICK LINKS */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#101536]">Exporteer rapportages</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Kostenregistratie CSV", href: `/api/expenses/export?year=${currentYear}`, sub: `Alle kosten ${currentYear}` },
            { label: "Kwartaalexport Q1", href: `/api/expenses/export?year=${currentYear}&quarter=1`, sub: "Facturen + bonnetjes Q1" },
            { label: "Kwartaalexport Q2", href: `/api/expenses/export?year=${currentYear}&quarter=2`, sub: "Facturen + bonnetjes Q2" },
          ].map((link) => (
            <Link key={link.label} href={link.href} target="_blank"
              className="rounded-2xl border border-[#101536]/08 bg-white p-4 shadow-sm transition hover:border-[#4D7EBA]/30 hover:text-[#4D7EBA]">
              <p className="text-sm font-semibold text-[#101536]">{link.label}</p>
              <p className="mt-1 text-xs text-[#606774]">{link.sub}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
