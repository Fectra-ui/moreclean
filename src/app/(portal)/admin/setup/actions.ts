"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCompanyId } from "@/lib/auth/getCompanyId";
import { redirect } from "next/navigation";
import type { ServiceTemplate } from "@/lib/data/service-templates";
import type { SetupStepKey } from "@/lib/services/setup";

// ── Progress ───────────────────────────────────────────────────

export async function markStepComplete(step: SetupStepKey): Promise<void> {
  await requireAdmin();
  const companyId = await getCompanyId();
  const svc = createServiceClient();

  try {
    await svc.from("setup_state").upsert({ company_id: companyId, step, completed_at: new Date().toISOString() });
  } catch {
    // Never crash the wizard over progress tracking
  }
}

export async function completeSetup(): Promise<void> {
  await requireAdmin();
  const companyId = await getCompanyId();
  const svc = createServiceClient();
  await svc
    .from("companies")
    .upsert({ id: companyId, setup_completed_at: new Date().toISOString() });
  redirect("/admin");
}

// ── Step actions ───────────────────────────────────────────────

export async function saveCompanyInfo(formData: FormData): Promise<{ error: string | null }> {
  await requireAdmin();
  const companyId = await getCompanyId();
  const svc = createServiceClient();

  const patch: Record<string, string | null> = {
    name: (formData.get("name") as string) || null,
    kvk: (formData.get("kvk") as string) || null,
    vat_number: (formData.get("vat_number") as string) || null,
    address: (formData.get("address") as string) || null,
    postal_code: (formData.get("postal_code") as string) || null,
    city: (formData.get("city") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    site_url: (formData.get("site_url") as string) || null,
    iban: (formData.get("iban") as string) || null,
    boekhouder_email: (formData.get("boekhouder_email") as string) || null,
  };

  const { error } = await svc
    .from("companies")
    .upsert({ id: companyId, ...patch, updated_at: new Date().toISOString() })
    .eq("id", companyId);

  if (error) return { error: error.message };

  // Link admin profile to company if not already linked
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await svc.from("profiles").update({ company_id: companyId }).eq("id", user.id).is("company_id", null);
  }

  await markStepComplete("company");
  return { error: null };
}

export async function importServices(services: ServiceTemplate[]): Promise<{ error: string | null }> {
  await requireAdmin();
  const companyId = await getCompanyId();
  const svc = createServiceClient();

  const rows = services.map((s) => ({
    company_id: companyId,
    name: s.name,
    description: s.description,
    category: s.category,
    unit: s.unit,
    default_price: s.default_price,
    vat_rate: s.vat_rate,
    sort_order: s.sort_order,
    active: true,
  }));

  const { error } = await svc.from("services").insert(rows);
  if (error) return { error: error.message };

  await markStepComplete("services");
  return { error: null };
}

export async function skipStep(step: SetupStepKey): Promise<{ error: null }> {
  await markStepComplete(step);
  return { error: null };
}
