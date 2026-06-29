import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";
import { redirect } from "next/navigation";
import { getAppointmentFull } from "@/lib/services/planning/execution";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import InvoiceEditor from "./InvoiceEditor";

export const metadata: Metadata = { title: "Nieuwe factuur" };

export default async function NieuweFactuurPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string; quote?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getCompanyId();

  const { appointment: appointmentId, quote: quoteId } = await searchParams;

  const [clientsResult, servicesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, contact_name, company_name, address, city, payment_terms")
      .eq("company_id", companyId)
      .eq("active", true)
      .order("contact_name")
      .limit(500),
    supabase
      .from("services")
      .select("id, name, default_price, vat_rate")
      .eq("company_id", companyId)
      .eq("active", true)
      .order("sort_order"),
  ]);

  // Pre-fill from completed appointment
  let defaultClientId: string | undefined;
  let defaultItems: Array<{ description: string; quantity: number; unitPrice: number }> | undefined;

  if (appointmentId) {
    const appt = await getAppointmentFull(appointmentId);
    if (appt) {
      defaultClientId = appt.client.id;
      defaultItems = [
        {
          description: `Schoonmaakwerkzaamheden – ${new Date(appt.scheduled_date).toLocaleDateString("nl-NL")}`,
          quantity: 1,
          unitPrice: 0, // Admin fills in price
        },
      ];
    }
  }

  // Pre-fill from accepted quote
  if (quoteId && !defaultClientId) {
    const { data: q } = await supabase
      .from("quotes")
      .select("client_id, quote_items(description, quantity, unit_price)")
      .eq("id", quoteId)
      .single();

    if (q) {
      defaultClientId = q.client_id;
      defaultItems = (q.quote_items as Array<{ description: string; quantity: number; unit_price: number }>)
        .map((it) => ({ description: it.description, quantity: it.quantity, unitPrice: it.unit_price }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/facturen" className="mb-3 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Terug naar facturen
        </Link>
        <h1 className="text-2xl font-bold text-[#101536]">Nieuwe factuur</h1>
        {appointmentId && (
          <p className="mt-1 text-sm text-[#606774]">Gegenereerd vanuit afspraak</p>
        )}
        {quoteId && (
          <p className="mt-1 text-sm text-[#606774]">Gegenereerd vanuit offerte</p>
        )}
      </div>

      <InvoiceEditor
        clients={clientsResult.data ?? []}
        services={servicesResult.data ?? []}
        defaultClientId={defaultClientId}
        defaultAppointmentId={appointmentId}
        defaultItems={defaultItems}
      />
    </div>
  );
}
