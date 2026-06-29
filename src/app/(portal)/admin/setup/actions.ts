"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import type { ServiceTemplate } from "@/lib/data/service-templates";
import type { SetupStepKey, SetupProgress } from "@/lib/services/setup";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

// ── Progress ───────────────────────────────────────────────────

export async function markStepComplete(step: SetupStepKey): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();

  // Merge into existing jsonb column
  await svc.rpc("jsonb_set_key", {
    target_id: COMPANY_ID,
    key: step,
    value: true,
  }).catch(async () => {
    // Fallback: read-modify-write (rpc may not exist yet)
    const { data } = await svc
      .from("companies")
      .select("setup_progress")
      .eq("id", COMPANY_ID)
      .single();
    const current: SetupProgress = (data?.setup_progress as SetupProgress) ?? {};
    await svc
      .from("companies")
      .update({ setup_progress: { ...current, [step]: true } })
      .eq("id", COMPANY_ID);
  });
}

export async function completeSetup(): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  await svc
    .from("companies")
    .update({ setup_completed_at: new Date().toISOString() })
    .eq("id", COMPANY_ID);
  redirect("/admin");
}

// ── Step actions ───────────────────────────────────────────────

export async function saveCompanyInfo(formData: FormData): Promise<{ error: string | null }> {
  await requireAdmin();
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
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", COMPANY_ID);

  if (error) return { error: error.message };

  await markStepComplete("company");
  return { error: null };
}

export async function importServices(services: ServiceTemplate[]): Promise<{ error: string | null }> {
  await requireAdmin();
  const svc = createServiceClient();

  const rows = services.map((s) => ({
    company_id: COMPANY_ID,
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
