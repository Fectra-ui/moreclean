import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type ApiIdentity = { userId: string; role: UserRole };

export async function isActiveProfile(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: profile, error } = await supabase.from("profiles")
      .select("active").eq("id", userId).single();
    return !error && profile?.active === true;
  } catch {
    return false;
  }
}

export async function getApiIdentity(allowedRoles: UserRole[]): Promise<{ identity?: ApiIdentity; status?: 401 | 403 }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 401 };
  const { data: profile, error } = await supabase.from("profiles").select("role, active").eq("id", user.id).single();
  const role = profile?.role as UserRole | undefined;
  if (error || profile?.active !== true || !role || !allowedRoles.includes(role)) return { status: 403 };
  return { identity: { userId: user.id, role } };
}
