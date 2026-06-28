"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, MessageSquare } from "lucide-react";

interface Conversation {
  id: string;
  subject: string | null;
  created_at: string;
  clients: { contact_name: string; company_name: string | null } | null;
  latest: { body: string; created_at: string } | null;
}

interface Message {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  profiles: { first_name: string | null; last_name: string | null; role: string } | null;
}

export default function MedewerkerBerichtenClient({
  conversations,
  currentUserId,
}: {
  conversations: Conversation[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<Conversation | null>(conversations[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    supabase
      .from("messages")
      .select("id, body, created_at, sender_id, profiles!sender_id(first_name, last_name, role)")
      .eq("conversation_id", selected.id)
      .order("created_at")
      .then(({ data }) => {
        setMessages((data ?? []) as unknown as Message[]);
        setLoading(false);
      });
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!selected) return;
    const channel = supabase
      .channel(`medewerker-conv-${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("id, body, created_at, sender_id, profiles!sender_id(first_name, last_name, role)")
            .eq("id", payload.new.id)
            .single();
          if (data) setMessages((prev) => [...prev, data as unknown as Message]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected?.id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !selected || sending) return;
    setSending(true);
    await supabase.from("messages").insert({ conversation_id: selected.id, sender_id: currentUserId, body: body.trim() });
    setBody("");
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-240px)] min-h-[500px] overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-[#101536]/06 overflow-y-auto">
        {conversations.map((c) => {
          const name = c.clients?.company_name || c.clients?.contact_name || c.subject || "Gesprek";
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-left px-4 py-3.5 border-b border-[#101536]/04 transition ${selected?.id === c.id ? "bg-[#4D7EBA]/08" : "hover:bg-[#F8F9FB]"}`}
            >
              <p className="text-sm font-semibold text-[#101536] truncate">{name}</p>
              {c.latest && (
                <p className="text-xs text-[#606774] truncate mt-0.5">{c.latest.body}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-[#101536]/06 px-5 py-3">
          <p className="font-semibold text-[#101536]">
            {selected?.clients?.company_name || selected?.clients?.contact_name || selected?.subject || "Selecteer gesprek"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && <p className="text-center text-sm text-[#606774]">Laden…</p>}
          {!loading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-[#95AEC1]" />
                <p className="text-sm text-[#606774]">Nog geen berichten</p>
              </div>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const name = msg.profiles ? [msg.profiles.first_name, msg.profiles.last_name].filter(Boolean).join(" ") || "Medewerker" : "Onbekend";
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <p className="mb-1 text-xs text-[#606774]">
                  {isOwn ? "U" : name} · {new Date(msg.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isOwn ? "bg-[#4D7EBA] text-white rounded-br-sm" : "bg-[#F3F5F7] text-[#101536] rounded-bl-sm"}`}>
                  {msg.body}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-3 border-t border-[#101536]/06 p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            placeholder="Typ een bericht…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-[#101536]/10 bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending || !selected}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#4D7EBA] text-white transition hover:bg-[#3a6aa8] disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
