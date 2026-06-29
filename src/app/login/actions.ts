"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "E-mailadres of wachtwoord onjuist." };
  }

  const user = data.user;

  // Fetch profile — create one if missing (e.g. manually created auth user)
  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // First user ever → admin, others → klant
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const role = (count ?? 0) === 0 ? "admin" : "klant";

    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role,
      company_id: COMPANY_ID,
      active: true,
    });

    profile = { role };
  }

  const role = profile?.role;
  const destination = redirectTo
    || (role === "admin" ? "/admin" : role === "employee" ? "/medewerker" : "/klant");

  redirect(destination);
}
