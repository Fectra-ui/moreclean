import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAppointmentsByEmployee } from "@/lib/services/appointments";
import { MapPin, Phone, Clock, CheckCircle, PlayCircle } from "lucide-react";

export const metadata: Metadata = { title: "Mijn Dag" };

export default async function MedewerkerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !["employee", "admin"].includes(profile.role)) redirect("/klant");

  const today = new Date().toISOString().split("T")[0];
  const appointments = await getAppointmentsByEmployee(user.id, today);

  const completed = appointments.filter((a) => a.status === "completed").length;
  const remaining = appointments.filter((a) => a.status === "scheduled").length;
  const inProgress = appointments.find((a) => a.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* TODAY SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-white/60 bg-white/75 p-5 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl text-center">
          <p className="text-3xl font-bold text-[#101536]">{appointments.length}</p>
          <p className="mt-1 text-sm text-[#606774]">Opdrachten vandaag</p>
        </div>
        <div className="rounded-[20px] border border-white/60 bg-white/75 p-5 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl text-center">
          <p className="text-3xl font-bold text-emerald-500">{completed}</p>
          <p className="mt-1 text-sm text-[#606774]">Afgerond</p>
        </div>
        <div className="rounded-[20px] border border-white/60 bg-white/75 p-5 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl text-center">
          <p className="text-3xl font-bold text-[#4D7EBA]">{remaining}</p>
          <p className="mt-1 text-sm text-[#606774]">Nog te doen</p>
        </div>
      </div>

      {/* IN PROGRESS */}
      {inProgress && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle size={18} className="text-amber-600" />
            <p className="font-semibold text-amber-800">Bezig</p>
          </div>
          <a href={`/medewerker/opdracht/${inProgress.id}`} className="block">
            <AppointmentCard apt={inProgress} />
          </a>
        </div>
      )}

      {/* SCHEDULE */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#101536]">
          {new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
        </h2>

        {appointments.length === 0 ? (
          <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl shadow-[0_8px_32px_rgba(16,21,54,.06)]">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
            <p className="font-semibold text-[#101536]">Geen opdrachten vandaag</p>
            <p className="mt-1 text-sm text-[#606774]">Geniet van je vrije dag!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <a key={apt.id} href={`/medewerker/opdracht/${apt.id}`}>
                <AppointmentCard apt={apt} />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AppointmentCard({ apt }: { apt: Awaited<ReturnType<typeof getAppointmentsByEmployee>>[0] }) {
  const client = apt.clients as { contact_name: string; company_name: string | null; phone: string | null; address: string | null; city: string | null };
  const isCompleted = apt.status === "completed";

  return (
    <div className={`
      rounded-[20px] border p-5 transition hover:-translate-y-0.5
      ${isCompleted
        ? "border-emerald-100 bg-emerald-50/50 opacity-70"
        : "border-white/60 bg-white/75 shadow-[0_4px_16px_rgba(16,21,54,.05)] backdrop-blur-xl hover:shadow-[0_8px_24px_rgba(16,21,54,.08)]"
      }
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          {/* TIME */}
          <div className="flex-shrink-0 text-center">
            <p className="text-sm font-bold text-[#101536]">{apt.scheduled_start.slice(0, 5)}</p>
            <p className="text-xs text-[#606774]">{apt.scheduled_end.slice(0, 5)}</p>
          </div>
          <div className="h-10 w-px bg-[#101536]/08" />
          {/* DETAILS */}
          <div>
            <p className="font-semibold text-[#101536]">
              {client.company_name || client.contact_name}
            </p>
            {client.address && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[#606774]">
                <MapPin size={13} />
                {client.address}, {client.city}
              </p>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 flex items-center gap-1.5 text-sm text-[#4D7EBA] hover:underline"
              >
                <Phone size={13} />
                {client.phone}
              </a>
            )}
          </div>
        </div>

        {/* STATUS */}
        {isCompleted ? (
          <CheckCircle size={20} className="flex-shrink-0 text-emerald-500" />
        ) : (
          <span className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-[#4D7EBA]/10 px-3 py-1 text-xs font-medium text-[#4D7EBA]">
            <Clock size={12} />
            {apt.estimated_duration ? `${apt.estimated_duration}min` : "Gepland"}
          </span>
        )}
      </div>
    </div>
  );
}
