import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Mijn Afspraken" };

export default async function KlantAfsprakenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, contact_name, company_name")
    .eq("profile_id", user.id)
    .single();

  if (!client) redirect("/klant");

  const today = new Date().toISOString().split("T")[0];

  const [upcoming, past] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_date, scheduled_start, scheduled_end, address, city, status, notes")
      .eq("client_id", client.id)
      .gte("scheduled_date", today)
      .order("scheduled_date")
      .limit(20),
    supabase
      .from("appointments")
      .select("id, scheduled_date, scheduled_start, scheduled_end, address, city, status")
      .eq("client_id", client.id)
      .lt("scheduled_date", today)
      .order("scheduled_date", { ascending: false })
      .limit(10),
  ]);

  const statusLabel: Record<string, string> = {
    scheduled: "Gepland",
    in_progress: "Bezig",
    completed: "Afgerond",
    cancelled: "Geannuleerd",
    no_show: "Niet verschenen",
  };
  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Mijn afspraken</h1>
        <p className="mt-1 text-sm text-[#606774]">Overzicht van al uw geplande en afgelopen afspraken</p>
      </div>

      {/* UPCOMING */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#101536]">Aankomend</h2>
        {!upcoming.data?.length ? (
          <Empty icon={<Calendar size={32} />} text="Geen aankomende afspraken" />
        ) : (
          <div className="space-y-3">
            {upcoming.data.map((apt) => (
              <div key={apt.id} className="rounded-[20px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 rounded-2xl bg-[#4D7EBA]/08 px-3 py-2 text-center">
                      <p className="text-xs font-semibold text-[#4D7EBA]">
                        {new Date(apt.scheduled_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-[#606774]" />
                        <span className="text-sm font-medium text-[#101536]">
                          {apt.scheduled_start.slice(0, 5)} – {apt.scheduled_end.slice(0, 5)}
                        </span>
                      </div>
                      {apt.address && (
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-[#606774]">
                          <MapPin size={12} />
                          {apt.address}, {apt.city}
                        </div>
                      )}
                      {apt.notes && (
                        <p className="mt-2 text-sm text-[#606774] italic">{apt.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[apt.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {statusLabel[apt.status] ?? apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PAST */}
      {!!past.data?.length && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#101536]">Geschiedenis</h2>
          <div className="space-y-2">
            {past.data.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between rounded-[16px] border border-[#101536]/06 bg-white/50 px-5 py-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#606774]">
                    {new Date(apt.scheduled_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="text-sm text-[#606774]">{apt.scheduled_start.slice(0, 5)}</span>
                  {apt.address && <span className="hidden text-sm text-[#606774] sm:block">{apt.city}</span>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[apt.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {statusLabel[apt.status] ?? apt.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl shadow-sm">
      <div className="mx-auto mb-3 w-fit text-[#95AEC1]">{icon}</div>
      <p className="text-sm text-[#606774]">{text}</p>
    </div>
  );
}
