import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { getBusinessUnits } from "@/lib/services/crm/businessUnits";
import { getCompany } from "@/lib/services/crm/company";
import BusinessUnitEditor from "./BusinessUnitEditor";
import CompanySettingsForm from "./CompanySettingsForm";

export const metadata: Metadata = { title: "Instellingen" };

export default async function InstellingenPage() {
  const { user } = await requireAdmin();

  const [company, units] = await Promise.all([
    getCompany(),
    getBusinessUnits(true),
  ]);

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Instellingen</h1>
        <p className="mt-1 text-sm text-[#606774]">Bedrijfsgegevens, logo, factuurinstellingen en bedrijfsunits</p>
      </div>

      {/* Bedrijfsgegevens */}
      {company && <CompanySettingsForm company={company} />}

      {/* Business Units */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#101536]">Bedrijfsunits</h2>
          <p className="text-sm text-[#606774]">Elke unit heeft eigen branding op facturen en offertes.</p>
        </div>
        <div className="space-y-3">
          {units.map((bu) => (
            <BusinessUnitEditor key={bu.id} bu={bu} />
          ))}
        </div>
      </section>
    </div>
  );
}
