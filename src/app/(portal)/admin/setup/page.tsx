import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCompany } from "@/lib/services/crm/company";
import SetupWizard from "./SetupWizard";

export const metadata: Metadata = { title: "Bedrijf instellen | More Clean" };

export default async function SetupPage() {
  await requireAdmin();
  const company = await getCompany();

  return <SetupWizard initialCompany={company} />;
}
