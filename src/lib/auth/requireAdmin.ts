"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

/**
 * Haalt het profiel op van de ingelogde gebruiker via de normale server client.
 * Vereist RLS policy: users kunnen hun eigen profiel lezen (auth.uid() = id).
 * Redirect naar /login als er geen sessie is.
 */
export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
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
  if (profile.role !== "admin") redirect("/klant");
  return { profile };
}

/** Vereist employee- of admin-rol */
export async function requireEmployee(): Promise<{ profile: Profile }> {
  const profile = await getCurrentProfile();
  if (profile.role !== "employee" && profile.role !== "admin") redirect("/klant");
  return { profile };
}
