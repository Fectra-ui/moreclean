"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, XCircle, FileDown, Loader2, Banknote, AlertCircle, Smartphone } from "lucide-react";
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

interface QuoteData {
  id: string;
  quote_number: string;
  status: string;
  workflow_state: WorkflowState;
  subject: string | null;
  intro_text: string | null;
  notes: string | null;
  valid_until: string | null;
  accepted_at: string | null;
  subtotal: number;
  discount_pct: number;
  vat_amount: number;
  total: number;
  created_at: string;
  payment_received_at: string | null;
  quote_items: QuoteItem[];
}

const euro = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

export default function KlantOffertePage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [iban, setIban] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"akkoord" | "afwijzen" | null>(null);
  const [, startTransition] = useTransition();

  async function reload() {
    const res = await fetch(`/api/klant/offertes/${id}`);
    if (res.ok) setQuote(await res.json());
  }

  useEffect(() => {
    async function load() {
      const [qRes, cRes] = await Promise.all([
        fetch(`/api/klant/offertes/${id}`),
        fetch(`/api/klant/company`),
      ]);
      if (qRes.ok) setQuote(await qRes.json());
      if (cRes.ok) {
        const c = await cRes.json();
        setIban(c.iban ?? null);
        setCompanyName(c.name ?? "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleAkkoord() {
    setActionLoading("akkoord");
    // Accept → then immediately transition to wacht_betaling
    const r1 = await fetch(`/api/quotes/${id}/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "akkoord" }),
    });
    if (r1.ok) {
      await fetch(`/api/quotes/${id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "wacht_betaling" }),
      });
    }
    startTransition(() => reload());
    setActionLoading(null);
  }

  async function handleAfwijzen() {
    setActionLoading("afwijzen");
    await fetch(`/api/quotes/${id}/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "afgewezen" }),
    });
    startTransition(() => reload());
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#4D7EBA]" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-[24px] bg-white/85 p-10 text-center">
        <p className="text-[#606774]">Offerte niet gevonden.</p>
        <Link href="/klant/offertes" className="mt-4 inline-block text-sm text-[#4D7EBA] hover:underline">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  const state = quote.workflow_state;
  const isExpired = quote.valid_until ? new Date(quote.valid_until) < new Date() : false;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/klant/offertes" className="flex items-center gap-1 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={16} />
          Mijn offertes
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#101536]">{quote.quote_number}</h1>
        {quote.subject && <p className="mt-0.5 text-sm text-[#606774]">{quote.subject}</p>}
        <p className="mt-0.5 text-xs text-[#606774]">
          Aangemaakt op {new Date(quote.created_at).toLocaleDateString("nl-NL")}
          {quote.valid_until && ` · Geldig tot ${new Date(quote.valid_until).toLocaleDateString("nl-NL")}`}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_200px]">
        {/* LEFT: offerte-inhoud */}
        <div className="space-y-5">
          {/* Regels */}
          <div className="rounded-[24px] border border-white/60 bg-white/85 shadow-sm backdrop-blur-xl overflow-hidden">
            {quote.intro_text && (
              <div className="px-6 pt-5 pb-4 border-b border-[#101536]/06">
                <p className="text-sm leading-relaxed text-[#606774]">{quote.intro_text}</p>
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#101536]/06 bg-[#F3F5F7]/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#606774]">Omschrijving</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#606774]">Aantal</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#606774]">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {quote.quote_items.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                  <tr key={item.id} className="border-b border-[#101536]/04 last:border-0">
                    <td className="px-5 py-3 text-[#101536]">{item.description}</td>
                    <td className="px-3 py-3 text-right text-[#606774]">{item.quantity}×</td>
                    <td className="px-5 py-3 text-right font-semibold text-[#101536]">{euro(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-[#101536]/06 px-5 py-4 space-y-1.5">
              <div className="flex justify-between text-sm text-[#606774]">
                <span>Subtotaal excl. BTW</span>
                <span>{euro(quote.subtotal)}</span>
              </div>
              {quote.discount_pct > 0 && (
                <div className="flex justify-between text-sm text-[#4D7EBA]">
                  <span>Korting ({quote.discount_pct}%)</span>
                  <span>- {euro(quote.subtotal * quote.discount_pct / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#606774]">
                <span>BTW (21%)</span>
                <span>{euro(quote.vat_amount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#4D7EBA] to-[#667FB0] px-4 py-3 mt-2">
                <span className="font-bold text-white text-sm">Totaal te betalen</span>
                <span className="text-lg font-bold text-white">{euro(quote.total)}</span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="rounded-[20px] border border-[#101536]/08 bg-white/85 p-4 text-sm text-[#606774]">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#606774]">Opmerkingen</p>
              {quote.notes}
            </div>
          )}

          {/* CTA sectie */}
          {state === "verzonden" && !isExpired && (
            <div className="rounded-[20px] border border-[#4D7EBA]/20 bg-[#4D7EBA]/05 p-5 space-y-3">
              <p className="text-sm font-semibold text-[#101536]">Geef akkoord op deze offerte</p>
              <p className="text-xs text-[#606774]">
                Door akkoord te geven bevestig je dat je instemt met de omschrijving en het bedrag. Je ontvangt daarna de betaalinstructies.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAkkoord}
                  disabled={!!actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,.22)] transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {actionLoading === "akkoord" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Akkoord
                </button>
                <button
                  onClick={handleAfwijzen}
                  disabled={!!actionLoading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {actionLoading === "afwijzen" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Afwijzen
                </button>
              </div>
            </div>
          )}

          {state === "wacht_betaling" && (
            <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <p className="font-semibold text-emerald-800">Akkoord ontvangen — nu betalen</p>
              </div>
              <p className="text-sm text-emerald-700">
                Maak het bedrag over. Na ontvangst van de betaling plannen wij de werkzaamheden in.
              </p>

              {/* iDEAL placeholder */}
              <button
                disabled
                title="Binnenkort beschikbaar"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#CC0066] px-5 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
              >
                <Smartphone size={15} />
                Betaal via iDEAL
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">Binnenkort</span>
              </button>

              {iban && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Of maak handmatig over:</p>
                  <div className="rounded-2xl bg-white border border-emerald-200 p-4 space-y-1.5 text-sm">
                    <PaymentRow label="Begunstigde" value={companyName} />
                    <PaymentRow label="IBAN" value={iban} mono />
                    <PaymentRow label="Bedrag" value={euro(quote.total)} bold />
                    <PaymentRow label="Kenmerk" value={quote.quote_number} mono />
                  </div>
                </div>
              )}

              {!iban && (
                <p className="text-xs text-emerald-700">Neem contact op voor de betaalgegevens.</p>
              )}
            </div>
          )}

          {["betaald", "planning", "uitvoering", "uitgevoerd", "gefactureerd", "factuur_betaald"].includes(state) && (
            <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 text-sm">Betaling ontvangen — opdracht bevestigd</p>
                <p className="text-xs text-emerald-600">Wij nemen contact op om de werkzaamheden in te plannen.</p>
              </div>
            </div>
          )}

          {state === "verlopen" && (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
              <AlertCircle size={16} className="text-amber-600" />
              <p className="text-sm text-amber-700">
                Deze offerte is verlopen op {new Date(quote.valid_until!).toLocaleDateString("nl-NL")}. Neem contact op voor een nieuwe offerte.
              </p>
            </div>
          )}

          {state === "afgewezen" && (
            <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <XCircle size={16} className="text-red-500" />
              <p className="text-sm text-red-700">U heeft deze offerte afgewezen. Neem contact op als u toch interesse heeft.</p>
            </div>
          )}

          <a
            href={`/api/pdf/quote/${quote.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-[#606774] hover:text-[#101536] transition"
          >
            <FileDown size={14} />
            PDF downloaden
          </a>
        </div>

        {/* RIGHT: workflow stepper */}
        <div className="rounded-[20px] border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur-xl h-fit">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#606774]">Status</p>
          <WorkflowStepper currentState={state} klantView />
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#606774]">{label}</span>
      <span className={`${mono ? "font-mono text-xs" : ""} ${bold ? "font-bold text-[#101536]" : "text-[#101536]"}`}>{value}</span>
    </div>
  );
}
