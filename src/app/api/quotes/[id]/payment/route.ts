import { NextRequest, NextResponse } from "next/server";
import { markPaymentReceived } from "@/lib/services/crm/quotes";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Geen toegang" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (profileError || profile?.role !== "admin" || !profile.company_id) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, client_id")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();
  if (quoteError || !quote) return NextResponse.json({ error: "Offerte niet gevonden" }, { status: 404 });

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", quote.client_id)
    .eq("company_id", profile.company_id)
    .single();
  if (clientError || !client) return NextResponse.json({ error: "Offerte niet gevonden" }, { status: 404 });

  try {
    const updated = await markPaymentReceived(id, profile.company_id, client.id);
    if (!updated) return NextResponse.json({ error: "Offerte is intussen gewijzigd" }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
