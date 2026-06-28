import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuoteEditor from "./QuoteEditor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Nieuwe offerte" };

export default async function NieuweOffertePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;

  // Fetch clients for selector
  const { data: clients } = await supabase
    .from("clients")
    .select("id, contact_name, company_name, email, phone, address, postal_code, city, vat_number")
    .eq("active", true)
    .order("contact_name");

  // Fetch services for line items
  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, default_price, unit")
    .eq("active", true)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/offertes" className="mb-4 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Terug naar offertes
        </Link>
        <h1 className="text-2xl font-bold text-[#101536]">Nieuwe offerte</h1>
      </div>

      <QuoteEditor
        clients={(clients ?? []) as Parameters<typeof QuoteEditor>[0]["clients"]}
        services={(services ?? []) as Parameters<typeof QuoteEditor>[0]["services"]}
        defaultClientId={sp.client}
        userId={user.id}
      />
    </div>
  );
}
