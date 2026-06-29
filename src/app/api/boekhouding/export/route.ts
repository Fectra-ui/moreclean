import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: rows } = await svc
    .from("quotes")
    .select("quote_number, created_at, accepted_at, payment_received_at, subtotal, vat_amount, total, discount_pct, clients(contact_name, company_name)")
    .eq("company_id", COMPANY_ID)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false });

  const header = ["Nummer", "Klant", "Datum akkoord", "Betaaldatum", "Excl. BTW", "BTW", "Totaal", "Korting %"];
  const fmt = (n: number) => n.toFixed(2).replace(".", ",");
  const d = (s: string | null) => s ? new Date(s).toLocaleDateString("nl-NL") : "";

  interface Row {
    quote_number: string;
    accepted_at: string | null;
    payment_received_at: string | null;
    subtotal: number;
    vat_amount: number;
    total: number;
    discount_pct: number;
    clients: { contact_name: string; company_name: string | null } | null;
  }

  const lines = (rows as unknown as Row[] ?? []).map((q) => {
    const klant = q.clients?.company_name ?? q.clients?.contact_name ?? "";
    return [
      q.quote_number,
      klant,
      d(q.accepted_at),
      d(q.payment_received_at),
      fmt(q.subtotal),
      fmt(q.vat_amount),
      fmt(q.total),
      String(q.discount_pct ?? 0),
    ].join(";");
  });

  const csv = [header.join(";"), ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="boekhouding-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
