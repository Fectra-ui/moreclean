"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Info, Calendar, FileText, Receipt, Image,
  RefreshCw, Activity, MessageSquare, Check, Clock, XCircle,
} from "lucide-react";

const TABS = [
  { id: "overzicht", label: "Overzicht", icon: Info },
  { id: "afspraken", label: "Afspraken", icon: Calendar },
  { id: "offertes", label: "Offertes", icon: FileText },
  { id: "facturen", label: "Facturen", icon: Receipt },
  { id: "onderhoud", label: "Onderhoudsplan", icon: RefreshCw },
  { id: "fotos", label: "Foto's", icon: Image },
  { id: "activiteiten", label: "Activiteiten", icon: Activity },
  { id: "berichten", label: "Berichten", icon: MessageSquare },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ClientDetailTabs({ client }: { client: Record<string, unknown> }) {
  const [activeTab, setActiveTab] = useState<TabId>("overzicht");

  return (
    <div>
      {/* TAB BAR */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#101536]/06 bg-white/70 p-1.5 backdrop-blur-xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-[#4D7EBA] text-white shadow-sm"
                : "text-[#606774] hover:bg-[#F3F5F7] hover:text-[#101536]"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
        {activeTab === "overzicht" && <TabOverzicht client={client} />}
        {activeTab === "afspraken" && <TabAfspraken appointments={(client.appointments as unknown[]) ?? []} clientId={client.id as string} />}
        {activeTab === "offertes" && <TabOffertes quotes={(client.quotes as unknown[]) ?? []} clientId={client.id as string} />}
        {activeTab === "facturen" && <TabFacturen invoices={(client.invoices as unknown[]) ?? []} />}
        {activeTab === "onderhoud" && <TabOnderhoud schedules={(client.maintenance_schedules as unknown[]) ?? []} clientId={client.id as string} />}
        {activeTab === "fotos" && <TabFotos clientId={client.id as string} />}
        {activeTab === "activiteiten" && <TabActiviteiten clientId={client.id as string} />}
        {activeTab === "berichten" && <TabBerichten conversations={(client.conversations as unknown[]) ?? []} clientId={client.id as string} />}
      </div>
    </div>
  );
}

// ── OVERZICHT ─────────────────────────────────────────────

function TabOverzicht({ client }: { client: Record<string, unknown> }) {
  const fields = [
    { label: "Contactpersoon", value: client.contact_name as string },
    { label: "Bedrijfsnaam", value: client.company_name as string | null },
    { label: "E-mailadres", value: client.email as string | null },
    { label: "Telefoon", value: client.phone as string | null },
    { label: "Adres", value: [client.address, client.postal_code, client.city].filter(Boolean).join(", ") || null },
    { label: "Land", value: client.country as string },
    { label: "BTW-nummer", value: client.vat_number as string | null },
    { label: "Betalingstermijn", value: client.payment_terms ? `${client.payment_terms} dagen` : null },
    { label: "Bron", value: client.source as string | null },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#606774]">Contactgegevens</h3>
        <dl className="space-y-3">
          {fields.map(({ label, value }) =>
            value ? (
              <div key={label} className="flex gap-3">
                <dt className="w-36 flex-shrink-0 text-sm text-[#606774]">{label}</dt>
                <dd className="text-sm font-medium text-[#101536]">{value}</dd>
              </div>
            ) : null
          )}
        </dl>
      </div>

      {(!!client.notes || !!client.internal_notes) && (
        <div>
          {!!client.notes && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#606774]">Notities</h3>
              <p className="rounded-2xl bg-[#F3F5F7] p-4 text-sm text-[#606774]">{String(client.notes)}</p>
            </div>
          )}
          {!!client.internal_notes && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#606774]">Interne notities</h3>
              <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-100">{String(client.internal_notes)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AFSPRAKEN ─────────────────────────────────────────────

function TabAfspraken({ appointments, clientId }: { appointments: unknown[]; clientId: string }) {
  const statusLabel: Record<string, string> = {
    scheduled: "Gepland", in_progress: "Bezig", completed: "Afgerond",
    cancelled: "Geannuleerd", no_show: "Niet verschenen",
  };
  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-600",
    no_show: "bg-gray-100 text-gray-600",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#101536]">{appointments.length} afspraken</h3>
        <Link href={`/admin/afspraken/nieuw?client=${clientId}`} className="rounded-xl bg-[#4D7EBA] px-4 py-2 text-xs font-semibold text-white hover:bg-[#667FB0]">
          + Nieuwe afspraak
        </Link>
      </div>

      {appointments.length === 0 ? (
        <EmptyState message="Nog geen afspraken." />
      ) : (
        <div className="space-y-2">
          {(appointments as Record<string, unknown>[]).sort((a, b) =>
            String(b.scheduled_date).localeCompare(String(a.scheduled_date))
          ).map((apt) => (
            <Link
              key={apt.id as string}
              href={`/admin/afspraken/${apt.id}`}
              className="flex items-center justify-between rounded-2xl border border-[#101536]/06 bg-[#F3F5F7]/60 p-4 transition hover:bg-[#F3F5F7]"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-[#101536]">
                    {new Date(String(apt.scheduled_date)).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs text-[#606774]">{String(apt.scheduled_start).slice(0, 5)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#606774]">{String(apt.address || "")}, {String(apt.city || "")}</p>
                  {(apt.appointment_services as unknown[])?.length > 0 && (
                    <p className="text-xs text-[#606774]">
                      {(apt.appointment_services as Record<string, unknown>[]).map((s) => s.description || "").join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[String(apt.status)] ?? ""}`}>
                {statusLabel[String(apt.status)] ?? String(apt.status)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── OFFERTES ─────────────────────────────────────────────

function TabOffertes({ quotes, clientId }: { quotes: unknown[]; clientId: string }) {
  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-600",
    expired: "bg-gray-100 text-gray-500",
  };
  const statusLabel: Record<string, string> = {
    draft: "Concept", sent: "Verzonden", accepted: "Geaccepteerd",
    rejected: "Afgewezen", expired: "Verlopen",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#101536]">{quotes.length} offertes</h3>
        <Link href={`/admin/offertes/nieuw?client=${clientId}`} className="rounded-xl bg-[#4D7EBA] px-4 py-2 text-xs font-semibold text-white hover:bg-[#667FB0]">
          + Nieuwe offerte
        </Link>
      </div>
      {quotes.length === 0 ? (
        <EmptyState message="Nog geen offertes." />
      ) : (
        <div className="space-y-2">
          {(quotes as Record<string, unknown>[]).map((q) => (
            <Link
              key={q.id as string}
              href={`/admin/offertes/${q.id}`}
              className="flex items-center justify-between rounded-2xl border border-[#101536]/06 bg-[#F3F5F7]/60 p-4 transition hover:bg-[#F3F5F7]"
            >
              <div>
                <p className="font-semibold text-[#101536]">{q.quote_number as string}</p>
                <p className="text-xs text-[#606774]">
                  {new Date(String(q.created_at)).toLocaleDateString("nl-NL")}
                  {!!q.valid_until && ` · geldig tot ${new Date(String(q.valid_until)).toLocaleDateString("nl-NL")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-[#101536]">€{Number(q.total).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[String(q.status)] ?? ""}`}>
                  {statusLabel[String(q.status)] ?? String(q.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FACTUREN ─────────────────────────────────────────────

function TabFacturen({ invoices }: { invoices: unknown[] }) {
  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
  };
  const statusLabel: Record<string, string> = {
    draft: "Concept", sent: "Verzonden", paid: "Betaald",
    overdue: "Vervallen", cancelled: "Geannuleerd",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#101536]">{invoices.length} facturen</h3>
      </div>
      {invoices.length === 0 ? (
        <EmptyState message="Nog geen facturen." />
      ) : (
        <div className="space-y-2">
          {(invoices as Record<string, unknown>[]).map((inv) => (
            <Link
              key={inv.id as string}
              href={`/admin/facturen/${inv.id}`}
              className="flex items-center justify-between rounded-2xl border border-[#101536]/06 bg-[#F3F5F7]/60 p-4 transition hover:bg-[#F3F5F7]"
            >
              <div>
                <p className="font-semibold text-[#101536]">{inv.invoice_number as string}</p>
                <p className="text-xs text-[#606774]">
                  {new Date(String(inv.issue_date)).toLocaleDateString("nl-NL")} · vervalt {new Date(String(inv.due_date)).toLocaleDateString("nl-NL")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-[#101536]">€{Number(inv.total).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[String(inv.status)] ?? ""}`}>
                  {statusLabel[String(inv.status)] ?? String(inv.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ONDERHOUD ─────────────────────────────────────────────

function TabOnderhoud({ schedules, clientId }: { schedules: unknown[]; clientId: string }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#101536]">Onderhoudsschema's</h3>
        <Link href={`/admin/klanten/${clientId}/onderhoud/nieuw`} className="rounded-xl bg-[#4D7EBA] px-4 py-2 text-xs font-semibold text-white hover:bg-[#667FB0]">
          + Toevoegen
        </Link>
      </div>
      {schedules.length === 0 ? (
        <EmptyState message="Geen actief onderhoudsplan." />
      ) : (
        <div className="space-y-3">
          {(schedules as Record<string, unknown>[]).map((s) => {
            const service = s.services as Record<string, unknown> | null;
            return (
              <div key={s.id as string} className="flex items-center justify-between rounded-2xl border border-[#101536]/06 bg-[#F3F5F7]/60 p-5">
                <div>
                  <p className="font-semibold text-[#101536]">{service?.name as string ?? "Dienst"}</p>
                  <p className="text-sm text-[#606774]">Iedere {s.frequency_weeks as number} weken</p>
                  {!!s.last_done_at && (
                    <p className="text-xs text-[#606774]">
                      Laatste keer: {new Date(String(s.last_done_at)).toLocaleDateString("nl-NL")}
                    </p>
                  )}
                </div>
                {!!s.next_due_at && (
                  <div className="text-right">
                    <p className="text-xs text-[#606774]">Volgende afspraak</p>
                    <p className="font-semibold text-[#4D7EBA]">
                      {new Date(String(s.next_due_at)).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PLACEHOLDER TABS ──────────────────────────────────────

function TabFotos({ clientId }: { clientId: string }) {
  return <EmptyState message="Foto's worden geladen vanuit afspraken." />;
}

function TabActiviteiten({ clientId }: { clientId: string }) {
  return <EmptyState message="Activiteitenlog beschikbaar zodra gegevens zijn ingevoerd." />;
}

function TabBerichten({ conversations, clientId }: { conversations: unknown[]; clientId: string }) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <EmptyState message="Nog geen berichten." />
        <Link href={`/admin/berichten/nieuw?client=${clientId}`} className="mt-4 inline-block rounded-xl bg-[#4D7EBA] px-4 py-2 text-sm font-semibold text-white">
          Start gesprek
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {(conversations as Record<string, unknown>[]).map((c) => (
        <Link key={c.id as string} href={`/admin/berichten/${c.id}`} className="block rounded-2xl border border-[#101536]/06 bg-[#F3F5F7]/60 p-4 hover:bg-[#F3F5F7]">
          <p className="font-semibold text-[#101536]">{c.subject as string || "Geen onderwerp"}</p>
          {!!c.last_message_at && (
            <p className="text-xs text-[#606774]">Laatste bericht: {new Date(String(c.last_message_at)).toLocaleDateString("nl-NL")}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-[#606774]">{message}</p>
    </div>
  );
}
