import { createServiceClient } from "@/lib/supabase/server";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export async function isSetupComplete(): Promise<boolean> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("companies")
    .select("setup_completed_at")
    .eq("id", COMPANY_ID)
    .single();
  return !!data?.setup_completed_at;
}

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
  const svc = createServiceClient();

  const [companyRes, unitsRes, servicesRes, employeesRes, vehiclesRes] = await Promise.all([
    svc.from("companies").select("name, kvk, iban, boekhouder_email").eq("id", COMPANY_ID).single(),
    svc.from("business_units").select("id", { count: "exact", head: true }).eq("company_id", COMPANY_ID).catch(() => ({ count: 0 })),
    svc.from("services").select("id", { count: "exact", head: true }).eq("company_id", COMPANY_ID).catch(() => ({ count: 0 })),
    svc.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", COMPANY_ID).in("role", ["employee", "admin"]).catch(() => ({ count: 0 })),
    svc.from("vehicles").select("id", { count: "exact", head: true }).eq("company_id", COMPANY_ID).catch(() => ({ count: 0 })),
  ]);

  const company = companyRes.data;
  const bedrijf = !!(company?.name && company?.kvk);
  const units = (unitsRes.count ?? 0) > 0;
  const diensten = (servicesRes.count ?? 0) > 0;
  const medewerkers = (employeesRes.count ?? 0) > 0;
  const voertuigen = (vehiclesRes.count ?? 0) > 0;
  const boekhouding = !!company?.boekhouder_email;
  const betalingen = !!company?.iban;

  const flags = [bedrijf, units, diensten, medewerkers, voertuigen, boekhouding, betalingen];
  const completionPct = Math.round((flags.filter(Boolean).length / flags.length) * 100);

  return { bedrijf, units, diensten, medewerkers, voertuigen, boekhouding, betalingen, completionPct, companyName: company?.name ?? null };
}
