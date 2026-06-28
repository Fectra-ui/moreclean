import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getQuotesList } from "@/lib/services/crm/quotes";
import Link from "next/link";
import { PlusCircle, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Offertes" };
const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
  expired: "bg-gray-100 text-gray-500",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Concept", sent: "Verzonden", accepted: "Geaccepteerd",
  rejected: "Afgewezen", expired: "Verlopen",
};

export default async function OffertesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const status = sp.status as "draft" | "sent" | "accepted" | "rejected" | "expired" | undefined;

  const quotes = await getQuotesList(COMPANY_ID, status);

  const byStatus = {
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Offertes</h1>
          <p className="mt-1 text-sm text-[#606774]">{quotes.length} offertes</p>
        </div>
        <Link
          href="/admin/offertes/nieuw"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.25)] transition hover:-translate-y-0.5"
        >
          <PlusCircle size={16} />
          Nieuwe offerte
        </Link>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { label: "Alle", value: "" },
          { label: `Concept (${byStatus.draft})`, value: "draft" },
          { label: `Verzonden (${byStatus.sent})`, value: "sent" },
          { label: `Geaccepteerd (${byStatus.accepted})`, value: "accepted" },
          { label: `Afgewezen (${byStatus.rejected})`, value: "rejected" },
        ].map(({ label, value }) => (
          <Link
            key={value}
            href={value ? `/admin/offertes?status=${value}` : "/admin/offertes"}
            className={`flex-shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition ${
              (status ?? "") === value
                ? "bg-[#4D7EBA] text-white shadow-sm"
                : "bg-white/70 text-[#606774] border border-[#101536]/08 hover:bg-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* LIST */}
      {quotes.length === 0 ? (
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-12 text-center shadow-[0_8px_32px_rgba(16,21,54,.06)]">
          <p className="text-[#606774]">Geen offertes gevonden.</p>
          <Link href="/admin/offertes/nieuw" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#4D7EBA] hover:underline">
            <PlusCircle size={14} />
            Eerste offerte aanmaken
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/85 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F3F5F7]/60 text-left">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Nummer</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Klant</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Onderwerp</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Datum</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Geldig tot</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Totaal</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774]">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote, i) => (
                <tr
                  key={quote.id}
                  className={`border-b border-[#101536]/04 transition hover:bg-[#F3F5F7]/60 ${
                    i === quotes.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-mono text-xs font-medium text-[#606774]">{quote.quote_number}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#101536]">{quote.client_name}</p>
                  </td>
                  <td className="px-5 py-4 text-[#606774]">{quote.subject ?? "—"}</td>
                  <td className="px-5 py-4 text-[#606774]">
                    {new Date(quote.created_at).toLocaleDateString("nl-NL")}
                  </td>
                  <td className="px-5 py-4 text-[#606774]">
                    {quote.valid_until
                      ? new Date(quote.valid_until).toLocaleDateString("nl-NL")
                      : "—"}
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#101536]">
                    {quote.total.toLocaleString("nl-NL", { style: "currency", currency: "EUR" })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[quote.status] ?? ""}`}>
                      {STATUS_LABELS[quote.status] ?? quote.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/offertes/${quote.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-[#F3F5F7] px-3.5 py-1.5 text-xs font-semibold text-[#101536] transition hover:bg-[#4D7EBA] hover:text-white"
                    >
                      <ExternalLink size={12} />
                      Openen
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
