"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send } from "lucide-react";

interface Message {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  read_at: string | null;
  profiles: { first_name: string | null; last_name: string | null; role: string } | null;
}

interface Props {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}

export default function KlantBerichtenClient({ conversationId, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from("messages")
          .select("id, body, created_at, sender_id, read_at, profiles!sender_id(first_name, last_name, role)")
          .eq("id", payload.new.id)
          .single();
        if (data) setMessages((prev) => [...prev, data as unknown as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, supabase]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: body.trim(),
    });
    setBody("");
    setSending(false);
  }

  return (
    <div className="flex flex-col rounded-[24px] border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl" style={{ height: "calc(100vh - 280px)", minHeight: 400 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[#606774] mt-8">Stuur ons een bericht. We reageren binnen 24 uur.</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          const name = msg.profiles
            ? [msg.profiles.first_name, msg.profiles.last_name].filter(Boolean).join(" ") || "More Clean"
            : "More Clean";
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              <p className="mb-1 text-xs text-[#606774]">
                {isOwn ? "U" : name} · {new Date(msg.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                isOwn
                  ? "bg-[#4D7EBA] text-white rounded-br-sm"
                  : "bg-[#F3F5F7] text-[#101536] rounded-bl-sm"
              }`}>
                {msg.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-end gap-3 border-t border-[#101536]/06 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          placeholder="Typ uw bericht..."
          rows={2}
          className="flex-1 resize-none rounded-2xl border border-[#101536]/10 bg-[#F8F9FB] px-4 py-3 text-sm text-[#101536] placeholder:text-[#606774]/50 focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#4D7EBA] text-white transition hover:bg-[#3a6aa8] disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
