import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { getAllQuarterStats } from "@/lib/services/accounting/quarterExport";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ExportActions from "./ExportActions";

export const metadata: Metadata = { title: "Export boekhouder" };

const euro = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

const STATUS_COLORS: Record<string, string> = {
  open:     "bg-blue-50 text-blue-700",
  closed:   "bg-amber-50 text-amber-700",
  exported: "bg-emerald-50 text-emerald-700",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Open", closed: "Gesloten", exported: "Geëxporteerd",
};

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string }>;
}) {
  const { profile } = await requireAdmin();

  const params = await searchParams;
  const year = params.year ? Number(params.year) : new Date().getFullYear();
  const selectedQ = params.quarter ? Number(params.quarter) : Math.ceil((new Date().getMonth() + 1) / 3);

  const quarters = await getAllQuarterStats(year);
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/administratie" className="mb-3 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Administratie
        </Link>
        <h1 className="text-2xl font-bold text-[#101536]">Export boekhouder</h1>
        <p className="mt-0.5 text-sm text-[#606774]">
          Genereer een compleet kwartaalpakket: alle facturen, bonnetjes, CSV-rapport en audit-log in één ZIP.
        </p>
      </div>

      {/* Jaar selector */}
      <div className="flex gap-2">
        {years.map((y) => (
          <Link
            key={y}
            href={`?year=${y}&quarter=${selectedQ}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${year === y ? "bg-[#4D7EBA] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}
          >
            {y}
          </Link>
        ))}
      </div>

      {/* Kwartaal kaarten */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quarters.map((q) => (
          <Link
            key={q.quarter}
            href={`?year=${year}&quarter=${q.quarter}`}
            className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${selectedQ === q.quarter ? "border-[#4D7EBA]/40 bg-[#4D7EBA]/05 shadow-sm" : "border-[#101536]/08 bg-white shadow-sm"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[#101536]">Q{q.quarter} {year}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[q.status] ?? STATUS_COLORS.open}`}>
                {STATUS_LABELS[q.status] ?? q.status}
              </span>
            </div>
            <p className="text-xl font-bold text-[#101536]">{euro(q.revenueInclVat)}</p>
            <p className="mt-1 text-xs text-[#606774]">{q.invoiceCount} facturen · {q.receiptCount} bonnetjes</p>
            <p className="mt-0.5 text-xs text-amber-600">BTW: {euro(q.vatToPay)}</p>
          </Link>
        ))}
      </div>

      {/* Export sectie voor geselecteerd kwartaal */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        {(() => {
          const q = quarters.find((x) => x.quarter === selectedQ);
          if (!q) return null;
          return (
            <>
              <h2 className="mb-4 font-semibold text-[#101536]">Q{q.quarter} {year} — exportpakket</h2>

              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Facturen in ZIP", value: `${q.invoiceCount} PDF bestanden` },
                  { label: "Bonnetjes in ZIP", value: `${q.receiptCount} bestanden` },
                  { label: "CSV-rapport", value: "1 bestand (rapport.csv)" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[#F8F9FB] px-4 py-3">
                    <p className="text-xs font-semibold text-[#606774]">{item.label}</p>
                    <p className="mt-1 text-sm font-medium text-[#101536]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#101536]/06 bg-[#F8F9FB] px-5 py-4 text-sm text-[#606774] mb-5">
                <p className="font-semibold text-[#101536] mb-2">ZIP inhoud: Q{q.quarter}-{year}.zip</p>
                <pre className="font-mono text-xs leading-relaxed text-[#606774]">{`Q${q.quarter}-${year}.zip
├── Facturen/
│   ├── MC-${year}-0012.pdf
│   └── MC-${year}-0013.pdf
├── Bonnetjes/
│   ├── Tankstation.jpg
│   └── Gamma-bon.pdf
├── rapport.csv
└── audit.json`}</pre>
              </div>

              <ExportActions year={year} quarter={selectedQ} status={q.status} />
            </>
          );
        })()}
      </div>
    </div>
  );
}
