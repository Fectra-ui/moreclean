"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

export async function getCurrentProfile(): Promise<Profile> {
  // Auth check via normale client (session-cookie gebonden)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Profiel lezen via service client: omzeilt RLS zodat de lookup
  // altijd werkt ongeacht de RLS-configuratie op de profiles tabel.
  // Veilig: deze code draait uitsluitend server-side (Server Actions / Server Components).
  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  return profile as Profile;
}

/** Vereist admin-rol, anders redirect naar /klant */
export async function requireAdmin(): Promise<{ profile: Profile }> {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") redirect(profile.role === "employee" ? "/medewerker" : "/klant");
  return { profile };
}

/** Vereist uitsluitend de medewerkerrol. */
export async function requireEmployee(): Promise<{ profile: Profile }> {
  const profile = await getCurrentProfile();
  if (profile.role !== "employee") redirect(profile.role === "admin" ? "/admin" : "/klant");
  return { profile };
}

/** Vereist uitsluitend de klantrol. */
export async function requireCustomer(): Promise<{ profile: Profile }> {
  const profile = await getCurrentProfile();
  if (profile.role !== "customer") redirect(profile.role === "admin" ? "/admin" : "/medewerker");
  return { profile };
}
