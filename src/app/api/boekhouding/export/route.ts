import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = await getCompanyId();
  const svc = createServiceClient();

  const { data: rows } = await svc
    .from("quotes")
    .select(`
      quote_number,
      created_at,
      accepted_at,
      payment_received_at,
      work_completed_at,
      subtotal,
      vat_amount,
      total,
      discount_pct,
      payment_reference,
      workflow_state,
      clients (contact_name, company_name),
      invoices (invoice_number),
      business_units (name)
    `)
    .eq("company_id", companyId)
    .in("workflow_state", ["wacht_betaling", "betaald", "planning", "uitvoering", "uitgevoerd", "gefactureerd", "factuur_betaald"])
    .order("accepted_at", { ascending: false });

  const header = [
    "Offertenummer",
    "Klant",
    "Factuurnummer",
    "Referentie",
    "Datum akkoord",
    "Datum betaling",
    "Datum uitvoering",
    "Status",
    "Excl. BTW",
    "BTW",
    "Incl. BTW",
    "Korting %",
    "Bedrijfsunit",
  ];

  const fmt = (n: number | null | undefined) =>
    n != null ? n.toFixed(2).replace(".", ",") : "";
  const d = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleDateString("nl-NL") : "";

  interface Row {
    quote_number: string;
    created_at: string;
    accepted_at: string | null;
    payment_received_at: string | null;
    work_completed_at: string | null;
    subtotal: number;
    vat_amount: number;
    total: number;
    discount_pct: number;
    payment_reference: string | null;
    workflow_state: string;
    clients: { contact_name: string; company_name: string | null } | null;
    invoices: { invoice_number: string } | null;
    business_units: { name: string } | null;
  }

  const STATE_LABELS: Record<string, string> = {
    wacht_betaling:  "Wacht op betaling",
    betaald:         "Betaald — wacht op planning",
    planning:        "Ingepland",
    uitvoering:      "In uitvoering",
    uitgevoerd:      "Uitgevoerd",
    gefactureerd:    "Factuur verstuurd",
    factuur_betaald: "Factuur betaald",
  };

  const lines = (rows as unknown as Row[] ?? []).map((q) => {
    const klant = q.clients?.company_name ?? q.clients?.contact_name ?? "";
    const factuur = q.invoices?.invoice_number ?? "";
    const unit = q.business_units?.name ?? "";
    const ref = q.payment_reference ?? q.quote_number;

    return [
      q.quote_number,
      klant,
      factuur,
      ref,
      d(q.accepted_at),
      d(q.payment_received_at),
      d(q.work_completed_at),
      STATE_LABELS[q.workflow_state] ?? q.workflow_state,
      fmt(q.subtotal),
      fmt(q.vat_amount),
      fmt(q.total),
      String(q.discount_pct ?? 0),
      unit,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
  });

  const bom = "﻿"; // UTF-8 BOM for Excel
  const csv = bom + [header.map((h) => `"${h}"`).join(";"), ...lines].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="boekhouding-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
