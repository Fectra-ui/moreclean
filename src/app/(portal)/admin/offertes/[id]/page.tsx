import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getQuoteFull } from "@/lib/services/crm/quotes";
import QuoteDetailView from "./QuoteDetailView";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { WorkflowState } from "@/lib/services/workflow/quoteWorkflowTypes";
import { WORKFLOW_STEPS } from "@/lib/services/workflow/quoteWorkflowTypes";

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

  const q = quote as unknown as Record<string, unknown>;
  const state = (q.workflow_state ?? "concept") as WorkflowState;
  const stepDef = WORKFLOW_STEPS.find((s) => s.key === state);
  const client = q.clients as Record<string, string | null>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/offertes" className="mb-4 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Terug naar offertes
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#101536]">{quote.quote_number}</h1>
          <WorkflowBadge state={state} label={stepDef?.label ?? state} />
        </div>
        <p className="mt-1 text-sm text-[#606774]">
          {client.company_name || client.contact_name}
          {" · "}
          {new Date(quote.created_at).toLocaleDateString("nl-NL")}
        </p>
      </div>

      <QuoteDetailView quote={quote as unknown as Parameters<typeof QuoteDetailView>[0]["quote"]} />
    </div>
  );
}

function WorkflowBadge({ state, label }: { state: WorkflowState; label: string }) {
  const colors: Partial<Record<WorkflowState, string>> = {
    concept:         "bg-gray-100 text-gray-600",
    verzonden:       "bg-blue-100 text-blue-700",
    akkoord:         "bg-emerald-100 text-emerald-700",
    wacht_betaling:  "bg-amber-100 text-amber-700",
    betaald:         "bg-emerald-100 text-emerald-700",
    planning:        "bg-[#4D7EBA]/10 text-[#4D7EBA]",
    uitvoering:      "bg-violet-100 text-violet-700",
    uitgevoerd:      "bg-emerald-100 text-emerald-700",
    gefactureerd:    "bg-blue-100 text-blue-700",
    factuur_betaald: "bg-emerald-200 text-emerald-800",
    afgewezen:       "bg-red-100 text-red-600",
    verlopen:        "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${colors[state] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}
