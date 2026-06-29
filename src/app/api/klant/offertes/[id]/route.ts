import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();

  // Verify this quote belongs to a client linked to this user
  const { data: client } = await svc.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: quote, error } = await svc
    .from("quotes")
    .select("id, quote_number, status, workflow_state, subject, intro_text, notes, valid_until, accepted_at, subtotal, discount_pct, vat_amount, total, created_at, payment_received_at, quote_items(id, description, quantity, unit_price, total_price, sort_order)")
    .eq("id", id)
    .eq("client_id", client.id)
    .single();

  if (error || !quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quote);
}
