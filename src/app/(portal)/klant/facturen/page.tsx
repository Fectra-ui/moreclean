import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Mijn Facturen" };

export default async function KlantFacturen() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) redirect("/klant");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, issue_date, due_date, paid_at")
    .eq("client_id", client.id)
    .order("issue_date", { ascending: false });

  const statusLabel: Record<string, string> = {
    draft: "Concept",
    sent: "Openstaand",
    paid: "Betaald",
    overdue: "Verlopen",
    credit: "Credit",
  };
  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
    credit: "bg-amber-100 text-amber-700",
  };

  const openTotal = invoices?.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.total), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Mijn facturen</h1>
        <p className="mt-1 text-sm text-[#606774]">{invoices?.length ?? 0} facturen in totaal</p>
      </div>

      {openTotal > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">
            Openstaand bedrag: <span className="text-lg">€{openTotal.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</span>
          </p>
          <p className="text-xs text-amber-700 mt-0.5">Vragen over een factuur? Neem contact op via het berichtenportaal.</p>
        </div>
      )}

      {!invoices?.length ? (
        <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl shadow-sm">
          <Receipt size={32} className="mx-auto mb-3 text-[#95AEC1]" />
          <p className="text-sm text-[#606774]">Nog geen facturen ontvangen</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                {["Nummer", "Datum", "Vervaldatum", "Bedrag", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101536]/05">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F8F9FB]">
                  <td className="px-5 py-4 font-semibold text-[#101536]">{inv.invoice_number}</td>
                  <td className="px-5 py-4 text-[#606774]">
                    {new Date(inv.issue_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-[#606774]">
                    <span className={inv.status === "overdue" ? "font-semibold text-red-600" : ""}>
                      {new Date(inv.due_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#101536]">
                    €{Number(inv.total).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[inv.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {statusLabel[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/api/pdf/invoice/${inv.id}`}
                      target="_blank"
                      className="text-xs font-medium text-[#4D7EBA] hover:underline"
                    >
                      PDF
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
