import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type ApiIdentity = { userId: string; role: UserRole };

export async function getApiIdentity(allowedRoles: UserRole[]): Promise<{ identity?: ApiIdentity; status?: 401 | 403 }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role as UserRole | undefined;
  if (!role || !allowedRoles.includes(role)) return { status: 403 };
  return { identity: { userId: user.id, role } };
}
