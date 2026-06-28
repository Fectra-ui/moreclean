import { createClient, createServiceClient } from "@/lib/supabase/server";
import { publish } from "@/lib/events";
import type { InvoiceCreatedPayload, InvoiceSentPayload, InvoicePaidPayload } from "@/lib/events/types";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: string;
  type: string;
  issue_date: string;
  due_date: string;
  total: number;
  paid_at: string | null;
  client_name: string;
  days_overdue: number | null;
}

export interface InvoiceFull {
  id: string;
  invoice_number: string;
  status: string;
  type: string;
  issue_date: string;
  due_date: string;
  sent_at: string | null;
  paid_at: string | null;
  subtotal: number;
  discount_pct: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  mollie_payment_id: string | null;
  payment_url: string | null;
  notes: string | null;
  credit_of: string | null;
  client: { id: string; contact_name: string; company_name: string | null; email: string | null; address: string | null; postal_code: string | null; city: string | null; vat_number: string | null };
  items: Array<{ id: string; description: string; quantity: number; unit_price: number; total_price: number; sort_order: number }>;
  reminders: Array<{ id: string; type: string; sent_at: string }>;
}

// ---- Queries ----

export async function getInvoiceList(status?: string): Promise<InvoiceListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("id, invoice_number, status, type, issue_date, due_date, total, paid_at, clients(contact_name, company_name)")
    .eq("company_id", COMPANY_ID)
    .order("issue_date", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []).map((inv) => {
    const c = inv.clients as unknown as { contact_name: string; company_name: string | null } | null;
    const overdue = inv.status === "overdue" || (inv.status === "sent" && new Date(inv.due_date) < new Date());
    const daysOverdue = overdue ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000) : null;
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      status: inv.status,
      type: (inv as Record<string, unknown>).type as string ?? "invoice",
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      total: Number(inv.total),
      paid_at: inv.paid_at,
      client_name: c?.company_name ?? c?.contact_name ?? "Onbekend",
      days_overdue: daysOverdue,
    };
  });
}

export async function getInvoiceFull(id: string): Promise<InvoiceFull | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(`
      id, invoice_number, status, type, issue_date, due_date,
      sent_at, paid_at, subtotal, discount_pct, vat_rate,
      vat_amount, total, mollie_payment_id, payment_url, notes, credit_of,
      clients (id, contact_name, company_name, email, address, postal_code, city, vat_number),
      invoice_items (id, description, quantity, unit_price, total_price, sort_order),
      invoice_reminders (id, type, sent_at)
    `)
    .eq("id", id)
    .single();

  if (!data) return null;

  return {
    ...data,
    type: (data as Record<string, unknown>).type as string ?? "invoice",
    total: Number(data.total),
    subtotal: Number(data.subtotal),
    discount_pct: Number(data.discount_pct),
    vat_rate: Number(data.vat_rate),
    vat_amount: Number(data.vat_amount),
    client: data.clients as unknown as InvoiceFull["client"],
    items: ((data.invoice_items ?? []) as unknown as InvoiceFull["items"]).sort((a, b) => a.sort_order - b.sort_order),
    reminders: (data.invoice_reminders ?? []) as unknown as InvoiceFull["reminders"],
  };
}

// ---- Create ----

export interface CreateInvoiceInput {
  clientId: string;
  appointmentId?: string;
  quoteId?: string;
  issueDate: string;
  dueDate: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; serviceId?: string }>;
  notes?: string;
  vatRate?: number;
  discountPct?: number;
  actorId: string;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const svc = createServiceClient();

  const vatRate = input.vatRate ?? 21;
  const discountPct = input.discountPct ?? 0;
  const subtotalRaw = input.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const subtotal = subtotalRaw * (1 - discountPct / 100);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  // Generate invoice number via service role
  const { data: numData } = await svc.rpc("generate_invoice_number", { company: COMPANY_ID });
  const invoiceNumber = (numData as string) ?? `MC-${new Date().getFullYear()}-0001`;

  const { data: inv, error } = await supabase.from("invoices").insert({
    company_id: COMPANY_ID,
    client_id: input.clientId,
    appointment_id: input.appointmentId ?? null,
    quote_id: input.quoteId ?? null,
    invoice_number: invoiceNumber,
    status: "draft",
    type: "invoice",
    issue_date: input.issueDate,
    due_date: input.dueDate,
    subtotal,
    discount_pct: discountPct,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total,
    notes: input.notes ?? null,
    created_by: input.actorId,
  }).select("id").single();

  if (error || !inv) return { id: null, error: error?.message ?? "Onbekende fout" };

  await supabase.from("invoice_items").insert(
    input.items.map((it, i) => ({
      invoice_id: inv.id,
      service_id: it.serviceId ?? null,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      total_price: it.quantity * it.unitPrice,
      sort_order: i,
    }))
  );

  // Fetch client name for event
  const { data: client } = await supabase.from("clients").select("contact_name, company_name").eq("id", input.clientId).single();
  const clientName = (client as { contact_name: string; company_name: string | null } | null)?.company_name
    ?? (client as { contact_name: string; company_name: string | null } | null)?.contact_name
    ?? "Klant";

  await publish({
    type: "invoice.created" as const,
    aggregateType: "invoice",
    aggregateId: inv.id,
    companyId: COMPANY_ID,
    actorId: input.actorId,
    payload: { invoiceId: inv.id, invoiceNumber, clientId: input.clientId, clientName, clientEmail: "", total, dueDate: input.dueDate },
  });

  return { id: inv.id, error: null };
}

