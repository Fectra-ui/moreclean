import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getBusinessUnits } from "@/lib/services/crm/businessUnits";
import { getCompany } from "@/lib/services/crm/company";
import BusinessUnitEditor from "./BusinessUnitEditor";
import CompanySettingsForm from "./CompanySettingsForm";
import { Building2, Layers } from "lucide-react";

export const metadata: Metadata = { title: "Instellingen" };

export default async function InstellingenPage() {
  await requireAdmin();

  const [company, units] = await Promise.all([
    getCompany().catch(() => null),
    getBusinessUnits(true).catch(() => []),
  ]);

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Instellingen</h1>
        <p className="mt-1 text-sm text-[#606774]">Bedrijfsgegevens, logo, factuurinstellingen en bedrijfsunits</p>
      </div>

      {/* Bedrijfsgegevens */}
      {company ? (
        <CompanySettingsForm company={company} />
      ) : (
        <section className="rounded-[24px] border border-dashed border-[#101536]/20 bg-white/60 p-10 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-[#95AEC1]" />
          <h2 className="text-base font-semibold text-[#101536]">Geen bedrijfsprofiel gevonden</h2>
          <p className="mt-1 text-sm text-[#606774]">
            Er staat nog geen rij in de <code className="rounded bg-[#F3F5F7] px-1 text-xs">companies</code>-tabel
            met id <code className="rounded bg-[#F3F5F7] px-1 text-xs">a1000000-0000-0000-0000-000000000001</code>.
          </p>
          <p className="mt-2 text-sm text-[#606774]">
            Voeg deze rij toe in Supabase om het formulier hier te tonen.
          </p>
        </section>
      )}

      {/* Business Units */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#101536]">Bedrijfsunits</h2>
          <p className="text-sm text-[#606774]">Elke unit heeft eigen branding op facturen en offertes.</p>
        </div>
        {units.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#101536]/20 bg-white/60 p-8 text-center">
            <Layers size={28} className="mx-auto mb-3 text-[#95AEC1]" />
            <p className="text-sm font-semibold text-[#101536]">Nog geen bedrijfsunits</p>
            <p className="mt-1 text-sm text-[#606774]">Voeg een unit toe in Supabase om hier te beheren.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {units.map((bu) => (
              <BusinessUnitEditor key={bu.id} bu={bu} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
