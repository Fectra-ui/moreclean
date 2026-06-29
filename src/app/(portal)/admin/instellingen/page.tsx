import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getSetupStatus } from "@/lib/services/setup";
import Link from "next/link";
import {
  Building2, FileText, Package, Layers, Users, Truck,
  Mail, CreditCard, BarChart2, Settings, ChevronRight,
  CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";

export const metadata: Metadata = { title: "Instellingen" };

interface SectionCard {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  href: string;
  ready: boolean; // false = pagina bestaat nog niet
  status?: "ok" | "warning" | "pending";
  statusLabel?: string;
  color: string;
}

export default async function InstellingenPage() {
  const { profile } = await requireAdmin();
  const status = await getSetupStatus().catch(() => ({
    bedrijf: false, units: false, diensten: false, medewerkers: false,
    voertuigen: false, boekhouding: false, betalingen: false,
    completionPct: 0, companyName: null,
  }));

  const sections: SectionCard[] = [
    {
      icon: Building2,
      title: "Bedrijf",
      subtitle: "Naam, adres, KVK, BTW, logo en branding",
      href: "/admin/instellingen/bedrijf",
      ready: true,
      status: status.bedrijf ? "ok" : "warning",
      statusLabel: status.bedrijf ? "Ingevuld" : "Aanvullen",
      color: "text-[#4D7EBA] bg-[#4D7EBA]/10",
    },
    {
      icon: Package,
      title: "Diensten",
      subtitle: "Catalogus van alle diensten met prijzen en eenheden",
      href: "/admin/diensten",
      ready: false,
      status: status.diensten ? "ok" : "warning",
      statusLabel: status.diensten ? "Ingesteld" : "Nog leeg",
      color: "text-amber-600 bg-amber-100",
    },
    {
      icon: Layers,
      title: "Bedrijfsunits",
      subtitle: "More Clean, More Media — eigen branding per unit",
      href: "/admin/instellingen/units",
      ready: false,
      status: status.units ? "ok" : "pending",
      statusLabel: status.units ? "Actief" : "Aanmaken",
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      icon: Users,
      title: "Medewerkers",
      subtitle: "Rollen, rechten, werkdagen en planning",
      href: "/admin/medewerkers",
      ready: true,
      status: status.medewerkers ? "ok" : "pending",
      statusLabel: status.medewerkers ? "Actief" : "Toevoegen",
      color: "text-sky-600 bg-sky-100",
    },
    {
      icon: Truck,
      title: "Voertuigen",
      subtitle: "Voertuigenpark, APK, onderhoud en kosten",
      href: "/admin/voertuigen",
      ready: true,
      status: status.voertuigen ? "ok" : "pending",
      statusLabel: status.voertuigen ? "Geregistreerd" : "Toevoegen",
      color: "text-orange-600 bg-orange-100",
    },
    {
      icon: FileText,
      title: "Facturatie",
      subtitle: "Nummering, BTW, betaaltermijnen en PDF-layout",
      href: "/admin/instellingen/facturatie",
      ready: false,
      status: "pending",
      statusLabel: "Binnenkort",
      color: "text-violet-600 bg-violet-100",
    },
    {
      icon: Mail,
      title: "Communicatie",
      subtitle: "E-mail, SMS en WhatsApp — templates en SMTP",
      href: "/admin/instellingen/communicatie",
      ready: false,
      status: "pending",
      statusLabel: "Binnenkort",
      color: "text-pink-600 bg-pink-100",
    },
    {
      icon: CreditCard,
      title: "Betalingen",
      subtitle: "Mollie, Stripe, bankgegevens en automatische herinneringen",
      href: "/admin/instellingen/betalingen",
      ready: false,
      status: status.betalingen ? "ok" : "warning",
      statusLabel: status.betalingen ? "Geconfigureerd" : "Binnenkort",
      color: "text-teal-600 bg-teal-100",
    },
    {
      icon: BarChart2,
      title: "Boekhouding",
      subtitle: "Boekhouder, kwartaalexport, Moneybird en Exact",
      href: "/admin/instellingen/boekhouding",
      ready: false,
      status: status.boekhouding ? "ok" : "pending",
      statusLabel: status.boekhouding ? "Gekoppeld" : "Binnenkort",
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      icon: Settings,
      title: "Automatiseringen",
      subtitle: "Workflows na offerte, afspraak en betaling",
      href: "/admin/instellingen/automatiseringen",
      ready: false,
      status: "pending",
      statusLabel: "Binnenkort",
      color: "text-gray-600 bg-gray-100",
    },
  ];

  const warnings = sections.filter((s) => s.status === "warning").length;
  const pending = sections.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Instellingen</h1>
          <p className="mt-1 text-sm text-[#606774]">Beheer alle aspecten van je platform op één plek.</p>
        </div>
        <Link
          href="/admin/setup"
          className="flex items-center gap-2 rounded-2xl border border-[#4D7EBA]/20 bg-[#4D7EBA]/05 px-4 py-2 text-xs font-semibold text-[#4D7EBA] transition hover:bg-[#4D7EBA]/10"
        >
          Setup opnieuw starten
        </Link>
      </div>

      {/* Voortgangsbalk */}
      <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_4px_16px_rgba(16,21,54,.06)] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-[#101536]">Platform-voltooiing</p>
            <p className="text-sm text-[#606774]">
              {warnings > 0 && `${warnings} ${warnings === 1 ? "sectie vraagt" : "secties vragen"} aandacht · `}
              {pending > 0 && `${pending} nog in te stellen`}
              {warnings === 0 && pending === 0 && "Volledig ingericht 🎉"}
            </p>
          </div>
          <span className="text-2xl font-bold text-[#4D7EBA]">{status.completionPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#F3F5F7] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              status.completionPct >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
              status.completionPct >= 50 ? "bg-gradient-to-r from-[#667FB0] to-[#4D7EBA]" :
              "bg-gradient-to-r from-amber-400 to-amber-500"
            }`}
            style={{ width: `${status.completionPct}%` }}
          />
        </div>
      </div>

      {/* Sectie-kaarten */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const inner = (
            <>
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${section.color} ${!section.ready ? "opacity-50" : ""}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${section.ready ? "text-[#101536]" : "text-[#606774]"}`}>{section.title}</p>
                <p className="text-xs text-[#606774] mt-0.5 truncate">{section.subtitle}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {section.status === "ok" && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 size={10} /> {section.statusLabel}
                  </span>
                )}
                {section.status === "warning" && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    <AlertTriangle size={10} /> {section.statusLabel}
                  </span>
                )}
                {section.status === "pending" && (
                  <span className="flex items-center gap-1 rounded-full bg-[#F3F5F7] px-2.5 py-1 text-[10px] font-bold text-[#606774]">
                    <Clock size={10} /> {section.statusLabel}
                  </span>
                )}
                {section.ready && <ChevronRight size={16} className="text-[#606774] transition group-hover:translate-x-0.5" />}
              </div>
            </>
          );

          if (!section.ready) {
            return (
              <div key={section.title} className="flex items-center gap-4 rounded-[20px] border border-white/60 bg-white/60 p-5 opacity-60 cursor-not-allowed">
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={section.title}
              href={section.href}
              className="group flex items-center gap-4 rounded-[20px] border border-white/60 bg-white/85 p-5 shadow-[0_2px_8px_rgba(16,21,54,.04)] backdrop-blur-xl transition hover:shadow-[0_8px_24px_rgba(16,21,54,.08)] hover:-translate-y-0.5"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
