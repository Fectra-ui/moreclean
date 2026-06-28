import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getQuoteFull } from "@/lib/services/crm/quotes";
import QuoteDetailView from "./QuoteDetailView";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const q = await getQuoteFull(id);
  return { title: q ? `Offerte ${q.quote_number}` : "Offerte" };
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const quote = await getQuoteFull(id);
  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/offertes" className="mb-4 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Terug naar offertes
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#101536]">{quote.quote_number}</h1>
          <StatusBadge status={quote.status} />
        </div>
        <p className="mt-1 text-sm text-[#606774]">
          {(quote.clients as unknown as Record<string, string | null>).company_name || (quote.clients as unknown as Record<string, string | null>).contact_name}
          {" · "}
          {new Date(quote.created_at).toLocaleDateString("nl-NL")}
        </p>
      </div>

      <QuoteDetailView quote={quote as unknown as Parameters<typeof QuoteDetailView>[0]["quote"]} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-600",
    expired: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    draft: "Concept", sent: "Verzonden", accepted: "Geaccepteerd",
    rejected: "Afgewezen", expired: "Verlopen",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
