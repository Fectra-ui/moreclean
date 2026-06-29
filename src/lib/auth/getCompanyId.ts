import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function getCompanyId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const svc = createServiceClient();

  // Stap 1: probeer company_id uit het profiel
  const { data: profile } = await svc
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  const companyId = (profile as { company_id: string | null } | null)?.company_id;
  if (companyId) return companyId;

  // Stap 2: profiel heeft geen company_id — zoek de eerste company op
  // (voor single-tenant deployments is er maar één company)
  const { data: company } = await svc
    .from("companies")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const foundId = (company as { id: string } | null)?.id;
  if (!foundId) throw new Error("Geen bedrijf gevonden in de database");

  // Koppel het profiel meteen zodat volgende calls stap 1 pakken
  await svc.from("profiles").update({ company_id: foundId }).eq("id", user.id);

  return foundId;
}
