import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCompany } from "@/lib/services/crm/company";
import { getSetupProgress } from "@/lib/services/setup";
import SetupWizard from "./SetupWizard";

export const metadata: Metadata = { title: "Bedrijf instellen | More Clean" };

export default async function SetupPage() {
  await requireAdmin();
  const [company, { progress }] = await Promise.all([
    getCompany(),
    getSetupProgress(),
  ]);

  return <SetupWizard initialCompany={company} initialProgress={progress} />;
}
