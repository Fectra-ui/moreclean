import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, CalendarDays, FileText, Receipt, MessageSquare, ArrowRight, Banknote } from "lucide-react";
import { clientDisplayName, clientGreeting } from "@/lib/utils/client";

export const metadata: Metadata = { title: "Mijn overzicht" };

export default async function KlantDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, client_type, contact_name, company_name")
    .eq("profile_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4D7EBA]/10">
            <Clock size={24} className="text-[#4D7EBA]" />
          </div>
          <p className="text-lg font-semibold text-[#101536]">Account wordt aangemaakt</p>
          <p className="mt-2 text-sm text-[#606774]">More Clean koppelt uw account. Dit duurt meestal minder dan een dag.</p>
        </div>
      </div>
    );
  }

  const [
    nextAppointmentRes,
    openQuotesRes,
    actionQuotesRes,
    openInvoicesRes,
    unreadRes,
  ] = await Promise.all([
    // Eerstvolgende afspraak
    supabase
      .from("appointments")
      .select("id, scheduled_date, scheduled_start, scheduled_end, address, city")
      .eq("client_id", client.id)
      .eq("status", "scheduled")
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .order("scheduled_date")
      .limit(1)
      .maybeSingle(),
    // Offertes open (wacht op klant)
    supabase
      .from("quotes")
      .select("id, quote_number, total, valid_until, workflow_state")
      .eq("client_id", client.id)
      .eq("workflow_state", "verzonden")
      .order("created_at", { ascending: false }),
    // Offertes die betaling verwachten
    supabase
      .from("quotes")
      .select("id, quote_number, total, workflow_state")
      .eq("client_id", client.id)
      .eq("workflow_state", "wacht_betaling")
      .order("created_at", { ascending: false }),
    // Openstaande facturen
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, due_date")
      .eq("client_id", client.id)
      .in("status", ["sent", "overdue"])
      .order("due_date"),
    // Ongelezen berichten
    supabase
      .from("messages")
      .select("id", { count: "exact" })
      .is("read_at", null)
      .in(
        "conversation_id",
        (await supabase.from("conversations").select("id").eq("client_id", client.id))
          .data?.map((c) => c.id) ?? []
      ),
  ]);

  const apt = nextAppointmentRes.data;
  const openQuotes = openQuotesRes.data ?? [];
  const paymentQuotes = actionQuotesRes.data ?? [];
  const openInvoices = openInvoicesRes.data ?? [];
  const unread = unreadRes.count ?? 0;
  const displayName = clientDisplayName(client);
  const greeting = clientGreeting(client);

  const now = new Date();
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const firstName = client.contact_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* WELKOM */}
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">{timeGreeting}, {firstName} 👋</h1>
        {client.client_type === "company" && client.company_name && (
          <p className="mt-0.5 text-sm text-[#606774]">{client.company_name}</p>
        )}
      </div>

      {/* ACTIEPUNTEN — offertes wachten op goedkeuring */}
      {openQuotes.map((q) => {
        const expired = q.valid_until ? new Date(q.valid_until) < now : false;
        return (
          <ActionCard
            key={q.id}
            icon={<FileText size={20} />}
            iconColor="text-amber-600 bg-amber-100"
            title="Offerte wacht op uw goedkeuring"
            description={`${q.quote_number} · €${Number(q.total).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}${q.valid_until ? ` · Geldig tot ${new Date(q.valid_until).toLocaleDateString("nl-NL")}` : ""}`}
            href={`/klant/offertes/${q.id}`}
            cta="Bekijken & akkoord geven"
            urgency={expired ? "verlopen" : "actie"}
          />
        );
      })}

      {/* ACTIEPUNTEN — betaling verwacht */}
      {paymentQuotes.map((q) => (
        <ActionCard
          key={q.id}
          icon={<Banknote size={20} />}
          iconColor="text-emerald-600 bg-emerald-100"
          title="Betaling verwacht"
          description={`${q.quote_number} · €${Number(q.total).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`}
          href={`/klant/offertes/${q.id}`}
          cta="Betaalgegevens bekijken"
          urgency="betaling"
        />
      ))}

      {/* ACTIEPUNTEN — openstaande facturen */}
      {openInvoices.map((inv) => {
        const overdue = inv.status === "overdue";
        return (
          <ActionCard
            key={inv.id}
            icon={<Receipt size={20} />}
            iconColor={overdue ? "text-red-600 bg-red-100" : "text-violet-600 bg-violet-100"}
            title={overdue ? "Factuur achterstallig" : "Factuur openstaand"}
            description={`${inv.invoice_number} · €${Number(inv.total).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}${inv.due_date ? ` · Betaald voor ${new Date(inv.due_date).toLocaleDateString("nl-NL")}` : ""}`}
            href="/klant/facturen"
            cta="Factuur bekijken"
            urgency={overdue ? "verlopen" : "betaling"}
          />
        );
      })}

      {/* VOLGENDE AFSPRAAK */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#606774]">Volgende afspraak</p>
        {apt ? (
          <Link
            href={`/klant/afspraken`}
            className="block rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-[#4D7EBA]/10 text-[#4D7EBA]">
                <span className="text-xs font-bold uppercase leading-none">
                  {new Date(apt.scheduled_date).toLocaleDateString("nl-NL", { month: "short" })}
                </span>
                <span className="text-xl font-bold leading-tight">
                  {new Date(apt.scheduled_date).getDate()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#101536]">
                  {new Date(apt.scheduled_date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-sm text-[#606774]">
                  {apt.scheduled_start?.slice(0, 5)} – {apt.scheduled_end?.slice(0, 5)}
                  {apt.address ? ` · ${apt.address}, ${apt.city}` : ""}
                </p>
              </div>
              <ArrowRight size={16} className="mt-1 flex-shrink-0 text-[#95AEC1]" />
            </div>
          </Link>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#101536]/10 bg-white/60 p-6 text-center">
            <p className="text-sm text-[#606774]">Geen geplande afspraken</p>
          </div>
        )}
      </section>

      {/* SNELLE LINKS */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#606774]">Mijn overzicht</p>
        <div className="grid grid-cols-2 gap-3">
          <NavCard href="/klant/offertes" icon={<FileText size={18} />} label="Offertes" badge={openQuotes.length + paymentQuotes.length} />
          <NavCard href="/klant/facturen" icon={<Receipt size={18} />} label="Facturen" badge={openInvoices.length} />
          <NavCard href="/klant/afspraken" icon={<CalendarDays size={18} />} label="Afspraken" />
          <NavCard href="/klant/berichten" icon={<MessageSquare size={18} />} label="Berichten" badge={unread} />
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  icon, iconColor, title, description, href, cta, urgency,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  urgency: "actie" | "betaling" | "verlopen";
}) {
  const border = urgency === "verlopen"
    ? "border-red-200 bg-red-50"
    : urgency === "betaling"
    ? "border-emerald-200 bg-emerald-50"
    : "border-amber-200 bg-amber-50";

  return (
    <div className={`rounded-[24px] border p-5 ${border}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#101536]">{title}</p>
          <p className="mt-0.5 text-sm text-[#606774] truncate">{description}</p>
          <Link
            href={href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#101536] shadow-sm transition hover:shadow-md"
          >
            {cta} <ArrowRight size={14} />
          </Link>
        </div>
        {urgency === "verlopen" && <AlertCircle size={16} className="flex-shrink-0 text-red-500 mt-1" />}
        {urgency === "actie" && <Clock size={16} className="flex-shrink-0 text-amber-500 mt-1" />}
        {urgency === "betaling" && <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-500 mt-1" />}
      </div>
    </div>
  );
}

function NavCard({ href, icon, label, badge = 0 }: { href: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 rounded-[20px] border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {badge > 0 && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <span className="text-[#4D7EBA]">{icon}</span>
      <span className="text-sm font-semibold text-[#101536]">{label}</span>
      <ArrowRight size={14} className="ml-auto text-[#95AEC1] transition group-hover:translate-x-0.5" />
    </Link>
  );
}
