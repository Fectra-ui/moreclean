import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { isSetupComplete } from "@/lib/services/setup";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatCard from "@/components/portal/StatCard";
import { getInvoiceStats } from "@/lib/services/invoices";
import { getAppointmentsByDate } from "@/lib/services/appointments";
import { getBuRevenue } from "@/lib/services/crm/businessUnits";
import { getExpenseStats } from "@/lib/services/accounting/expenses";
import { Calendar, Euro, FileText, Users, AlertTriangle, TrendingUp, MessageSquare, ClipboardList } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const setupDone = await isSetupComplete().catch(() => true);
  if (!setupDone) redirect("/admin/setup");

  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safe = (p: Promise<any>, fallback: any) => p.catch(() => fallback);

  const [
    invoiceStats,
    todayAppointments,
    openQuotesResult,
    waitingPlanningResult,
    unreadMessages,
    newClientsResult,
    buRevenue,
    expenseStats,
  ] = await Promise.all([
    safe(getInvoiceStats(COMPANY_ID), { totalOpen: 0, totalOverdue: 0, revenueThisMonth: 0, countOpen: 0, countOverdue: 0 }),
    safe(getAppointmentsByDate(COMPANY_ID, today), []),
    Promise.resolve(supabase.from("quotes").select("id", { count: "exact" }).eq("company_id", COMPANY_ID).eq("workflow_state", "verzonden")).catch(() => ({ count: 0 })),
    Promise.resolve(supabase.from("quotes").select("id", { count: "exact" }).eq("company_id", COMPANY_ID).eq("workflow_state", "betaald")).catch(() => ({ count: 0 })),
    Promise.resolve(supabase.from("messages").select("id", { count: "exact" }).is("read_at", null)).catch(() => ({ count: 0 })),
    Promise.resolve(supabase.from("clients").select("id", { count: "exact" }).eq("company_id", COMPANY_ID).gte("created_at", new Date().toISOString().slice(0, 7) + "-01")).catch(() => ({ count: 0 })),
    safe(getBuRevenue(currentYear, currentQuarter), []),
    safe(getExpenseStats(currentYear, currentQuarter), { total: 0, pendingApproval: 0, byType: { fuel: 0, maintenance: 0 } }),
  ]);

  const apts = todayAppointments as Array<{ status: string }>;
  const scheduledToday = apts.filter((a) => a.status === "scheduled").length;
  const inProgressToday = apts.filter((a) => a.status === "in_progress").length;
  const completedToday = apts.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-8">
      {/* STATS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Afspraken vandaag"
          value={todayAppointments.length}
          sub={`${completedToday} afgerond · ${inProgressToday} bezig`}
          icon={<Calendar size={20} />}
        />
        <StatCard
          label="Offertes verzonden"
          value={openQuotesResult.count ?? 0}
          sub="Wachten op klantakkoord"
          icon={<FileText size={20} />}
          accent="text-amber-500"
        />
        <StatCard
          label="Wacht op planning"
          value={waitingPlanningResult.count ?? 0}
          sub="Betaald — klaar om in te plannen"
          icon={<ClipboardList size={20} />}
          accent={(waitingPlanningResult.count ?? 0) > 0 ? "text-orange-500" : "text-[#95AEC1]"}
          highlight={(waitingPlanningResult.count ?? 0) > 0}
        />
        <StatCard
          label="Omzet deze maand"
          value={`€${invoiceStats.revenueThisMonth.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}`}
          sub={`€${invoiceStats.totalOpen.toLocaleString("nl-NL")} openstaand`}
          icon={<Euro size={20} />}
          accent="text-emerald-500"
          highlight
        />
        <StatCard
          label="Vervallen facturen"
          value={invoiceStats.countOverdue}
          sub={`€${invoiceStats.totalOverdue.toLocaleString("nl-NL")} te ontvangen`}
          icon={<AlertTriangle size={20} />}
          accent="text-red-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Nieuwe klanten"
          value={newClientsResult.count ?? 0}
          sub="Deze maand"
          icon={<Users size={20} />}
        />
        <StatCard
          label="Ongelezen berichten"
          value={unreadMessages.count ?? 0}
          icon={<MessageSquare size={20} />}
          accent="text-violet-500"
        />
        <StatCard
          label="Bezettingsgraad"
          value={scheduledToday > 0 ? `${Math.round((completedToday / todayAppointments.length) * 100)}%` : "—"}
          sub="Vandaag"
          icon={<TrendingUp size={20} />}
          accent="text-[#4D7EBA]"
        />
      </div>

      {/* WACHT OP PLANNING */}
      {(waitingPlanningResult.count ?? 0) > 0 && <WachtOpPlanningSection companyId={COMPANY_ID} />}

      {/* BUSINESS UNIT OMZET */}
      {buRevenue.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#101536]">
            Omzet Q{currentQuarter} {currentYear} — per bedrijfsunit
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(buRevenue as import("@/lib/services/crm/businessUnits").BuRevenue[]).map((bu) => {
              const margin = bu.revenue > 0 ? ((bu.revenue - bu.costs) / bu.revenue) * 100 : 0;
              return (
                <div key={bu.business_unit_id} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{bu.icon}</span>
                    <span className="font-semibold text-[#101536]">{bu.business_unit_name}</span>
                    <span className="ml-auto text-xs font-semibold text-[#606774]">{bu.appointment_count} afsp.</span>
                  </div>
                  <p className="text-2xl font-bold text-[#101536]">
                    €{Number(bu.revenue).toLocaleString("nl-NL", { minimumFractionDigits: 0 })}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#606774]">
                    <span>Betaald: <strong className="text-emerald-600">€{Number(bu.revenue_paid).toFixed(0)}</strong></span>
                    <span>Kosten: <strong className="text-amber-600">€{Number(bu.costs).toFixed(0)}</strong></span>
                    <span>Marge: <strong className={margin >= 40 ? "text-emerald-600" : "text-amber-600"}>{margin.toFixed(0)}%</strong></span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-[#F3F5F7] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (Number(bu.revenue_paid) / Math.max(Number(bu.revenue), 1)) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-[#606774]">Betaald van totaal</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* BEDRIJFSGEZONDHEID */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#101536]">Bedrijfsgezondheid — Q{currentQuarter} {currentYear}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Omzet (gefactureerd)",
              value: `€${invoiceStats.revenueThisMonth.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}`,
              sub: "incl. openstaand",
              color: "text-emerald-600",
            },
            {
              label: "Totale kosten",
              value: `€${Number(expenseStats.total).toFixed(0)}`,
              sub: `${expenseStats.pendingApproval} goed te keuren`,
              color: "text-red-500",
            },
            {
              label: "Netto resultaat",
              value: `€${(invoiceStats.revenueThisMonth - Number(expenseStats.total)).toFixed(0)}`,
              sub: "omzet minus kosten",
              color: invoiceStats.revenueThisMonth > Number(expenseStats.total) ? "text-emerald-600" : "text-red-500",
            },
            {
              label: "Brandstof + onderhoud",
              value: `€${(Number(expenseStats.byType.fuel) + Number(expenseStats.byType.maintenance)).toFixed(0)}`,
              sub: "voertuigkosten",
              color: "text-amber-600",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{s.label}</p>
              <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
              {s.sub && <p className="mt-1 text-xs text-[#606774]">{s.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* TODAY'S APPOINTMENTS */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#101536]">Vandaag — {scheduledToday + inProgressToday} gepland</h2>
          <a href="/admin/planning" className="text-sm font-medium text-[#4D7EBA] hover:underline">
            Volledige planning →
          </a>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl shadow-[0_8px_32px_rgba(16,21,54,.06)]">
            <p className="text-[#606774]">Geen afspraken voor vandaag.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(todayAppointments as import("@/types/database").AppointmentWithDetails[]).map((apt) => {
              const client = apt.clients as { contact_name: string; company_name: string | null; phone: string | null };
              const statusColor = {
                scheduled: "bg-blue-100 text-blue-700",
                in_progress: "bg-amber-100 text-amber-700",
                completed: "bg-emerald-100 text-emerald-700",
                cancelled: "bg-red-100 text-red-700",
                no_show: "bg-gray-100 text-gray-700",
              }[apt.status] ?? "bg-gray-100 text-gray-700";

              const statusLabel = {
                scheduled: "Gepland",
                in_progress: "Bezig",
                completed: "Afgerond",
                cancelled: "Geannuleerd",
                no_show: "Niet verschenen",
              }[apt.status] ?? apt.status;

              return (
                <a
                  key={apt.id}
                  href={`/admin/afspraken/${apt.id}`}
                  className="flex items-center justify-between rounded-[20px] border border-white/60 bg-white/75 p-5 shadow-[0_4px_16px_rgba(16,21,54,.05)] backdrop-blur-xl transition hover:shadow-[0_8px_24px_rgba(16,21,54,.08)] hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-5">
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#101536]">{apt.scheduled_start.slice(0, 5)}</p>
                      <p className="text-xs text-[#606774]">{apt.scheduled_end.slice(0, 5)}</p>
                    </div>
                    <div className="h-10 w-px bg-[#101536]/08" />
                    <div>
                      <p className="font-semibold text-[#101536]">
                        {client.company_name || client.contact_name}
                      </p>
                      <p className="text-sm text-[#606774]">{apt.address}, {apt.city}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                    {statusLabel}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

async function WachtOpPlanningSection({ companyId }: { companyId: string }) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, quote_number, total, payment_received_at, clients(contact_name, company_name)")
    .eq("company_id", companyId)
    .eq("workflow_state", "betaald")
    .order("payment_received_at", { ascending: true })
    .limit(5);

  if (!data?.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#101536]">
          Wacht op planning
          <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-0.5 text-sm font-bold text-orange-600">{data.length}</span>
        </h2>
        <a href="/admin/offertes" className="text-sm font-medium text-[#4D7EBA] hover:underline">
          Alle offertes →
        </a>
      </div>
      <div className="space-y-2">
        {data.map((q) => {
          const client = q.clients as unknown as { contact_name: string; company_name: string | null } | null;
          const daysSince = q.payment_received_at
            ? Math.floor((Date.now() - new Date(q.payment_received_at).getTime()) / 86_400_000)
            : null;
          return (
            <a
              key={q.id}
              href={`/admin/offertes/${q.id}`}
              className="flex items-center justify-between rounded-[20px] border border-orange-100 bg-orange-50/60 px-5 py-4 transition hover:bg-orange-50 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <ClipboardList size={18} className="flex-shrink-0 text-orange-500" />
                <div>
                  <p className="font-semibold text-[#101536]">
                    {client?.company_name || client?.contact_name || "Klant"}{" "}
                    <span className="font-normal text-[#606774]">— {q.quote_number}</span>
                  </p>
                  {daysSince !== null && (
                    <p className="text-xs text-[#606774]">
                      Betaald {daysSince === 0 ? "vandaag" : `${daysSince} dag${daysSince !== 1 ? "en" : ""} geleden`}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-[#101536]">
                €{Number(q.total).toLocaleString("nl-NL", { minimumFractionDigits: 0 })}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
