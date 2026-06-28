"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Send, CheckCircle, XCircle, FileDown, ExternalLink,
  Clock, Eye, CheckSquare, AlertCircle, Loader2, ArrowRight,
} from "lucide-react";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
}

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  client_id: string;
  subject: string | null;
  intro_text: string | null;
  notes: string | null;
  internal_notes: string | null;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  subtotal: number;
  discount_pct: number;
  vat_amount: number;
  total: number;
  created_at: string;
  quote_items: QuoteItem[];
  clients: {
    id: string;
    contact_name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
  };
}

const WORKFLOW_STEPS = [
  { status: "draft", label: "Concept", icon: Clock },
  { status: "sent", label: "Verzonden", icon: Send },
  { status: "seen", label: "Bekeken", icon: Eye },
  { status: "accepted", label: "Geaccepteerd", icon: CheckSquare },
  { status: "planning", label: "Planning", icon: ArrowRight },
  { status: "invoice", label: "Factuur", icon: CheckCircle },
];

const euro = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

export default function QuoteDetailView({ quote }: { quote: Quote }) {
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const client = quote.clients;

  async function handleAction(action: "send" | "accept" | "reject") {
    setLoading(action);
    const res = await fetch(`/api/quotes/${quote.id}/${action}`, { method: "POST" });
    if (res.ok) {
      setDone(action);
      startTransition(() => window.location.reload());
    }
    setLoading(null);
  }

  const currentStepIdx = ["draft", "sent", "sent", "accepted", "accepted", "accepted"].indexOf(quote.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* LEFT: QUOTE CONTENT */}
      <div className="space-y-6">
        {/* WORKFLOW TRACKER */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[#606774]">Workflow</h3>
          <div className="flex items-center gap-0">
            {WORKFLOW_STEPS.map(({ status, label, icon: Icon }, i) => {
              const isActive = status === quote.status;
              const isPast = i < currentStepIdx;
              const isLast = i === WORKFLOW_STEPS.length - 1;

              return (
                <div key={status} className="flex items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                      isActive ? "bg-[#4D7EBA] text-white shadow-[0_4px_12px_rgba(77,126,186,.35)]" :
                      isPast ? "bg-emerald-100 text-emerald-600" : "bg-[#F3F5F7] text-[#95AEC1]"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${
                      isActive ? "text-[#4D7EBA]" : isPast ? "text-emerald-600" : "text-[#606774]"
                    }`}>{label}</span>
                  </div>
                  {!isLast && (
                    <div className={`mx-1 h-0.5 flex-1 mb-4 ${isPast ? "bg-emerald-200" : "bg-[#F3F5F7]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CLIENT + SUBJECT */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#606774]">Klant</p>
              <Link href={`/admin/klanten/${client.id}`} className="group">
                <p className="font-semibold text-[#4D7EBA] group-hover:underline">
                  {client.company_name || client.contact_name}
                </p>
              </Link>
              {client.company_name && <p className="text-sm text-[#606774]">{client.contact_name}</p>}
              {client.address && <p className="text-sm text-[#606774]">{client.address}, {client.postal_code} {client.city}</p>}
              {client.email && <p className="text-sm text-[#606774]">{client.email}</p>}
            </div>
            {quote.subject && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#606774]">Onderwerp</p>
                <p className="font-semibold text-[#101536]">{quote.subject}</p>
                {quote.intro_text && <p className="mt-2 text-sm text-[#606774]">{quote.intro_text}</p>}
              </div>
            )}
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F3F5F7]/60">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#606774]">Omschrijving</th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#606774]">Aantal</th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#606774]">Prijs</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#606774]">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {quote.quote_items.sort((a, b) => a.sort_order - b.sort_order).map((item, i) => (
                <tr key={item.id} className={`border-b border-[#101536]/04 ${i === quote.quote_items.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-6 py-3.5 text-[#101536]">{item.description}</td>
                  <td className="px-4 py-3.5 text-right text-[#606774]">{item.quantity}</td>
                  <td className="px-4 py-3.5 text-right text-[#606774]">{euro(item.unit_price)}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-[#101536]">{euro(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="border-t border-[#101536]/06 px-6 py-5">
            <div className="ml-auto max-w-[260px] space-y-2">
              <TotalsLine label="Subtotaal" value={euro(quote.subtotal + quote.subtotal * (quote.discount_pct / 100))} />
              {quote.discount_pct > 0 && (
                <TotalsLine label={`Korting (${quote.discount_pct}%)`} value={`- ${euro(quote.subtotal * (quote.discount_pct / 100))}`} color="text-[#4D7EBA]" />
              )}
              <TotalsLine label="BTW (21%)" value={euro(quote.vat_amount)} />
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#4D7EBA] to-[#667FB0] px-4 py-3">
                <span className="font-bold text-white">Eindtotaal</span>
                <span className="text-lg font-bold text-white">{euro(quote.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NOTES */}
        {quote.notes && (
          <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#606774]">Opmerkingen</p>
            <p className="text-sm leading-relaxed text-[#606774]">{quote.notes}</p>
          </div>
        )}
        {quote.internal_notes && (
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Interne notities</p>
            <p className="text-sm text-amber-800">{quote.internal_notes}</p>
          </div>
        )}
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="space-y-4">
        {/* STATUS ACTIONS */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#606774]">Acties</h3>

          {/* PDF */}
          <a
            href={`/api/pdf/quote/${quote.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-5 py-3 text-sm font-semibold text-[#101536] transition hover:bg-[#F3F5F7]"
          >
            <FileDown size={15} />
            PDF downloaden
          </a>

          {quote.status === "draft" && (
            <ActionButton
              label="Verzenden naar klant"
              icon={<Send size={15} />}
              loading={loading === "send"}
              color="blue"
              onClick={() => handleAction("send")}
            />
          )}

          {quote.status === "sent" && (
            <>
              <ActionButton
                label="Markeer als geaccepteerd"
                icon={<CheckCircle size={15} />}
                loading={loading === "accept"}
                color="green"
                onClick={() => handleAction("accept")}
              />
              <ActionButton
                label="Markeer als afgewezen"
                icon={<XCircle size={15} />}
                loading={loading === "reject"}
                color="red"
                onClick={() => handleAction("reject")}
              />
            </>
          )}

          {quote.status === "accepted" && (
            <Link
              href={`/admin/facturen/nieuw?quote=${quote.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,.22)] transition hover:-translate-y-0.5"
            >
              <ArrowRight size={15} />
              Factuur aanmaken
            </Link>
          )}
        </div>

        {/* TIMELINE */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#606774]">Tijdlijn</h3>
          <div className="space-y-3">
            <TimelineEntry label="Aangemaakt" date={quote.created_at} icon={<Clock size={13} />} />
            {quote.sent_at && <TimelineEntry label="Verzonden" date={quote.sent_at} icon={<Send size={13} />} color="text-blue-600" />}
            {quote.accepted_at && <TimelineEntry label="Geaccepteerd" date={quote.accepted_at} icon={<CheckCircle size={13} />} color="text-emerald-600" />}
            {quote.rejected_at && <TimelineEntry label="Afgewezen" date={quote.rejected_at} icon={<XCircle size={13} />} color="text-red-500" />}
            {quote.valid_until && (
              <TimelineEntry
                label={new Date(quote.valid_until) < new Date() ? "Verlopen op" : "Geldig tot"}
                date={quote.valid_until + "T00:00:00"}
                icon={<AlertCircle size={13} />}
                color={new Date(quote.valid_until) < new Date() ? "text-red-500" : "text-[#606774]"}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TotalsLine({ label, value, color = "text-[#606774]" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#606774]">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

function TimelineEntry({ label, date, icon, color = "text-[#606774]" }: { label: string; date: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className={`flex items-center gap-3 text-sm ${color}`}>
      <div className="flex-shrink-0">{icon}</div>
      <span className="flex-1">{label}</span>
      <span className="text-xs">{new Date(date).toLocaleDateString("nl-NL")}</span>
    </div>
  );
}

function ActionButton({ label, icon, loading, color, onClick }: {
  label: string; icon: React.ReactNode; loading: boolean; color: "blue" | "green" | "red"; onClick: () => void;
}) {
  const colors = {
    blue: "bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] text-white shadow-[0_10px_30px_rgba(77,126,186,.22)]",
    green: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,.22)]",
    red: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-60 ${colors[color]}`}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}
