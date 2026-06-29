import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";

export interface CompanySettings {
  id: string;
  name: string;
  kvk: string | null;
  vat_number: string | null;
  logo_path: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  iban: string | null;
  boekhouder_email: string | null;
  primary_color: string;
  site_url: string | null;
}

export type CompanyPatch = Partial<Omit<CompanySettings, "id">>;

const ALLOWED_FIELDS: (keyof CompanyPatch)[] = [
  "name", "kvk", "vat_number", "address", "postal_code", "city",
  "phone", "email", "iban", "boekhouder_email", "primary_color", "site_url",
];

export async function getCompany(): Promise<CompanySettings | null> {
  const companyId = await getCompanyId();
  const svc = createServiceClient();
  const { data } = await svc
    .from("companies")
    .select("id,name,kvk,vat_number,logo_path,address,postal_code,city,phone,email,iban,boekhouder_email,primary_color,site_url")
    .eq("id", companyId)
    .single();
  return data as CompanySettings | null;
}

export async function updateCompany(patch: CompanyPatch): Promise<{ error: string | null }> {
  const companyId = await getCompanyId();
  const safe = Object.fromEntries(
    Object.entries(patch).filter(([k]) => ALLOWED_FIELDS.includes(k as keyof CompanyPatch))
  );
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("companies")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", companyId);
  return { error: error?.message ?? null };
}
