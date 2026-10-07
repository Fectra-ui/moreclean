import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createQuote, sendQuote } from "@/lib/services/crm/quotes";
import { QuoteSendError } from "@/lib/services/crm/sendQuoteToClient";

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
      try {
        await sendQuote(quote.id, user.id);
      } catch (err) {
        return NextResponse.json({ id: quote.id,
          error: `De offerte is opgeslagen, maar verzending is niet bevestigd. ${err instanceof QuoteSendError ? err.message : "Controleer de verzendstatus."}` },
          { status: err instanceof QuoteSendError ? err.status : 500 });
      }
    }

    return NextResponse.json({ id: quote.id, quote_number: quote.quote_number });
  } catch (err) {
    console.error("Create quote error:", err);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
