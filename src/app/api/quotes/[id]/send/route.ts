import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendQuote } from "@/lib/services/crm/quotes";
import { QuoteSendError } from "@/lib/services/crm/sendQuoteToClient";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await sendQuote(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof QuoteSendError ? e.message : "Verzenden mislukt." },
      { status: e instanceof QuoteSendError ? e.status : 500 });
  }
}
