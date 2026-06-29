import { createServiceClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";

// ── Progress types ─────────────────────────────────────────────
// All valid step keys. Extend this union when adding wizard steps.
export type SetupStepKey =
  | "company"
  | "logo"
  | "units"
  | "services"
  | "employees"
  | "vehicles"
  | "payments"
  | "accounting";

export type SetupProgress = Partial<Record<SetupStepKey, boolean>>;

// ── Wizard state ───────────────────────────────────────────────

export async function getSetupProgress(): Promise<{
  progress: SetupProgress;
  completedAt: string | null;
}> {
  const companyId = await getCompanyId();
  const svc = createServiceClient();
  const [stepsRes, companyRes] = await Promise.all([
    svc.from("setup_state").select("step").eq("company_id", companyId),
    svc.from("companies").select("setup_completed_at").eq("id", companyId).single(),
  ]);
  const progress: SetupProgress = {};
  for (const row of (stepsRes.data ?? [])) {
    const step = (row as { step: string }).step as SetupStepKey;
    progress[step] = true;
  }
  return {
    progress,
    completedAt: (companyRes.data as { setup_completed_at: string | null } | null)?.setup_completed_at ?? null,
  };
}

export async function isSetupComplete(): Promise<boolean> {
  const { completedAt } = await getSetupProgress();
  return !!completedAt;
}

// ── Dashboard status (for the control center) ─────────────────

export interface SetupStatus {
  bedrijf: boolean;
  units: boolean;
  diensten: boolean;
  medewerkers: boolean;
  voertuigen: boolean;
  boekhouding: boolean;
  betalingen: boolean;
  completionPct: number;
  companyName: string | null;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const companyId = await getCompanyId();
  const svc = createServiceClient();

  const [companyRes, unitsCount, servicesCount, employeesCount, vehiclesCount] = await Promise.all([
    Promise.resolve(svc.from("companies").select("name, kvk, iban, boekhouder_email").eq("id", companyId).single()).catch(() => ({ data: null })),
    Promise.resolve(svc.from("business_units").select("id", { count: "exact", head: true }).eq("company_id", companyId)).catch(() => ({ count: 0 })),
    Promise.resolve(svc.from("services").select("id", { count: "exact", head: true }).eq("company_id", companyId)).catch(() => ({ count: 0 })),
    Promise.resolve(svc.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("role", ["employee", "admin"])).catch(() => ({ count: 0 })),
    Promise.resolve(svc.from("vehicles").select("id", { count: "exact", head: true }).eq("company_id", companyId)).catch(() => ({ count: 0 })),
  ]);

  const company = companyRes.data as { name: string | null; kvk: string | null; iban: string | null; boekhouder_email: string | null } | null;
  const bedrijf = !!(company?.name && company?.kvk);
  const units = (unitsCount.count ?? 0) > 0;
  const diensten = (servicesCount.count ?? 0) > 0;
  const medewerkers = (employeesCount.count ?? 0) > 0;
  const voertuigen = (vehiclesCount.count ?? 0) > 0;
  const boekhouding = !!company?.boekhouder_email;
  const betalingen = !!company?.iban;

  const flags = [bedrijf, units, diensten, medewerkers, voertuigen, boekhouding, betalingen];
  const completionPct = Math.round((flags.filter(Boolean).length / flags.length) * 100);

  return {
    bedrijf, units, diensten, medewerkers, voertuigen, boekhouding, betalingen,
    completionPct, companyName: company?.name ?? null,
  };
}
