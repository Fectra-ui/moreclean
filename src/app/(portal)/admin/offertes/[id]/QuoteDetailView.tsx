"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Send, CheckCircle, XCircle, FileDown,
  Clock, Loader2, ArrowRight, Banknote,
  CheckCircle2, AlertTriangle, Calendar,
} from "lucide-react";
import WorkflowStepper from "@/components/portal/WorkflowStepper";
import type { WorkflowState } from "@/lib/services/workflow/quoteWorkflowTypes";

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
  workflow_state: WorkflowState;
  client_id: string;
  subject: string | null;
  intro_text: string | null;
  notes: string | null;
  internal_notes: string | null;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  payment_received_at: string | null;
  planned_at: string | null;
  work_completed_at: string | null;
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

const euro = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

export default function QuoteDetailView({ quote }: { quote: Quote }) {
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);
  const client = quote.clients;
  const state = quote.workflow_state ?? "concept";

  async function transition(to: WorkflowState) {
    setLoading(to);
    const res = await fetch(`/api/quotes/${quote.id}/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    if (res.ok) startTransition(() => window.location.reload());
    else setLoading(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* LEFT: QUOTE CONTENT */}
      <div className="space-y-6">
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

      {/* RIGHT: SIDEBAR */}
      <div className="space-y-4">
        {/* WORKFLOW STEPPER */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Workflow</p>
          <WorkflowStepper currentState={state} />
        </div>

        {/* ACTIES */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">Acties</p>

          <a
            href={`/api/pdf/quote/${quote.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#101536] transition hover:bg-[#F3F5F7]"
          >
            <FileDown size={14} />
            PDF downloaden
          </a>

          {state === "concept" && (
            <ActionBtn label="Verzenden naar klant" icon={<Send size={14} />} color="blue"
              loading={loading === "verzonden"} onClick={() => transition("verzonden")} />
          )}

          {state === "verzonden" && (
            <>
              <ActionBtn label="Akkoord markeren" icon={<CheckCircle size={14} />} color="green"
                loading={loading === "akkoord"} onClick={() => transition("akkoord")} />
              <ActionBtn label="Afwijzen" icon={<XCircle size={14} />} color="red"
                loading={loading === "afgewezen"} onClick={() => transition("afgewezen")} />
            </>
          )}

          {state === "akkoord" && (
            <ActionBtn label="Wacht op betaling →" icon={<Banknote size={14} />} color="blue"
              loading={loading === "wacht_betaling"} onClick={() => transition("wacht_betaling")} />
          )}

          {state === "planning" && (
            <Link
              href="/admin/planning"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              <Calendar size={14} />
              Ga naar planning
            </Link>
          )}

          {state === "uitvoering" && (
            <ActionBtn label="Markeer als uitgevoerd" icon={<CheckCircle2 size={14} />} color="green"
              loading={loading === "uitgevoerd"} onClick={() => transition("uitgevoerd")} />
          )}

          {state === "uitgevoerd" && (
            <Link
              href={`/admin/facturen/nieuw?quote=${quote.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,.22)] transition hover:-translate-y-0.5"
            >
              <ArrowRight size={14} />
              Factuur aanmaken
            </Link>
          )}
        </div>

        {/* BETALING KAART */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">Betaling</p>

          {!quote.payment_received_at ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full border-2 border-[#D8DDE6]" />
                <span className="text-sm text-[#606774]">Niet ontvangen</span>
              </div>
              <p className="text-lg font-bold text-[#101536]">{euro(quote.total)}</p>

              {["wacht_betaling", "akkoord"].includes(state) && (
                <ActionBtn
                  label="Markeer ontvangen"
                  icon={<CheckCircle2 size={14} />}
                  color="green"
                  loading={loading === "betaald"}
                  onClick={() => transition("betaald")}
                />
              )}

              {["wacht_betaling"].includes(state) && (
                <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-4 py-2 text-xs font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">
                  <AlertTriangle size={12} />
                  Stuur herinnering
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">Ontvangen</span>
              </div>
              <p className="text-lg font-bold text-[#101536]">{euro(quote.total)}</p>
              <p className="text-xs text-[#606774]">
                {new Date(quote.payment_received_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-xs font-mono text-[#606774]">Kenmerk: {quote.quote_number}</p>

              {state === "betaald" && (
                <ActionBtn
                  label="Inplannen →"
                  icon={<Calendar size={14} />}
                  color="blue"
                  loading={loading === "planning"}
                  onClick={() => transition("planning")}
                />
              )}
            </>
          )}
        </div>

        {/* TIJDLIJN */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#606774]">Tijdlijn</p>
          <div className="space-y-3">
            <TimelineEntry label="Aangemaakt" date={quote.created_at} icon={<Clock size={12} />} />
            {quote.sent_at && <TimelineEntry label="Verzonden" date={quote.sent_at} icon={<Send size={12} />} color="text-blue-600" />}
            {quote.accepted_at && <TimelineEntry label="Akkoord klant" date={quote.accepted_at} icon={<CheckCircle size={12} />} color="text-emerald-600" />}
            {quote.payment_received_at && <TimelineEntry label="Betaling ontvangen" date={quote.payment_received_at} icon={<Banknote size={12} />} color="text-emerald-600" />}
            {quote.planned_at && <TimelineEntry label="Ingepland" date={quote.planned_at} icon={<Calendar size={12} />} color="text-[#4D7EBA]" />}
            {quote.work_completed_at && <TimelineEntry label="Uitgevoerd" date={quote.work_completed_at} icon={<CheckCircle2 size={12} />} color="text-emerald-600" />}
            {quote.rejected_at && <TimelineEntry label="Afgewezen" date={quote.rejected_at} icon={<XCircle size={12} />} color="text-red-500" />}
            {quote.valid_until && (
              <TimelineEntry
                label={new Date(quote.valid_until) < new Date() ? "Verlopen op" : "Geldig tot"}
                date={quote.valid_until + "T00:00:00"}
                icon={<AlertTriangle size={12} />}
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

function TimelineEntry({ label, date, icon, color = "text-[#606774]" }: {
  label: string; date: string; icon: React.ReactNode; color?: string;
}) {
  return (
    <div className={`flex items-center gap-3 text-sm ${color}`}>
      <div className="flex-shrink-0">{icon}</div>
      <span className="flex-1 text-xs">{label}</span>
      <span className="text-xs">{new Date(date).toLocaleDateString("nl-NL")}</span>
    </div>
  );
}

function ActionBtn({ label, icon, loading: isLoading, color, onClick }: {
  label: string; icon: React.ReactNode; loading: boolean; color: "blue" | "green" | "red"; onClick: () => void;
}) {
  const colors = {
    blue:  "bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] text-white shadow-[0_8px_24px_rgba(77,126,186,.20)]",
    green: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_24px_rgba(16,185,129,.20)]",
    red:   "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-60 ${colors[color]}`}
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}
