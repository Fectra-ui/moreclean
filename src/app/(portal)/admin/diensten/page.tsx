import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCompanyId } from "@/lib/auth/getCompanyId";
import { createServiceClient } from "@/lib/supabase/server";
import type { Service } from "@/types/database";
import DienstenClient from "./DienstenClient";

export const metadata: Metadata = { title: "Dienstencatalogus" };

export default async function DienstenPage() {
  await requireAdmin();
  const companyId = await getCompanyId();
  const svc = createServiceClient();

  const { data } = await svc
    .from("services")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order")
    .order("name");

  return <DienstenClient initialServices={(data ?? []) as Service[]} companyId={companyId} />;
}
