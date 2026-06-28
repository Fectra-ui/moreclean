import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getInvoiceList } from "@/lib/services/finance/invoices";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Facturen" };

const STATUS_COLORS: Record<string, string> = {
  draft:   "bg-gray-100 text-gray-600",
  sent:    "bg-[#4D7EBA]/10 text-[#4D7EBA]",
  paid:    "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Concept", sent: "Verzonden", paid: "Betaald",
  overdue: "Verlopen", cancelled: "Geannuleerd",
};

export default async function FacturenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { status = "all" } = await searchParams;
  const invoices = await getInvoiceList(status);

  const all = await getInvoiceList();
  const stats = {
    total: all.length,
    open: all.filter((i) => i.status === "sent").length,
    paid: all.filter((i) => i.status === "paid").length,
    overdue: all.filter((i) => i.status === "overdue").length,
    openAmount: all.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.total, 0),
  };

  const euro = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#101536]">Facturen</h1>
        <Link
          href="/admin/facturen/nieuw"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.3)] transition hover:-translate-y-0.5"
        >
          + Nieuwe factuur
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Open", value: stats.open, icon: Clock, color: "text-[#4D7EBA]" },
          { label: "Betaald", value: stats.paid, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Verlopen", value: stats.overdue, icon: AlertTriangle, color: "text-red-600" },
          { label: "Openstaand", value: euro(stats.openAmount), icon: FileText, color: "text-[#101536]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#606774]">
              <Icon size={16} className={color} />
              <p className="text-sm">{label}</p>
            </div>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "draft", "sent", "paid", "overdue"].map((s) => (
          <Link
            key={s}
            href={`/admin/facturen?status=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${status === s ? "bg-[#101536] text-white" : "bg-white border border-[#101536]/10 text-[#606774] hover:bg-[#F3F5F7]"}`}
          >
            {{ all: "Alle", draft: "Concept", sent: "Verzonden", paid: "Betaald", overdue: "Verlopen" }[s]}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
        {invoices.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[#606774]">Geen facturen gevonden</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                {["Nummer", "Klant", "Datum", "Vervalt", "Bedrag", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101536]/05">
              {invoices.map((inv) => (
                <tr key={inv.id} className="transition hover:bg-[#F8F9FB]">
                  <td className="px-4 py-3 font-mono font-semibold text-[#101536]">
                    {inv.invoice_number}
                    {inv.type === "credit" && <span className="ml-1.5 text-[10px] text-amber-600 font-bold">CR</span>}
                  </td>
                  <td className="px-4 py-3 text-[#101536]">{inv.client_name}</td>
                  <td className="px-4 py-3 text-[#606774]">
                    {new Date(inv.issue_date).toLocaleDateString("nl-NL")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={inv.days_overdue ? "font-semibold text-red-600" : "text-[#606774]"}>
                      {new Date(inv.due_date).toLocaleDateString("nl-NL")}
                      {inv.days_overdue ? ` (+${inv.days_overdue}d)` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#101536]">
                    {euro(inv.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft}`}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/facturen/${inv.id}`} className="text-[#4D7EBA] hover:underline text-xs">
                      Bekijken →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
