import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { publish } from "@/lib/events";

// Mollie calls this endpoint when a payment status changes.
// We verify the payment status via the Mollie API (never trust the webhook body alone).

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const paymentId = body.get("id") as string | null;

  if (!paymentId) return NextResponse.json({ error: "Missing payment id" }, { status: 400 });

  // Verify with Mollie API
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!mollieRes.ok) return NextResponse.json({ error: "Mollie fetch failed" }, { status: 502 });

  const payment = await mollieRes.json() as {
    id: string;
    status: string;
    metadata: { invoiceId: string; invoiceNumber: string };
    amount: { value: string };
  };

  if (payment.status !== "paid") {
    // Not paid yet — acknowledge and do nothing
    return NextResponse.json({ ok: true });
  }

  const { invoiceId, invoiceNumber } = payment.metadata;
  if (!invoiceId) return NextResponse.json({ error: "Missing invoice metadata" }, { status: 400 });

  const supabase = createServiceClient();

  // Check idempotency — don't process twice
  const { data: existing } = await supabase
    .from("invoices")
    .select("status, client_id, total")
    .eq("id", invoiceId)
    .single();

  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (existing.status === "paid") return NextResponse.json({ ok: true }); // already processed

  const paidAt = new Date().toISOString();
  await supabase.from("invoices").update({ status: "paid", paid_at: paidAt }).eq("id", invoiceId);

  // Fetch client name
  const { data: client } = await supabase
    .from("clients")
    .select("contact_name, company_name, company_id")
    .eq("id", existing.client_id)
    .single();

  const companyId = (client as Record<string, string | null> | null)?.company_id ?? "";
  const clientName = (client as Record<string, string | null> | null)?.company_name
    ?? (client as Record<string, string | null> | null)?.contact_name
    ?? "Klant";

  await publish({
    type: "invoice.paid" as const,
    aggregateType: "invoice",
    aggregateId: invoiceId,
    companyId,
    payload: {
      invoiceId,
      invoiceNumber,
      clientId: existing.client_id,
      clientName,
      clientEmail: "",
      total: Number(existing.total),
      paidAt,
    },
  });

  return NextResponse.json({ ok: true });
}
