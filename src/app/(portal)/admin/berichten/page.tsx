import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminBerichtenClient from "./AdminBerichtenClient";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Berichten" };

export default async function AdminBerichtenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") redirect("/klant");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, subject, created_at, clients(id, contact_name, company_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const convIds = (conversations ?? []).map((c) => c.id);

  const { data: allMessages } = convIds.length
    ? await supabase
        .from("messages")
        .select("conversation_id, body, created_at, sender_id, read_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const latestByConv: Record<string, { body: string; created_at: string }> = {};
  const unreadByConv: Record<string, number> = {};
  (allMessages ?? []).forEach((m) => {
    if (!latestByConv[m.conversation_id]) latestByConv[m.conversation_id] = m;
    if (!m.read_at && m.sender_id !== user.id) {
      unreadByConv[m.conversation_id] = (unreadByConv[m.conversation_id] ?? 0) + 1;
    }
  });

  const totalUnread = Object.values(unreadByConv).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Berichten</h1>
        <p className="mt-1 text-sm text-[#606774]">
          {conversations?.length ?? 0} gesprekken{totalUnread > 0 ? ` · ${totalUnread} ongelezen` : ""}
        </p>
      </div>

      {!conversations?.length ? (
        <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl">
          <MessageSquare size={32} className="mx-auto mb-3 text-[#95AEC1]" />
          <p className="text-sm text-[#606774]">Geen berichten</p>
        </div>
      ) : (
        <AdminBerichtenClient
          conversations={(conversations ?? []).map((c) => ({
            ...c,
            clients: c.clients as unknown as { id: string; contact_name: string; company_name: string | null } | null,
            latest: latestByConv[c.id] ?? null,
            unread: unreadByConv[c.id] ?? 0,
          }))}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
