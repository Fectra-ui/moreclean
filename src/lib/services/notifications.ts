import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationType } from "@/types/database";

export async function getNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

// Server-side: send notification (uses service role to bypass RLS)
export async function sendNotification(
  recipientId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("notifications")
    .insert({ recipient_id: recipientId, type, title, body, link });
  if (error) throw error;
}
