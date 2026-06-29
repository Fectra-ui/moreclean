import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Quote, QuoteWithItems, QuoteItem, Client } from "@/types/database";
import { sendNotification } from "@/lib/services/notifications";

export const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

// ── READ ───────────────────────────────────────────────────

export async function getQuotesList(
  companyId: string,
  status?: Quote["status"]
): Promise<(QuoteWithItems & { client_name: string })[]> {
  const supabase = await createClient();
  let q = supabase
    .from("quotes")
    .select(`
      *,
      quote_items (*),
      clients (id, contact_name, company_name, email)
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return [];

  return (data ?? []).map((q) => ({
    ...(q as unknown as QuoteWithItems),
    client_name: ((q.clients as Record<string, string | null>)?.company_name || (q.clients as Record<string, string | null>)?.contact_name) ?? "Onbekend",
  }));
}

export async function getQuoteFull(id: string): Promise<(Quote & {
  quote_items: QuoteItem[];
  clients: Client;
}) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(`*, quote_items (*, services (*)), clients (*)`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as Quote & { quote_items: QuoteItem[]; clients: Client };
}

// ── CREATE / UPDATE ────────────────────────────────────────

export interface QuoteLineItem {
  service_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order?: number;
}

export interface CreateQuotePayload {
  client_id: string;
  subject?: string;
  intro_text?: string;
  notes?: string;
  internal_notes?: string;
  valid_until?: string;
  discount_pct?: number;
  vat_rate?: number;
  items: QuoteLineItem[];
  created_by: string;
}

export async function createQuote(payload: CreateQuotePayload): Promise<Quote> {
  const supabase = await createClient();
  const svc = createServiceClient();

  // Generate quote number
  const { data: numData } = await svc.rpc("generate_quote_number", { company: COMPANY_ID });
  const quoteNumber = numData as string;

  // Calculate totals
  const { subtotal, vat_amount, total } = calcTotals(payload.items, payload.discount_pct ?? 0, payload.vat_rate ?? 21);

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      company_id: COMPANY_ID,
      client_id: payload.client_id,
      quote_number: quoteNumber,
      status: "draft",
      subject: payload.subject || null,
      intro_text: payload.intro_text || null,
      notes: payload.notes || null,
      internal_notes: payload.internal_notes || null,
      valid_until: payload.valid_until || null,
      discount_pct: payload.discount_pct ?? 0,
      vat_amount,
      subtotal,
      total,
      created_by: payload.created_by,
    })
    .select()
    .single();

  if (error) throw error;

  // Insert line items
  if (payload.items.length > 0) {
    const { error: itemsError } = await supabase.from("quote_items").insert(
      payload.items.map((item, i) => ({
        quote_id: quote.id,
        service_id: item.service_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        sort_order: item.sort_order ?? i,
      }))
    );
    if (itemsError) throw itemsError;
  }

  return quote as unknown as Quote;
}

export async function updateQuoteTotals(quoteId: string, items: QuoteLineItem[], discountPct = 0, vatRate = 21) {
  const supabase = await createClient();
  const { subtotal, vat_amount, total } = calcTotals(items, discountPct, vatRate);

  // Replace all items
  await supabase.from("quote_items").delete().eq("quote_id", quoteId);
  if (items.length > 0) {
    await supabase.from("quote_items").insert(
      items.map((item, i) => ({
        quote_id: quoteId,
        service_id: item.service_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        sort_order: i,
      }))
    );
  }

  const { error } = await supabase
    .from("quotes")
    .update({ subtotal, vat_amount, total, discount_pct: discountPct })
    .eq("id", quoteId);
  if (error) throw error;
}

// ── WORKFLOW ───────────────────────────────────────────────

export async function sendQuote(quoteId: string, sentBy: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw error;
}

export async function acceptQuote(quoteId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw error;

  // Trigger auto-workflow
  await runQuoteAcceptedWorkflow(quoteId);
}

export async function markPaymentReceived(quoteId: string): Promise<void> {
  const svc = createServiceClient();
  const { error } = await svc
    .from("quotes")
    .update({ payment_received_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw error;

  // Log in activity_log
  await svc.from("activity_log").insert({
    entity_type: "quote",
    entity_id: quoteId,
    action: "payment_received",
    metadata: {},
  });
}

export async function rejectQuote(quoteId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: "rejected", rejected_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw error;
}

// ── AUTO-WORKFLOW: quote accepted ──────────────────────────

async function runQuoteAcceptedWorkflow(quoteId: string) {
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(`*, clients (*, profile_id), companies (*)`)
    .eq("id", quoteId)
    .single();

  if (!quote) return;

  const client = quote.clients as Record<string, unknown>;

  // 1. Create maintenance schedule if not yet exists (based on first quote item)
  const { data: existingSchedule } = await supabase
    .from("maintenance_schedules")
    .select("id")
    .eq("client_id", client.id as string)
    .eq("active", true)
    .maybeSingle();

  if (!existingSchedule) {
    await supabase.from("maintenance_schedules").insert({
      client_id: client.id as string,
      service_id: (await supabase.from("quote_items").select("service_id").eq("quote_id", quoteId).not("service_id", "is", null).limit(1).single()).data?.service_id,
      frequency_weeks: 6,
      next_due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      active: true,
    });
  }

  // 2. Send internal notification to admins
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("company_id", COMPANY_ID);

  for (const admin of admins ?? []) {
    await sendNotification(
      admin.id,
      "quote_accepted",
      `Offerte geaccepteerd`,
      `${(client.company_name || client.contact_name) as string} heeft een offerte geaccepteerd.`,
      `/admin/offertes/${quoteId}`
    );
  }

  // 3. Log in activity_log
  await supabase.from("activity_log").insert({
    entity_type: "quote",
    entity_id: quoteId,
    action: "accepted",
    metadata: { client_id: client.id, automated_workflow: true },
  });
}

// ── HELPERS ────────────────────────────────────────────────

function calcTotals(items: QuoteLineItem[], discountPct: number, vatRate: number) {
  const gross = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const subtotal = gross * (1 - discountPct / 100);
  const vat_amount = subtotal * (vatRate / 100);
  const total = subtotal + vat_amount;
  return { subtotal, vat_amount, total };
}

export { calcTotals };
