import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import MedewerkerBerichtenClient from "./MedewerkerBerichtenClient";

export const metadata: Metadata = { title: "Berichten" };

export default async function MedewerkerBerichtenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["employee", "admin"].includes((profile as { role: string } | null)?.role ?? "")) redirect("/klant");

  // Employee inbox: all conversations they're part of (via messages they sent or received)
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, subject, created_at, clients(contact_name, company_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  const convIds = (conversations ?? []).map((c) => c.id);

  // Latest message per conversation + unread count
  const { data: latestMessages } = convIds.length
    ? await supabase
        .from("messages")
        .select("conversation_id, body, created_at, sender_id")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const latestByConv: Record<string, { body: string; created_at: string }> = {};
  (latestMessages ?? []).forEach((m) => {
    if (!latestByConv[m.conversation_id]) latestByConv[m.conversation_id] = m;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Berichten</h1>
        <p className="mt-1 text-sm text-[#606774]">Klantgesprekken en interne berichten</p>
      </div>

      {!conversations?.length ? (
        <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl shadow-sm">
          <MessageSquare size={32} className="mx-auto mb-3 text-[#95AEC1]" />
          <p className="text-sm text-[#606774]">Geen berichten</p>
        </div>
      ) : (
        <MedewerkerBerichtenClient
          conversations={(conversations ?? []).map((c) => ({
            ...c,
            clients: c.clients as unknown as { contact_name: string; company_name: string | null } | null,
            latest: latestByConv[c.id] ?? null,
          }))}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
