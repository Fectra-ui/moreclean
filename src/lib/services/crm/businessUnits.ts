import { createClient } from "@/lib/supabase/server";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export const SCHOONMAAK_BU_ID = "c1000000-0000-0000-0000-000000000001";
export const MEDIA_BU_ID      = "c2000000-0000-0000-0000-000000000002";

export interface BusinessUnit {
  id: string;
  name: string;
  short_code: string;
  description: string | null;
  icon: string | null;
  primary_color: string;
  logo_path: string | null;
  email: string | null;
  phone: string | null;
  vat_text: string | null;
  payment_terms: number;
  active: boolean;
  sort_order: number;
}

export interface BuRevenue {
  business_unit_id: string;
  business_unit_name: string;
  icon: string | null;
  short_code: string;
  year: number;
  quarter: number | null;
  invoice_count: number;
  revenue: number;
  vat_collected: number;
  revenue_paid: number;
  costs: number;
  appointment_count: number;
}

export async function getBusinessUnits(includeInactive = false): Promise<BusinessUnit[]> {
  const supabase = await createClient();
  let q = supabase
    .from("business_units")
    .select("*")
    .eq("company_id", COMPANY_ID)
    .order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as BusinessUnit[];
}

export async function getBusinessUnitById(id: string): Promise<BusinessUnit | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_units")
    .select("*")
    .eq("id", id)
    .eq("company_id", COMPANY_ID)
    .single();
  return data as BusinessUnit | null;
}

export async function getBuRevenue(year: number, quarter?: number): Promise<BuRevenue[]> {
  const supabase = await createClient();
  let q = supabase
    .from("v_bu_revenue")
    .select("*")
    .eq("company_id", COMPANY_ID)
    .eq("year", year);
  if (quarter) q = q.eq("quarter", quarter);
  const { data } = await q;
  return (data ?? []) as BuRevenue[];
}

export async function updateBusinessUnit(
  id: string,
  patch: Partial<Pick<BusinessUnit, "name" | "description" | "email" | "phone" | "primary_color" | "vat_text" | "payment_terms" | "active">>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_units")
    .update(patch)
    .eq("id", id)
    .eq("company_id", COMPANY_ID);
  return { error: error?.message ?? null };
}

/** Geeft de BU-naam voor een factuurprefix: MC-2026-0001 */
export function formatInvoiceNumber(shortCode: string, year: number, seq: number): string {
  return `${shortCode}-${year}-${String(seq).padStart(4, "0")}`;
}

/** Geeft de BU-naam voor een offerteprefix: MC-OFF-2026-0001 */
export function formatQuoteNumber(shortCode: string, year: number, seq: number): string {
  return `${shortCode}-OFF-${year}-${String(seq).padStart(4, "0")}`;
}
