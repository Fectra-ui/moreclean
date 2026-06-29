"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

/**
 * Haalt het profiel van de ingelogde gebruiker op via de service client.
 * Maakt automatisch een profiel aan als het ontbreekt.
 * Redirect naar /login als er geen sessie is.
 */
export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  let { data: profile } = await svc
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const { count } = await svc
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const role = (count ?? 0) === 0 ? "admin" : "klant";

    await svc.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role,
      company_id: COMPANY_ID,
      active: true,
    });

    const { data: fresh } = await svc
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = fresh;
  }

  if (!profile) redirect("/login");
  return profile as Profile;
}

/** Vereist admin-rol, anders redirect naar /klant */
export async function requireAdmin(): Promise<{ profile: Profile }> {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") redirect("/klant");
  return { profile };
}

/** Vereist employee- of admin-rol */
export async function requireEmployee(): Promise<{ profile: Profile }> {
  const profile = await getCurrentProfile();
  if (profile.role !== "employee" && profile.role !== "admin") redirect("/klant");
  return { profile };
}
