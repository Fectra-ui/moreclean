import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createQuote, sendQuote } from "@/lib/services/crm/quotes";
import { QuoteSendError } from "@/lib/services/crm/sendQuoteToClient";
import type { RawQuoteCreate } from "@/lib/services/crm/quoteCreateIntent";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role, company_id, active").eq("id", user.id).single();
  if (profileError || profile?.role !== "admin" || !profile.active || !profile.company_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Ongeldige offertegegevens." }, { status: 400 });
    }
    const { send, ...quoteData } = body as RawQuoteCreate & { send?: boolean };

    const quote = await createQuote(quoteData, user.id);

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
    const message = err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message : "";
    if (message.includes("Quote create conflict")
      || message.includes("Quote create intent has no quote")) {
      return NextResponse.json({ error: "Deze offerteaanvraag is al met andere gegevens verwerkt. Controleer de bestaande offerte." }, { status: 409 });
    }
    if (message.includes("Ongeldige") || message.includes("Invalid quote create request")
      || message.includes("Client is not available") || message.includes("Service is not available")) {
      return NextResponse.json({ error: "Ongeldige offertegegevens." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
