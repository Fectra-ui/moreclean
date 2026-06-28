"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  appointment_assigned:   "👤",
  appointment_created:    "📅",
  appointment_completed:  "✅",
  appointment_cancelled:  "❌",
  quote_accepted:         "🎉",
  quote_rejected:         "📄",
  invoice_paid:           "💶",
  invoice_overdue:        "⚠️",
  message_received:       "💬",
  maintenance_due:        "🔧",
};

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "zojuist";
  if (s < 3600) return `${Math.floor(s / 60)} min geleden`;
  if (s < 86400) return `${Math.floor(s / 3600)} uur geleden`;
  return new Date(date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setNotifications(data);
  }, []);

  // Initiële load
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Supabase Realtime — vervangt de 30-seconden polling
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const newNote = payload.new as Notification;
          setNotifications((prev) => [newNote, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.read_at).length;

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read_at).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    await Promise.all(ids.map((id) => fetch(`/api/notifications/${id}/read`, { method: "POST" })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2 text-[#606774] transition hover:bg-[#F3F5F7] hover:text-[#101536]"
        aria-label="Notificaties"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#4D7EBA] text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#101536]/08 px-4 py-3">
            <h3 className="font-semibold text-[#101536]">Notificaties</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#4D7EBA] hover:underline">
                Alles gelezen
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#606774]">Geen notificaties</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex cursor-pointer gap-3 border-b border-[#101536]/05 px-4 py-3 transition last:border-b-0 hover:bg-[#F3F5F7] ${!n.read_at ? "bg-[#4D7EBA]/[0.03]" : ""}`}
                >
                  <span className="mt-0.5 shrink-0 text-base">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.read_at ? "font-semibold text-[#101536]" : "text-[#606774]"}`}>
                        {n.title}
                      </p>
                      {!n.read_at && <span className="mt-1 size-2 shrink-0 rounded-full bg-[#4D7EBA]" />}
                    </div>
                    {n.body && <p className="mt-0.5 truncate text-xs text-[#606774]">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-[#606774]/60">{timeAgo(n.created_at)}</p>
                  </div>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 shrink-0 text-xs text-[#4D7EBA] hover:underline"
                    >
                      Bekijken
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
