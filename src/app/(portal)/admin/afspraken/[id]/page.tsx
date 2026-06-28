import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getAppointmentFull } from "@/lib/services/planning/execution";
import Link from "next/link";
import { ChevronLeft, Clock, MapPin, Phone, User, CheckCircle2, Circle, Package } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = await getAppointmentFull(id);
  return { title: a ? `Afspraak – ${a.client.company_name || a.client.contact_name}` : "Afspraak" };
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Gepland", in_progress: "Bezig", completed: "Afgerond", cancelled: "Geannuleerd", no_show: "Niet verschenen",
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-[#4D7EBA]/10 text-[#4D7EBA]",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-gray-100 text-gray-600",
};

function formatDateTime(d: string | null): string {
  if (!d) return "–";
  return new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appt = await getAppointmentFull(id);
  if (!appt) notFound();

  const totalTime = appt.time_logs.reduce((s, l) => s + (l.duration_min ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/admin/planning" className="mb-3 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Terug naar planning
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#101536]">
            {appt.client.company_name || appt.client.contact_name}
          </h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[appt.status]}`}>
            {STATUS_LABELS[appt.status] ?? appt.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Details card */}
          <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-[#101536]">Afspraakdetails</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="flex items-center gap-1.5 text-[#606774]"><Clock size={14} /> Datum</dt>
                <dd className="font-medium text-[#101536]">
                  {new Date(appt.scheduled_date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="flex items-center gap-1.5 text-[#606774]"><Clock size={14} /> Tijd</dt>
                <dd className="font-medium text-[#101536]">{appt.scheduled_start.slice(0,5)} – {appt.scheduled_end.slice(0,5)}</dd>
              </div>
              {appt.address && (
                <div className="flex gap-3">
                  <dt className="flex items-center gap-1.5 text-[#606774]"><MapPin size={14} /> Adres</dt>
                  <dd className="font-medium text-[#101536]">{appt.address}, {appt.city}</dd>
                </div>
              )}
              {appt.client.phone && (
                <div className="flex gap-3">
                  <dt className="flex items-center gap-1.5 text-[#606774]"><Phone size={14} /> Telefoon</dt>
                  <dd><a href={`tel:${appt.client.phone}`} className="font-medium text-[#4D7EBA] hover:underline">{appt.client.phone}</a></dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="flex items-center gap-1.5 text-[#606774]"><User size={14} /> Medewerkers</dt>
                <dd className="font-medium text-[#101536]">
                  {appt.employees.length > 0 ? appt.employees.map((e) => `${e.name} (${e.role})`).join(", ") : "Niet toegewezen"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Checklists */}
          {appt.checklists.map((cl) => {
            const done = cl.items.filter((i) => i.checked).length;
            return (
              <div key={cl.id} className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#101536]/06">
                  <h3 className="font-semibold text-[#101536]">{cl.template_name}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${done === cl.items.length ? "bg-emerald-100 text-emerald-700" : "bg-[#F3F5F7] text-[#606774]"}`}>
                    {done}/{cl.items.length} afgevinkt
                  </span>
                </div>
                <ul className="divide-y divide-[#101536]/05">
                  {cl.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-2.5">
                      {item.checked
                        ? <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                        : <Circle size={18} className="shrink-0 text-[#606774]/30" />
                      }
                      <span className={`text-sm ${item.checked ? "text-[#606774] line-through" : "text-[#101536]"}`}>
                        {item.label}
                        {item.required && <span className="ml-1 text-red-400 no-underline">*</span>}
                      </span>
                      {item.checked_at && (
                        <span className="ml-auto text-xs text-[#606774]/50">
                          {new Date(item.checked_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Materials */}
          {appt.materials.length > 0 && (
            <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#101536]/06">
                <Package size={16} className="text-[#606774]" />
                <h3 className="font-semibold text-[#101536]">Gebruikte materialen</h3>
              </div>
              <ul className="divide-y divide-[#101536]/05">
                {appt.materials.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span className="text-[#101536]">{m.name}</span>
                    <span className="font-semibold text-[#606774]">{m.quantity} {m.unit ?? ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-[#101536]">Tijdlijn</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Gestart", value: formatDateTime(appt.started_at) },
                { label: "Afgerond", value: formatDateTime(appt.completed_at) },
                { label: "Werkelijke tijd", value: totalTime > 0 ? `${Math.floor(totalTime / 60)}u${totalTime % 60 > 0 ? ` ${totalTime % 60}m` : ""}` : "–" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-[#606774]">{label}</span>
                  <span className="font-medium text-[#101536]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signature */}
          {appt.signature && (
            <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-semibold text-[#101536]">Handtekening</h3>
              <p className="text-sm text-[#606774]">Ondertekend door</p>
              <p className="font-semibold text-[#101536]">{appt.signature.signed_by_name}</p>
              <p className="mt-1 text-xs text-[#606774]">{formatDateTime(appt.signature.signed_at)}</p>
            </div>
          )}

          {/* Notes */}
          {!!appt.notes && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Instructies</p>
              <p className="text-sm text-amber-900">{appt.notes}</p>
            </div>
          )}

          {/* Link to execution view */}
          <Link
            href={`/medewerker/opdracht/${appt.id}`}
            className="block w-full rounded-2xl border border-[#101536]/10 bg-white px-4 py-3 text-center text-sm font-semibold text-[#101536] shadow-sm transition hover:bg-[#F3F5F7]"
          >
            Uitvoermodus openen →
          </Link>
        </div>
      </div>
    </div>
  );
}
