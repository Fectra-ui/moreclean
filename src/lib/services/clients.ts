import { createClient } from "@/lib/supabase/server";
import type { Client, ClientWithSchedules } from "@/types/database";

export async function getClients(companyId: string): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("contact_name");
  if (error) throw error;
  return data;
}

export async function getClientById(id: string): Promise<ClientWithSchedules | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      maintenance_schedules (
        *,
        services (*)
      )
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ClientWithSchedules;
}

export async function createClientRecord(
  client: Omit<Client, "id" | "created_at" | "updated_at">
): Promise<Client> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClientRecord(
  id: string,
  updates: Partial<Client>
): Promise<Client> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function searchClients(
  companyId: string,
  query: string
): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .or(`contact_name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return data;
}
