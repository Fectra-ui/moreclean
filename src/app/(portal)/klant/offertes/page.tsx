import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Mijn Offertes" };

export default async function KlantOffertes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) redirect("/klant");

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, status, workflow_state, total, created_at, valid_until")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const wfLabel: Record<string, string> = {
    concept:        "Concept",
    verzonden:      "Wacht op goedkeuring",
    akkoord:        "Akkoord gegeven",
    wacht_betaling: "Wacht op betaling",
    betaald:        "Betaald",
    planning:       "Ingepland",
    uitvoering:     "In uitvoering",
    uitgevoerd:     "Uitgevoerd",
    gefactureerd:   "Factuur ontvangen",
    factuur_betaald:"Afgerond",
    afgewezen:      "Afgewezen",
    verlopen:       "Verlopen",
  };
  const wfColor: Record<string, string> = {
    concept:        "bg-gray-100 text-gray-600",
    verzonden:      "bg-amber-100 text-amber-700",
    akkoord:        "bg-blue-100 text-blue-700",
    wacht_betaling: "bg-orange-100 text-orange-700",
    betaald:        "bg-emerald-100 text-emerald-700",
    planning:       "bg-blue-100 text-blue-700",
    uitvoering:     "bg-blue-100 text-blue-700",
    uitgevoerd:     "bg-emerald-100 text-emerald-700",
    gefactureerd:   "bg-purple-100 text-purple-700",
    factuur_betaald:"bg-emerald-100 text-emerald-800",
    afgewezen:      "bg-red-100 text-red-700",
    verlopen:       "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Mijn offertes</h1>
        <p className="mt-1 text-sm text-[#606774]">{quotes?.length ?? 0} offerte{(quotes?.length ?? 0) !== 1 ? "s" : ""} in totaal</p>
      </div>

      {!quotes?.length ? (
        <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl shadow-sm">
          <FileText size={32} className="mx-auto mb-3 text-[#95AEC1]" />
          <p className="text-sm text-[#606774]">Nog geen offertes ontvangen</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                {["Nummer", "Datum", "Geldig tot", "Bedrag", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101536]/05">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-[#F8F9FB]">
                  <td className="px-5 py-4 font-semibold text-[#101536]">{q.quote_number}</td>
                  <td className="px-5 py-4 text-[#606774]">
                    {new Date(q.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-[#606774]">
                    {q.valid_until
                      ? new Date(q.valid_until).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
                      : "—"}
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#101536]">
                    €{Number(q.total).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${wfColor[q.workflow_state] ?? "bg-gray-100 text-gray-700"}`}>
                      {wfLabel[q.workflow_state] ?? q.workflow_state}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/klant/offertes/${q.id}`}
                      className="text-xs font-medium text-[#4D7EBA] hover:underline"
                    >
                      Bekijken
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
