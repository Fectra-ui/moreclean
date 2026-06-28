import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, FileText, Receipt, MessageSquare, PlusCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Mijn Dashboard" };

export default async function KlantDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get client record linked to this user
  const { data: client } = await supabase
    .from("clients")
    .select("id, contact_name, company_name")
    .eq("profile_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#101536]">Account wordt ingesteld</p>
          <p className="mt-2 text-sm text-[#606774]">Uw account wordt gekoppeld door More Clean. Dit duurt even.</p>
        </div>
      </div>
    );
  }

  // Parallel queries for dashboard data
  const [
    nextAppointment,
    openQuotes,
    openInvoices,
    maintenanceSchedule,
    unreadMessages,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_date, scheduled_start, scheduled_end, address, city, status")
      .eq("client_id", client.id)
      .eq("status", "scheduled")
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .order("scheduled_date")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("quotes")
      .select("id", { count: "exact" })
      .eq("client_id", client.id)
      .eq("status", "sent"),
    supabase
      .from("invoices")
      .select("id, total, status", { count: "exact" })
      .eq("client_id", client.id)
      .in("status", ["sent", "overdue"]),
    supabase
      .from("maintenance_schedules")
      .select("*, services (name)")
      .eq("client_id", client.id)
      .eq("active", true),
    supabase
      .from("messages")
      .select("id", { count: "exact" })
      .is("read_at", null)
      .in(
        "conversation_id",
        (
          await supabase
            .from("conversations")
            .select("id")
            .eq("client_id", client.id)
        ).data?.map((c) => c.id) ?? []
      ),
  ]);

  const apt = nextAppointment.data;
  const openInvoiceTotal = openInvoices.data?.reduce((s, i) => s + i.total, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* NEXT APPOINTMENT — prominent */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#4D7EBA] to-[#667FB0] p-8 text-white shadow-[0_20px_60px_rgba(77,126,186,.30)]">
        <p className="text-sm font-medium text-white/70">Volgende afspraak</p>
        {apt ? (
          <>
            <p className="mt-2 text-4xl font-bold">
              {new Date(apt.scheduled_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
            </p>
            <p className="mt-1 text-xl font-semibold text-white/90">
              {apt.scheduled_start.slice(0, 5)} – {apt.scheduled_end.slice(0, 5)}
            </p>
            {apt.address && (
              <p className="mt-3 text-sm text-white/70">{apt.address}, {apt.city}</p>
            )}
            <div className="mt-6 flex gap-3">
              <Link
                href={`/klant/afspraken/${apt.id}`}
                className="rounded-2xl bg-white/20 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/30"
              >
                Details bekijken
              </Link>
              <Link
                href="/klant/afspraken/nieuw"
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-[#4D7EBA] transition hover:bg-white/90"
              >
                <PlusCircle size={16} />
                Nieuwe afspraak
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-2xl font-semibold text-white/80">Geen afspraken gepland</p>
            <Link
              href="/klant/afspraken/nieuw"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-[#4D7EBA] transition hover:bg-white/90"
            >
              <PlusCircle size={16} />
              Afspraak plannen
            </Link>
          </>
        )}
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/klant/afspraken"
          icon={<Calendar size={22} />}
          label="Afspraken"
          sub={maintenanceSchedule.data?.[0]
            ? `Iedere ${maintenanceSchedule.data[0].frequency_weeks} weken`
            : "Bekijk planning"
          }
          accent="text-[#4D7EBA]"
          bg="bg-[#4D7EBA]/08"
        />
        <QuickAction
          href="/klant/offertes"
          icon={<FileText size={22} />}
          label="Offertes"
          sub={openQuotes.count ? `${openQuotes.count} wacht op goedkeuring` : "Geen open offertes"}
          accent="text-amber-600"
          bg="bg-amber-50"
          badge={openQuotes.count ?? 0}
        />
        <QuickAction
          href="/klant/facturen"
          icon={<Receipt size={22} />}
          label="Facturen"
          sub={openInvoiceTotal > 0
            ? `€${openInvoiceTotal.toLocaleString("nl-NL")} openstaand`
            : "Alles betaald"
          }
          accent="text-emerald-600"
          bg="bg-emerald-50"
          badge={openInvoices.count ?? 0}
        />
        <QuickAction
          href="/klant/berichten"
          icon={<MessageSquare size={22} />}
          label="Berichten"
          sub="Stuur ons een bericht"
          accent="text-violet-600"
          bg="bg-violet-50"
          badge={unreadMessages.count ?? 0}
        />
      </div>
    </div>
  );
}

function QuickAction({
  href, icon, label, sub, accent, bg, badge = 0,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  accent: string;
  bg: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-[22px] border border-white/60 bg-white/75 p-5 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(16,21,54,.10)]"
    >
      {badge > 0 && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      <div className={`mb-4 w-fit rounded-2xl p-3 ${bg} ${accent}`}>
        {icon}
      </div>
      <p className="font-semibold text-[#101536]">{label}</p>
      <p className="mt-1 text-sm text-[#606774]">{sub}</p>
    </Link>
  );
}
