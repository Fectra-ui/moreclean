import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function getCompanyId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const svc = createServiceClient();

  // Stap 1: probeer company_id uit het profiel
  const { data: profile, error } = await svc
    .from("profiles")
    .select("company_id, active")
    .eq("id", user.id)
    .single();

  if (error || profile?.active !== true) throw new Error("Geen toegang");
  const companyId = (profile as { company_id: string | null } | null)?.company_id;
  if (!companyId) throw new Error("Gebruikersprofiel is niet aan een bedrijf gekoppeld");
  return companyId;
}
