"use server";

import { createClient } from "@/lib/supabase/server";
import { isActiveProfile } from "@/lib/auth/apiAuth";
import { getCurrentProfile } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "E-mailadres of wachtwoord onjuist." };

  if (!data.user || !(await isActiveProfile(data.user.id))) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return { error: "Dit account heeft geen toegang tot het portaal." };
  }

  const profile = await getCurrentProfile();
  const role = profile.role;
  const safeRedirect = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : null;
  const destination = safeRedirect
    || (role === "admin" ? "/admin" : role === "employee" ? "/medewerker" : "/klant");

  redirect(destination);
}
