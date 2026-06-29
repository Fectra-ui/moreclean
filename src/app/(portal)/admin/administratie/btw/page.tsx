import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { getAllQuarterStats } from "@/lib/services/accounting/quarterExport";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "BTW-overzicht" };

const euro = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

const QUARTER_NAMES = ["Q1 (jan–mrt)", "Q2 (apr–jun)", "Q3 (jul–sep)", "Q4 (okt–dec)"];

export default async function BtwPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { user } = await requireAdmin();

  const params = await searchParams;
  const year = params.year ? Number(params.year) : new Date().getFullYear();
  const quarters = await getAllQuarterStats(year);
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);

  const yearVatCollected = quarters.reduce((s, q) => s + q.vatCollected, 0);
  const yearVatPaid = quarters.reduce((s, q) => s + q.vatPaid, 0);
  const yearVatToPay = yearVatCollected - yearVatPaid;

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/administratie" className="mb-3 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Administratie
        </Link>
        <h1 className="text-2xl font-bold text-[#101536]">BTW-overzicht {year}</h1>
        <p className="mt-0.5 text-sm text-[#606774]">Verkoopbtw minus inkoopbtw = netto af te dragen BTW</p>
      </div>

      {/* Jaar filter */}
      <div className="flex gap-2">
        {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
          <Link
            key={y}
            href={`?year=${y}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${year === y ? "bg-[#4D7EBA] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}
          >
            {y}
          </Link>
        ))}
      </div>

      {/* Jaartotalen */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Verkoopbtw totaal", value: euro(yearVatCollected), color: "text-emerald-600" },
          { label: "Inkoopbtw totaal", value: euro(yearVatPaid), color: "text-[#606774]" },
          { label: "Netto af te dragen", value: euro(yearVatToPay), color: yearVatToPay > 0 ? "text-amber-600" : "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per kwartaal */}
      <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
        <div className="border-b border-[#101536]/06 bg-[#F8F9FB] px-6 py-3">
          <div className="grid grid-cols-6 text-xs font-semibold uppercase tracking-wide text-[#606774]">
            <span>Kwartaal</span>
            <span className="text-right">Omzet excl.</span>
            <span className="text-right">Verkoopbtw</span>
            <span className="text-right">Kosten excl.</span>
            <span className="text-right">Inkoopbtw</span>
            <span className="text-right font-bold">Af te dragen</span>
          </div>
        </div>
        <div className="divide-y divide-[#101536]/05">
          {quarters.map((q, i) => {
            const isFuture = q.quarter > currentQ && year === currentYear;
            return (
              <div key={q.quarter} className={`grid grid-cols-6 items-center px-6 py-4 text-sm ${isFuture ? "opacity-40" : ""}`}>
                <div>
                  <p className="font-semibold text-[#101536]">Q{q.quarter}</p>
                  <p className="text-xs text-[#606774]">{QUARTER_NAMES[i]}</p>
                </div>
                <p className="text-right text-[#606774]">{euro(q.revenueExclVat)}</p>
                <p className="text-right font-medium text-emerald-700">{euro(q.vatCollected)}</p>
                <p className="text-right text-[#606774]">{euro(q.costsExclVat)}</p>
                <p className="text-right text-[#606774]">{euro(q.vatPaid)}</p>
                <p className={`text-right font-bold ${q.vatToPay > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {euro(q.vatToPay)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-6 border-t-2 border-[#101536]/10 bg-[#F8F9FB] px-6 py-4 text-sm font-bold">
          <span className="text-[#101536]">Totaal {year}</span>
          <span className="text-right text-[#606774]">{euro(quarters.reduce((s, q) => s + q.revenueExclVat, 0))}</span>
          <span className="text-right text-emerald-700">{euro(yearVatCollected)}</span>
          <span className="text-right text-[#606774]">{euro(quarters.reduce((s, q) => s + q.costsExclVat, 0))}</span>
          <span className="text-right text-[#606774]">{euro(yearVatPaid)}</span>
          <span className={`text-right text-base ${yearVatToPay > 0 ? "text-amber-600" : "text-emerald-600"}`}>{euro(yearVatToPay)}</span>
        </div>
      </div>

      <p className="text-xs text-[#606774]">
        * Inkoopbtw is gebaseerd op geüploade bonnetjes. Controleer altijd bij uw boekhouder voor de definitieve aangifte.
      </p>
    </div>
  );
}
