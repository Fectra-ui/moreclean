import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import KlantBerichtenClient from "./KlantBerichtenClient";

export const metadata: Metadata = { title: "Berichten" };

export default async function KlantBerichtenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase.from("clients").select("id, contact_name, company_name").eq("profile_id", user.id).single();
  if (!client) redirect("/klant");

  // Get or create conversation for this client
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({ client_id: client.id, subject: "Algemeen contact" })
      .select("id")
      .single();
    conversation = newConv;
  }

  if (!conversation) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MessageSquare size={32} className="mx-auto mb-3 text-[#95AEC1]" />
          <p className="text-sm text-[#606774]">Berichten tijdelijk niet beschikbaar</p>
        </div>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id, read_at, profiles!sender_id(first_name, last_name, role)")
    .eq("conversation_id", conversation.id)
    .order("created_at");

  // Mark unread as read
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversation.id)
    .is("read_at", null)
    .neq("sender_id", user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Berichten</h1>
        <p className="mt-1 text-sm text-[#606774]">Direct contact met More Clean</p>
      </div>
      <KlantBerichtenClient
        conversationId={conversation.id}
        initialMessages={(messages ?? []) as unknown as Parameters<typeof KlantBerichtenClient>[0]["initialMessages"]}
        currentUserId={user.id}
      />
    </div>
  );
}
