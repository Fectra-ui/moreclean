import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MapPin, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Mijn Agenda" };

export default async function MedewerkerAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["employee", "admin"].includes((profile as { role: string } | null)?.role ?? "")) redirect("/klant");

  const sp = await searchParams;

  // Week start (Monday)
  const today = new Date();
  const weekOffset = sp.week ? parseInt(sp.week) : 0;
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const from = monday.toISOString().split("T")[0];
  const to = sunday.toISOString().split("T")[0];

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, scheduled_date, scheduled_start, scheduled_end, status, address, city, clients(contact_name, company_name, phone)")
    .contains("employee_ids", [user.id])
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .order("scheduled_date")
    .order("scheduled_start");

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const byDay = days.map((d) => ({
    date: d,
    apts: (appointments ?? []).filter((a) => a.scheduled_date === d.toISOString().split("T")[0]),
  }));

  const statusColor: Record<string, string> = {
    scheduled: "border-l-[#4D7EBA]",
    in_progress: "border-l-amber-400",
    completed: "border-l-emerald-400",
    cancelled: "border-l-red-300",
  };

  const prevWeek = weekOffset - 1;
  const nextWeek = weekOffset + 1;
  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Mijn agenda</h1>
          <p className="mt-1 text-sm text-[#606774]">
            {monday.toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} – {sunday.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`?week=${prevWeek}`} className="rounded-xl border border-[#101536]/10 px-3 py-1.5 text-sm text-[#606774] hover:bg-[#F3F5F7]">← Vorige</a>
          {weekOffset !== 0 && (
            <a href="?" className="rounded-xl border border-[#101536]/10 px-3 py-1.5 text-sm text-[#606774] hover:bg-[#F3F5F7]">Vandaag</a>
          )}
          <a href={`?week=${nextWeek}`} className="rounded-xl border border-[#101536]/10 px-3 py-1.5 text-sm text-[#606774] hover:bg-[#F3F5F7]">Volgende →</a>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-7">
        {byDay.map(({ date, apts }) => {
          const dateStr = date.toISOString().split("T")[0];
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className={`rounded-2xl border p-3 ${isToday ? "border-[#4D7EBA]/30 bg-[#4D7EBA]/04" : "border-[#101536]/08 bg-white"}`}>
              <p className={`mb-2 text-xs font-semibold ${isToday ? "text-[#4D7EBA]" : "text-[#606774]"}`}>
                {date.toLocaleDateString("nl-NL", { weekday: "short" }).toUpperCase()}
              </p>
              <p className={`text-lg font-bold mb-3 ${isToday ? "text-[#4D7EBA]" : "text-[#101536]"}`}>
                {date.getDate()}
              </p>
              {apts.length === 0 ? (
                <p className="text-[11px] text-[#606774]/60">Vrij</p>
              ) : (
                <div className="space-y-2">
                  {apts.map((apt) => {
                    const c = apt.clients as unknown as { contact_name: string; company_name: string | null; phone: string | null } | null;
                    return (
                      <a key={apt.id} href={`/medewerker/opdracht/${apt.id}`}
                        className={`block rounded-xl border-l-4 bg-[#F8F9FB] px-2 py-2 text-[11px] transition hover:bg-[#F3F5F7] ${statusColor[apt.status] ?? "border-l-gray-300"}`}>
                        <p className="font-semibold text-[#101536] leading-tight">{c?.company_name || c?.contact_name}</p>
                        <p className="flex items-center gap-1 text-[#606774] mt-0.5">
                          <Clock size={9} />{apt.scheduled_start.slice(0, 5)}
                        </p>
                        {apt.city && (
                          <p className="flex items-center gap-1 text-[#606774]">
                            <MapPin size={9} />{apt.city}
                          </p>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
