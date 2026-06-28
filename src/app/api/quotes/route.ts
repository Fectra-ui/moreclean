import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createQuote, sendQuote } from "@/lib/services/crm/quotes";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { send, ...quoteData } = body;

    const quote = await createQuote({ ...quoteData, created_by: user.id });

    if (send) {
      await sendQuote(quote.id, user.id);
    }

    return NextResponse.json({ id: quote.id, quote_number: quote.quote_number });
  } catch (err) {
    console.error("Create quote error:", err);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
