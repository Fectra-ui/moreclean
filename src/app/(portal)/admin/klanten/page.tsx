import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getClientList } from "@/lib/services/crm/clients";
import { getCompanyId } from "@/lib/auth/getCompanyId";
import ClientTable from "./ClientTable";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = { title: "Klanten" };

interface SearchParams {
  q?: string;
  active?: string;
  maintenance?: string;
  type?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

export default async function KlantenPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const companyId = await getCompanyId();
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1") - 1;
  const limit = 25;

  const { clients, total } = await getClientList(companyId, {
    query: sp.q,
    active: sp.active === "false" ? false : sp.active === "true" ? true : undefined,
    hasMaintenanceContract: sp.maintenance === "true" ? true : undefined,
    clientType: (sp.type as "company" | "private") ?? undefined,
    sortBy: (sp.sort as "name" | "created_at") ?? "name",
    sortDir: (sp.dir as "asc" | "desc") ?? "asc",
    limit,
    offset: page * limit,
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Klanten</h1>
          <p className="mt-1 text-sm text-[#606774]">{total} klanten in totaal</p>
        </div>
        <Link
          href="/admin/klanten/nieuw"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.25)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(77,126,186,.32)]"
        >
          <UserPlus size={16} />
          Nieuwe klant
        </Link>
      </div>

      {/* TABLE (client component handles search/filter) */}
      <ClientTable
        initialClients={clients}
        total={total}
        currentPage={page + 1}
        limit={limit}
        initialQuery={sp.q ?? ""}
        initialActive={sp.active}
        initialMaintenance={sp.maintenance}
        initialType={sp.type}
      />
    </div>
  );
}
