"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/requireAdmin";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "E-mailadres of wachtwoord onjuist." };

  // getCurrentProfile maakt profiel aan als het ontbreekt, en geeft de rol terug
  const profile = await getCurrentProfile();

  const role = profile.role;
  const destination = redirectTo
    || (role === "admin" ? "/admin" : role === "employee" ? "/medewerker" : "/klant");

  redirect(destination);
}
