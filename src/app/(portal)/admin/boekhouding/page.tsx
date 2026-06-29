import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronLeft, Download, CheckCircle2, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Boekhouding | More Clean" };

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";
const euro = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

interface QuoteRow {
  id: string;
  quote_number: string;
  created_at: string;
  accepted_at: string | null;
  payment_received_at: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  discount_pct: number;
  clients: { contact_name: string; company_name: string | null } | null;
}

export default async function BoekhoudingPage() {
  await requireAdmin();
  const svc = createServiceClient();

  const { data: rows } = await svc
    .from("quotes")
    .select("id, quote_number, created_at, accepted_at, payment_received_at, subtotal, vat_amount, total, discount_pct, clients(contact_name, company_name)")
    .eq("company_id", COMPANY_ID)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false });

  const quotes = (rows ?? []) as unknown as QuoteRow[];
  const paid = quotes.filter((q) => !!q.payment_received_at);
  const pending = quotes.filter((q) => !q.payment_received_at);

  const totalPaid = paid.reduce((s, q) => s + q.total, 0);
  const totalVat = paid.reduce((s, q) => s + q.vat_amount, 0);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/instellingen" className="flex items-center gap-1 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={16} />
          Instellingen
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Boekhouding</h1>
          <p className="mt-1 text-sm text-[#606774]">Overzicht voor de boekhouder — geaccepteerde offertes en betalingen.</p>
        </div>
        <a
          href="/api/boekhouding/export"
          className="flex items-center gap-2 rounded-2xl border border-[#4D7EBA]/20 bg-[#4D7EBA]/05 px-4 py-2 text-xs font-semibold text-[#4D7EBA] transition hover:bg-[#4D7EBA]/10"
        >
          <Download size={14} />
          CSV exporteren
        </a>
      </div>

      {/* Samenvatting */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Totaal ontvangen" value={euro(totalPaid)} sub={`${paid.length} betalingen`} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <SummaryCard label="BTW (ontvangen)" value={euro(totalVat)} sub="21% over ontvangen bedrag" color="text-[#4D7EBA] bg-[#4D7EBA]/05 border-[#4D7EBA]/20" />
        <SummaryCard label="Openstaand (geaccepteerd)" value={euro(pending.reduce((s, q) => s + q.total, 0))} sub={`${pending.length} wacht op betaling`} color="text-amber-700 bg-amber-50 border-amber-200" />
      </div>

      {/* Betaald */}
      {paid.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#101536]">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Betaald ({paid.length})
          </h2>
          <QuoteTable rows={paid} />
        </section>
      )}

      {/* Wacht op betaling */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#101536]">
            <Clock size={16} className="text-amber-500" />
            Geaccepteerd — wacht op betaling ({pending.length})
          </h2>
          <QuoteTable rows={pending} />
        </section>
      )}

      {quotes.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-[#101536]/10 bg-white/60 p-12 text-center">
          <p className="text-sm text-[#606774]">Nog geen geaccepteerde offertes.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`rounded-[20px] border p-5 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs opacity-70">{sub}</p>
    </div>
  );
}

function QuoteTable({ rows }: { rows: QuoteRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
            {["Nummer", "Klant", "Datum", "Excl. BTW", "BTW", "Totaal", "Betaling"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#101536]/05">
          {rows.map((q) => {
            const klant = q.clients?.company_name ?? q.clients?.contact_name ?? "—";
            return (
              <tr key={q.id} className="hover:bg-[#F8F9FB]">
                <td className="px-4 py-3 font-mono text-xs text-[#4D7EBA]">
                  <Link href={`/admin/offertes/${q.id}`} className="hover:underline">{q.quote_number}</Link>
                </td>
                <td className="px-4 py-3 text-[#101536]">{klant}</td>
                <td className="px-4 py-3 text-[#606774] text-xs">
                  {q.accepted_at ? new Date(q.accepted_at).toLocaleDateString("nl-NL") : "—"}
                </td>
                <td className="px-4 py-3 text-[#606774]">{euro(q.subtotal)}</td>
                <td className="px-4 py-3 text-[#606774]">{euro(q.vat_amount)}</td>
                <td className="px-4 py-3 font-semibold text-[#101536]">{euro(q.total)}</td>
                <td className="px-4 py-3">
                  {q.payment_received_at ? (
                    <span className="text-xs text-emerald-600 font-medium">
                      {new Date(q.payment_received_at).toLocaleDateString("nl-NL")}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">Openstaand</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
