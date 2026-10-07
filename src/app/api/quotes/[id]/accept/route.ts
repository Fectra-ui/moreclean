import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptQuote } from "@/lib/services/crm/quotes";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.company_id || !["admin", "customer"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, company_id, client_id, status, workflow_state")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();
  if (quoteError || !quote) return NextResponse.json({ error: "Offerte niet gevonden" }, { status: 404 });
  if (quote.status !== "sent" || quote.workflow_state !== "verzonden") {
    return NextResponse.json({ error: "Offerte kan niet worden geaccepteerd" }, { status: 422 });
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, profile_id")
    .eq("id", quote.client_id)
    .eq("company_id", profile.company_id)
    .single();
  if (clientError || !client || (profile.role === "customer" && client.profile_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await acceptQuote(id, profile.company_id, quote.client_id);
    if (!updated) return NextResponse.json({ error: "Offerte is intussen gewijzigd" }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
