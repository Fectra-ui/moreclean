import { createClient, createServiceClient } from "@/lib/supabase/server";

const FALLBACK = "a1000000-0000-0000-0000-000000000001";

export async function getCompanyId(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return FALLBACK;
    const svc = createServiceClient();
    const { data } = await svc.from("profiles").select("company_id").eq("id", user.id).single();
    return (data as { company_id: string | null } | null)?.company_id ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}
