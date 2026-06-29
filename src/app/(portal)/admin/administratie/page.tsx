import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { getAllQuarterStats } from "@/lib/services/accounting/quarterExport";
import Link from "next/link";
import { Receipt, FileText, TrendingUp, Download, Archive } from "lucide-react";

export const metadata: Metadata = { title: "Administratie" };

const euro = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

const QUARTER_LABELS = ["Q1 jan–mrt", "Q2 apr–jun", "Q3 jul–sep", "Q4 okt–dec"];

const STATUS_COLORS: Record<string, string> = {
  open:     "bg-blue-50 text-blue-700 border-blue-200",
  closed:   "bg-amber-50 text-amber-700 border-amber-200",
  exported: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Open", closed: "Gesloten", exported: "Geëxporteerd",
};

export default async function AdministratiePage() {
  const { profile } = await requireAdmin();

  const year = new Date().getFullYear();
  const quarters = await getAllQuarterStats(year);
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
  const ytd = quarters.slice(0, currentQ);

  const totalRevenue = ytd.reduce((s, q) => s + q.revenueInclVat, 0);
  const totalVat = ytd.reduce((s, q) => s + q.vatToPay, 0);
  const totalReceipts = ytd.reduce((s, q) => s + q.receiptCount, 0);
  const totalInvoices = ytd.reduce((s, q) => s + q.invoiceCount, 0);

  const subNav = [
    { label: "Bonnetjes", href: "/admin/administratie/bonnetjes", icon: Receipt },
    { label: "BTW-overzicht", href: "/admin/administratie/btw", icon: TrendingUp },
    { label: "Export boekhouder", href: "/admin/administratie/export", icon: Download },
    { label: "Archief", href: "/admin/administratie/export?archief=1", icon: Archive },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Administratie</h1>
          <p className="mt-0.5 text-sm text-[#606774]">Jaar {year} · bijgewerkt tot Q{currentQ}</p>
        </div>
        <Link
          href={`/admin/administratie/export`}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5"
        >
          <Download size={14} /> Exporteer Q{currentQ}
        </Link>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2 flex-wrap">
        {subNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-4 py-2 text-sm font-medium text-[#606774] shadow-sm transition hover:border-[#4D7EBA]/30 hover:bg-[#F3F5F7] hover:text-[#4D7EBA]"
          >
            <item.icon size={14} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* YTD stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Omzet YTD", value: euro(totalRevenue), sub: `${totalInvoices} facturen`, color: "text-emerald-600" },
          { label: "BTW af te dragen", value: euro(totalVat), sub: "verkoopbtw minus inkoopbtw", color: "text-amber-600" },
          { label: "Bonnetjes", value: totalReceipts.toString(), sub: "ingediend dit jaar", color: "text-[#4D7EBA]" },
          { label: "Facturen verzonden", value: totalInvoices.toString(), sub: `YTD ${year}`, color: "text-[#101536]" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{stat.label}</p>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-[#606774]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Kwartaaloverzicht */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#101536]/06 px-6 py-4">
          <h2 className="font-semibold text-[#101536]">Kwartaalen {year}</h2>
        </div>
        <div className="divide-y divide-[#101536]/05">
          {quarters.map((q, i) => {
            const isFuture = q.quarter > currentQ;
            return (
              <div key={q.quarter} className={`flex items-center justify-between gap-4 px-6 py-4 ${isFuture ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className="w-28">
                    <p className="font-semibold text-[#101536] text-sm">Q{q.quarter} {year}</p>
                    <p className="text-xs text-[#606774]">{QUARTER_LABELS[i]}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[q.status] ?? STATUS_COLORS.open}`}>
                    {STATUS_LABELS[q.status] ?? q.status}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <p className="font-medium text-[#101536]">{euro(q.revenueInclVat)}</p>
                    <p className="text-xs text-[#606774]">{q.invoiceCount} facturen</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-amber-700">{euro(q.vatToPay)}</p>
                    <p className="text-xs text-[#606774]">BTW saldo</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#606774]">{q.receiptCount}</p>
                    <p className="text-xs text-[#606774]">bonnetjes</p>
                  </div>
                </div>

                {!isFuture && (
                  <Link
                    href={`/admin/administratie/export?year=${q.year}&quarter=${q.quarter}`}
                    className="flex items-center gap-1.5 rounded-xl border border-[#101536]/10 px-3 py-1.5 text-xs font-semibold text-[#606774] transition hover:border-[#4D7EBA]/30 hover:text-[#4D7EBA]"
                  >
                    <Download size={12} /> Export
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
