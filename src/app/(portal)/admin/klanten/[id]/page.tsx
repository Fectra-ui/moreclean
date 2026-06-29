import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getClientDetail, getClientStats } from "@/lib/services/crm/clients";
import ClientDetailTabs from "./ClientDetailTabs";
import Link from "next/link";
import { ChevronLeft, Edit, UserX, UserCheck, PlusCircle } from "lucide-react";
import { clientDisplayName, clientSubName, clientTypeLabel } from "@/lib/utils/client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientDetail(id);
  return { title: client ? (client.company_name || client.contact_name) : "Klant" };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [client, stats] = await Promise.all([
    getClientDetail(id),
    getClientStats(id),
  ]);
  if (!client) notFound();

  const displayName = clientDisplayName(client as Parameters<typeof clientDisplayName>[0]);
  const subName = clientSubName(client as Parameters<typeof clientSubName>[0]);

  return (
    <div className="space-y-6">
      {/* BREADCRUMB + HEADER */}
      <div>
        <Link
          href="/admin/klanten"
          className="mb-4 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]"
        >
          <ChevronLeft size={14} /> Terug naar klanten
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* AVATAR */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4D7EBA]/20 to-[#95AEC1]/20 text-2xl font-bold text-[#4D7EBA]">
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[#101536]">{displayName}</h1>
                  {subName && <p className="text-sm text-[#606774]">{subName}</p>}
                </div>
                <span className="rounded-full border border-[#101536]/10 px-2.5 py-0.5 text-xs text-[#606774]">
                  {clientTypeLabel(client as Parameters<typeof clientTypeLabel>[0])}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  client.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                }`}>
                  {client.active ? "Actief" : "Inactief"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-[#606774]">
                {client.email}
                {client.phone && ` · ${client.phone}`}
                {client.city && ` · ${client.city}`}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/offertes/nieuw?client=${client.id}`}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5"
            >
              <PlusCircle size={15} />
              Nieuwe offerte
            </Link>
            <Link
              href={`/admin/klanten/${client.id}/bewerken`}
              className="flex items-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#101536] transition hover:bg-[#F3F5F7]"
            >
              <Edit size={15} />
              Bewerken
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Totale omzet", value: `€${stats.totalRevenue.toLocaleString("nl-NL")}`, color: "text-emerald-600" },
          { label: "Openstaand", value: `€${stats.openAmount.toLocaleString("nl-NL")}`, color: stats.openAmount > 0 ? "text-amber-600" : "text-[#606774]" },
          { label: "Afspraken", value: stats.totalAppointments, color: "text-[#4D7EBA]" },
          { label: "Klant sinds", value: stats.firstAppointment ? new Date(stats.firstAppointment).toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) : "Nog geen", color: "text-[#606774]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[18px] border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-medium text-[#606774]">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <ClientDetailTabs client={client as unknown as Record<string, unknown>} />
    </div>
  );
}
