"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("role, id, first_name, last_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/klant");

  return { user, profile };
}
