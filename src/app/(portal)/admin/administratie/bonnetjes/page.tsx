import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { listReceipts } from "@/lib/services/accounting/receipts";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Bonnetjes" };

const euro = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

const CATEGORY_LABELS: Record<string, string> = {
  brandstof: "Brandstof",
  materiaal: "Materiaal",
  gereedschap: "Gereedschap",
  parkeren: "Parkeren",
  reiskosten: "Reiskosten",
  overig: "Overig",
};

const CATEGORY_COLORS: Record<string, string> = {
  brandstof:  "bg-orange-100 text-orange-700",
  materiaal:  "bg-blue-100 text-blue-700",
  gereedschap:"bg-yellow-100 text-yellow-700",
  parkeren:   "bg-gray-100 text-gray-600",
  reiskosten: "bg-purple-100 text-purple-700",
  overig:     "bg-[#F3F5F7] text-[#606774]",
};

export default async function BonnetjesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") redirect("/klant");

  const params = await searchParams;
  const year = params.year ? Number(params.year) : new Date().getFullYear();
  const quarter = params.quarter ? Number(params.quarter) : undefined;

  const receipts = await listReceipts(year, quarter);
  const totalAmount = receipts.reduce((s, r) => s + Number(r.amount), 0);
  const totalVat = receipts.reduce((s, r) => s + Number(r.vat_amount), 0);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/administratie" className="mb-3 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Administratie
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#101536]">Bonnetjes</h1>
          <Link
            href="/medewerker/bonnetje"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5"
          >
            <Plus size={14} /> Nieuw bonnetje
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {years.map((y) => (
          <Link
            key={y}
            href={`?year=${y}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${year === y ? "bg-[#4D7EBA] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}
          >
            {y}
          </Link>
        ))}
        <span className="mx-1 text-[#101536]/20">|</span>
        <Link href={`?year=${year}`} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${!quarter ? "bg-[#101536] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}>
          Heel jaar
        </Link>
        {[1, 2, 3, 4].map((q) => (
          <Link
            key={q}
            href={`?year=${year}&quarter=${q}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${quarter === q ? "bg-[#101536] text-white" : "border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}
          >
            Q{q}
          </Link>
        ))}
      </div>

      {/* Totalen */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Totaal incl. BTW", value: euro(totalAmount) },
          { label: "Terugvorderbare BTW", value: euro(totalVat), sub: "inkoopbtw" },
          { label: "Aantal bonnetjes", value: receipts.length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#101536]/08 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{stat.label}</p>
            <p className="mt-1.5 text-xl font-bold text-[#101536]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
        {receipts.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[#606774]">Geen bonnetjes gevonden</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                {["Datum", "Leverancier", "Categorie", "Medewerker", "Excl. BTW", "BTW", "Incl. BTW", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101536]/05">
              {receipts.map((r) => {
                const uploader = r.uploader as { first_name: string | null; last_name: string | null } | undefined;
                const uploaderName = [uploader?.first_name, uploader?.last_name].filter(Boolean).join(" ") || "–";
                return (
                  <tr key={r.id} className="hover:bg-[#F8F9FB]">
                    <td className="px-4 py-3 text-[#606774]">
                      {new Date(r.receipt_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#101536]">{r.supplier ?? "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.overig}`}>
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#606774]">{uploaderName}</td>
                    <td className="px-4 py-3 text-right text-[#606774]">{euro(Number(r.amount_excl_vat))}</td>
                    <td className="px-4 py-3 text-right text-[#606774]">{euro(Number(r.vat_amount))}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#101536]">{euro(Number(r.amount))}</td>
                    <td className="px-4 py-3">
                      {r.file_path && (
                        <a
                          href={`/api/receipts/${r.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#4D7EBA] hover:underline"
                        >
                          Bekijken
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