// ---- Send ----

export async function sendInvoice(id: string, actorId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const inv = await getInvoiceFull(id);
  if (!inv) return { error: "Factuur niet gevonden" };

  // Generate Mollie payment link
  let paymentUrl: string | null = null;
  let molliePaymentId: string | null = null;
  try {
    const mollie = await createMolliePayment(inv);
    paymentUrl = mollie.checkoutUrl;
    molliePaymentId = mollie.id;
  } catch (err) {
    console.warn("[invoice] Mollie payment creation failed:", err);
  }

  const { error } = await supabase.from("invoices").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    payment_url: paymentUrl,
    mollie_payment_id: molliePaymentId,
  }).eq("id", id);

  if (error) return { error: error.message };

  await publish({
    type: "invoice.sent" as const,
    aggregateType: "invoice",
    aggregateId: id,
    companyId: COMPANY_ID,
    actorId,
    payload: {
      invoiceId: id,
      invoiceNumber: inv.invoice_number,
      clientId: inv.client.id,
      clientName: inv.client.company_name ?? inv.client.contact_name,
      clientEmail: inv.client.email ?? "",
      total: inv.total,
      dueDate: inv.due_date,
      paymentUrl,
    },
  });

  return { error: null };
}

// ---- Mark paid (manual) ----

export async function markInvoicePaid(id: string, actorId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const inv = await getInvoiceFull(id);
  if (!inv) return { error: "Factuur niet gevonden" };

  const paidAt = new Date().toISOString();
  const { error } = await supabase.from("invoices").update({ status: "paid", paid_at: paidAt }).eq("id", id);
  if (error) return { error: error.message };

  await publish({
    type: "invoice.paid" as const,
    aggregateType: "invoice",
    aggregateId: id,
    companyId: COMPANY_ID,
    actorId,
    payload: {
      invoiceId: id,
      invoiceNumber: inv.invoice_number,
      clientId: inv.client.id,
      clientName: inv.client.company_name ?? inv.client.contact_name,
      clientEmail: inv.client.email ?? "",
      total: inv.total,
      paidAt,
    },
  });

  return { error: null };
}

// ---- Credit invoice ----

export async function createCreditInvoice(originalId: string, actorId: string): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const svc = createServiceClient();

  const original = await getInvoiceFull(originalId);
  if (!original) return { id: null, error: "Originele factuur niet gevonden" };

  const { data: numData } = await svc.rpc("generate_invoice_number", { company: COMPANY_ID });
  const invoiceNumber = (numData as string) ?? `MC-CREDIT-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  const { data: credit, error } = await supabase.from("invoices").insert({
    company_id: COMPANY_ID,
    client_id: original.client.id,
    invoice_number: invoiceNumber,
    status: "draft",
    type: "credit",
    credit_of: originalId,
    issue_date: today,
    due_date: today,
    subtotal: -original.subtotal,
    discount_pct: original.discount_pct,
    vat_rate: original.vat_rate,
    vat_amount: -original.vat_amount,
    total: -original.total,
    notes: `Creditfactuur voor ${original.invoice_number}`,
    created_by: actorId,
  }).select("id").single();

  if (error || !credit) return { id: null, error: error?.message ?? "Fout" };

  await supabase.from("invoice_items").insert(
    original.items.map((it) => ({
      invoice_id: credit.id,
      description: it.description,
      quantity: -it.quantity,
      unit_price: it.unit_price,
      total_price: -it.total_price,
      sort_order: it.sort_order,
    }))
  );

  await publish({
    type: "invoice.credit_created" as const,
    aggregateType: "invoice" as const,
    aggregateId: credit.id,
    companyId: COMPANY_ID,
    actorId,
    payload: {
      invoiceId: credit.id,
      invoiceNumber,
      originalInvoiceId: originalId,
      clientId: original.client.id,
      clientName: original.client.company_name ?? original.client.contact_name,
      total: Math.abs(original.total),
    },
  });

  return { id: credit.id, error: null };
}

// ---- Mollie integration ----

async function createMolliePayment(inv: InvoiceFull): Promise<{ id: string; checkoutUrl: string }> {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) throw new Error("MOLLIE_API_KEY not set");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://moreclean.nl";

  const res = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: { currency: "EUR", value: inv.total.toFixed(2) },
      description: `Factuur ${inv.invoice_number} – More Clean`,
      redirectUrl: `${siteUrl}/klant/facturen/${inv.id}?paid=1`,
      webhookUrl: `${siteUrl}/api/webhooks/mollie`,
      metadata: { invoiceId: inv.id, invoiceNumber: inv.invoice_number },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Mollie error: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as { id: string; _links: { checkout: { href: string } } };
  return { id: data.id, checkoutUrl: data._links.checkout.href };
}
