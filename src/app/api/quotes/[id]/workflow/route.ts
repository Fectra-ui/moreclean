import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transitionQuote, type WorkflowState } from "@/lib/services/workflow/quoteWorkflow";
import { canTransition } from "@/lib/services/workflow/quoteWorkflowTypes";
import { QuoteSendError, sendQuoteToClient } from "@/lib/services/crm/sendQuoteToClient";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const to = body.to as WorkflowState | undefined;
  if (!to) return NextResponse.json({ error: "Missing 'to' state" }, { status: 400 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.company_id || !["admin", "customer"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read through the caller's RLS policies before allowing a service-role mutation.
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, company_id, client_id, workflow_state")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();
  if (quoteError || !quote) return NextResponse.json({ error: "Offerte niet gevonden" }, { status: 404 });

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, profile_id")
    .eq("id", quote.client_id)
    .eq("company_id", profile.company_id)
    .single();
  if (clientError || !client || (profile.role === "customer" && client.profile_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (to === "verzonden") {
    if (profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    try {
      await sendQuoteToClient(id);
      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json({ error: error instanceof QuoteSendError ? error.message : "Verzenden mislukt." },
        { status: error instanceof QuoteSendError ? error.status : 500 });
    }
  }

  const from = (quote.workflow_state ?? "concept") as WorkflowState;
  if (!canTransition(from, to)) {
    return NextResponse.json({ error: "Transitie niet toegestaan" }, { status: 422 });
  }
  if (profile.role === "customer" && !(
    (from === "verzonden" && (to === "akkoord" || to === "afgewezen")) ||
    (from === "akkoord" && to === "wacht_betaling")
  )) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await transitionQuote(id, to, user.id, profile.company_id, quote.client_id);
  if (error) return NextResponse.json({ error }, { status: 422 });

  return NextResponse.json({ ok: true });
}
