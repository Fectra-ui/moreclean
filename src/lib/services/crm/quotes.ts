import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Quote, QuoteWithItems, QuoteItem, Client } from "@/types/database";
import { sendNotification } from "@/lib/services/notifications";
import { getCompanyId } from "@/lib/auth/getCompanyId";
import { sendQuoteToClient } from "@/lib/services/crm/sendQuoteToClient";
import { canonicalQuoteCreate, type RawQuoteCreate } from "@/lib/services/crm/quoteCreateIntent";

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
    .select(`*, workflow_state, planned_at, work_started_at, work_completed_at, payment_received_at, quote_items (*, services (*)), clients (*)`)
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

export async function createQuote(payload: RawQuoteCreate, actorId: string): Promise<Pick<Quote, "id" | "quote_number">> {
  const companyId = await getCompanyId();
  const svc = createServiceClient();
  const { intent, hash } = canonicalQuoteCreate(payload, actorId, companyId);
  const { data: quote, error } = await svc.rpc("create_quote_atomic", {
    p_quote_id: intent.quote_id,
    p_actor_id: actorId,
    p_intent: intent,
    p_request_hash: hash,
  }).single();
  if (error) throw error;
  const result = quote as Pick<Quote, "id" | "quote_number"> | null;
  if (!result?.id || !result.quote_number) throw new Error("Offerte-aanmaak is niet bevestigd.");
  return result;
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
  // Keep the legacy service entrypoint, but never perform an independent status write.
  void sentBy;
  await sendQuoteToClient(quoteId);
}

export async function acceptQuote(quoteId: string, companyId: string, clientId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: updated, error } = await supabase
    .from("quotes")
    .update({ status: "accepted", workflow_state: "akkoord", accepted_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("status", "sent")
    .eq("workflow_state", "verzonden")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updated) return false;

  // Trigger auto-workflow
  await runQuoteAcceptedWorkflow(quoteId);
  return true;
}

export async function markPaymentReceived(quoteId: string, companyId: string, clientId: string): Promise<boolean> {
  const svc = createServiceClient();
  const { data: updated, error } = await svc
    .from("quotes")
    .update({ payment_received_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updated) return false;

  // Log in activity_log
  await svc.from("activity_log").insert({
    entity_type: "quote",
    entity_id: quoteId,
    action: "payment_received",
    metadata: {},
  });
  return true;
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
  const companyId = await getCompanyId();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("company_id", companyId);

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
