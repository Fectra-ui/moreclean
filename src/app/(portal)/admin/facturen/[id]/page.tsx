import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getInvoiceFull } from "@/lib/services/finance/invoices";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import InvoiceActions from "./InvoiceActions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const inv = await getInvoiceFull(id);
  return { title: inv ? `Factuur ${inv.invoice_number}` : "Factuur" };
}

const STATUS_COLORS: Record<string, string> = {
  draft:   "bg-gray-100 text-gray-600",
  sent:    "bg-[#4D7EBA]/10 text-[#4D7EBA]",
  paid:    "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Concept", sent: "Verzonden", paid: "Betaald", overdue: "Verlopen",
};

const euro = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

export default async function FactuurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const inv = await getInvoiceFull(id);
  if (!inv) notFound();

  const c = inv.client;
  const isCredit = inv.type === "credit";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/facturen" className="mb-3 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Terug naar facturen
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#101536]">
            {isCredit ? "Creditfactuur" : "Factuur"} {inv.invoice_number}
          </h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft}`}>
            {STATUS_LABELS[inv.status] ?? inv.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* Client + meta */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#606774]">Factureren aan</p>
              {c.company_name && <p className="font-bold text-[#101536]">{c.company_name}</p>}
              <p className="text-sm text-[#101536]">{c.contact_name}</p>
              {c.address && <p className="mt-1 text-sm text-[#606774]">{c.address}</p>}
              {c.city && <p className="text-sm text-[#606774]">{c.postal_code} {c.city}</p>}
              {c.email && <p className="mt-1 text-sm text-[#4D7EBA]">{c.email}</p>}
              {c.vat_number && <p className="text-sm text-[#606774]">BTW: {c.vat_number}</p>}
            </div>
            <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#606774]">Details</p>
              <dl className="space-y-2 text-sm">
                {[
                  { label: "Factuurdatum", value: new Date(inv.issue_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Vervaldatum", value: new Date(inv.due_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }), red: inv.status === "overdue" },
                  { label: "Verzonden", value: inv.sent_at ? new Date(inv.sent_at).toLocaleDateString("nl-NL") : "–" },
                  { label: "Betaald", value: inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("nl-NL") : "–", green: !!inv.paid_at },
                ].map(({ label, value, red, green }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-[#606774]">{label}</dt>
                    <dd className={`font-medium ${red ? "text-red-600" : green ? "text-emerald-600" : "text-[#101536]"}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Line items */}
          <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#606774]">Omschrijving</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#606774]">Aantal</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#606774]">Stukprijs</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#606774]">Totaal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101536]/05">
                {inv.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-[#101536]">{item.description}</td>
                    <td className="px-5 py-3 text-right text-[#606774]">{Math.abs(item.quantity)}</td>
                    <td className="px-5 py-3 text-right text-[#606774]">{euro(item.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-medium text-[#101536]">{euro(Math.abs(item.total_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end border-t border-[#101536]/06 px-5 py-4">
              <dl className="w-52 space-y-1.5 text-sm">
                {inv.discount_pct > 0 && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-[#606774]">Subtotaal</dt>
                      <dd>{euro(Math.abs(inv.subtotal) / (1 - inv.discount_pct / 100))}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#606774]">Korting ({inv.discount_pct}%)</dt>
                      <dd className="text-red-600">– {euro(Math.abs(inv.subtotal) / (1 - inv.discount_pct / 100) * inv.discount_pct / 100)}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <dt className="text-[#606774]">Subtotaal</dt>
                  <dd>{euro(Math.abs(inv.subtotal))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#606774]">BTW ({inv.vat_rate}%)</dt>
                  <dd>{euro(Math.abs(inv.vat_amount))}</dd>
                </div>
                <div className="flex justify-between border-t border-[#101536]/10 pt-2 text-base font-bold text-[#101536]">
                  <dt>{isCredit ? "Te ontvangen" : "Te betalen"}</dt>
                  <dd>{euro(Math.abs(inv.total))}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Opmerkingen</p>
              <p className="text-sm text-amber-900">{inv.notes}</p>
            </div>
          )}

          {/* Reminders */}
          {inv.reminders.length > 0 && (
            <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-[#101536]">Herinneringen verstuurd</p>
              <ul className="space-y-2">
                {inv.reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#606774]">{{ reminder_1: "1e herinnering", reminder_2: "2e herinnering", final: "Aanmaning" }[r.type] ?? r.type}</span>
                    <span className="text-[#606774]">{new Date(r.sent_at).toLocaleDateString("nl-NL")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-[#101536]">Acties</p>
            <InvoiceActions
              invoiceId={inv.id}
              status={inv.status}
              type={inv.type}
              invoiceNumber={inv.invoice_number}
              paymentUrl={inv.payment_url}
            />
          </div>

          {/* Credit reference */}
          {isCredit && inv.credit_of && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-1">Creditfactuur</p>
              <p className="text-amber-700">Dit is een creditfactuur voor</p>
              <Link href={`/admin/facturen/${inv.credit_of}`} className="font-semibold text-amber-800 hover:underline">
                originele factuur →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
