import { createClient } from "@/lib/supabase/server";
import type { Quote, QuoteWithItems } from "@/types/database";

export async function getQuotes(
  companyId: string,
  status?: Quote["status"]
): Promise<QuoteWithItems[]> {
  const supabase = await createClient();
  let query = supabase
    .from("quotes")
    .select(`*, clients (contact_name, company_name, email), quote_items (*)`)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as QuoteWithItems[];
}

export async function getQuoteById(id: string): Promise<QuoteWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(`*, clients (*), quote_items (*, services (*))`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as QuoteWithItems;
}

export async function updateQuoteStatus(
  id: string,
  status: Quote["status"]
): Promise<void> {
  const supabase = await createClient();
  const updates: Partial<Quote> = { status };
  if (status === "accepted") updates.accepted_at = new Date().toISOString();
  if (status === "rejected") updates.rejected_at = new Date().toISOString();
  if (status === "sent") updates.sent_at = new Date().toISOString();

  const { error } = await supabase
    .from("quotes")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function calculateQuoteTotals(items: {
  quantity: number;
  unit_price: number;
}[], discountPct = 0, vatRate = 21) {
  const subtotalBeforeDiscount = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountAmount = subtotalBeforeDiscount * (discountPct / 100);
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  return { subtotal, vat_amount: vatAmount, total };
}
