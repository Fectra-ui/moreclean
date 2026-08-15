import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Systeemdiagnose" };

interface Check {
  label: string;
  group: string;
  status: "ok" | "fail" | "warn";
  detail?: string;
}

export default async function SystemPage() {
  await requireAdmin();

  const authClient = await createClient();
  const svc = createServiceClient();

  const { data: { user } } = await authClient.auth.getUser();
  const checks: Check[] = [];

  // AUTH
  checks.push({
    group: "Auth",
    label: "Gebruiker ingelogd",
    status: user ? "ok" : "fail",
    detail: user?.email,
  });

  // PROFILE via service client
  const { data: profile } = user
    ? await svc.from("profiles").select("role, company_id").eq("id", user.id).single()
    : { data: null };

  checks.push({
    group: "Auth",
    label: "Profiel geladen (service client)",
    status: profile ? "ok" : "fail",
    detail: profile ? `role=${profile.role}` : "null",
  });
  checks.push({
    group: "Auth",
    label: "role = admin",
    status: profile?.role === "admin" ? "ok" : "fail",
    detail: profile?.role ?? "—",
  });
  checks.push({
    group: "Auth",
    label: "company_id aanwezig in profiel",
    status: profile?.company_id ? "ok" : "warn",
    detail: profile?.company_id ?? "null — auth_company_id() geeft null",
  });

  // RLS HELPER FUNCTIONS via normale client (roept Postgres func aan)
  const { data: rlsRole } = user
    ? await authClient.rpc("auth_role" as never)
    : { data: null };
  const { data: rlsCompanyId } = user
    ? await authClient.rpc("auth_company_id" as never)
    : { data: null };

  checks.push({
    group: "RLS helpers",
    label: "auth_role()",
    status: rlsRole ? "ok" : "fail",
    detail: String(rlsRole ?? "null"),
  });
  checks.push({
    group: "RLS helpers",
    label: "auth_company_id()",
    status: rlsCompanyId ? "ok" : "fail",
    detail: String(rlsCompanyId ?? "null — RLS company-checks falen"),
  });

  // RLS DATA CHECKS via normale client (mag niet falen als RLS goed staat)
  const companyId = profile?.company_id ?? (rlsCompanyId as string | null);

  const [clientsNormal, servicesNormal, quotesNormal] = companyId
    ? await Promise.all([
        authClient.from("clients").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        authClient.from("services").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        authClient.from("quotes").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ])
    : [{ count: null, error: { message: "geen company_id" } }, { count: null, error: { message: "geen company_id" } }, { count: null, error: { message: "geen company_id" } }];

  checks.push({
    group: "RLS data (normale client)",
    label: "clients leesbaar",
    status: clientsNormal.error ? "fail" : "ok",
    detail: clientsNormal.error ? clientsNormal.error.message : `${clientsNormal.count} rijen`,
  });
  checks.push({
    group: "RLS data (normale client)",
    label: "services leesbaar",
    status: servicesNormal.error ? "fail" : "ok",
    detail: servicesNormal.error ? servicesNormal.error.message : `${servicesNormal.count} rijen`,
  });
  checks.push({
    group: "RLS data (normale client)",
    label: "quotes leesbaar",
    status: quotesNormal.error ? "fail" : "ok",
    detail: quotesNormal.error ? quotesNormal.error.message : `${quotesNormal.count} rijen`,
  });

  // SERVICE CLIENT DATA CHECKS
  const [clientsSvc, servicesSvc] = companyId
    ? await Promise.all([
        svc.from("clients").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        svc.from("services").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ])
    : [{ count: null, error: { message: "geen company_id" } }, { count: null, error: { message: "geen company_id" } }];

  checks.push({
    group: "Service client data",
    label: "clients leesbaar",
    status: clientsSvc.error ? "fail" : "ok",
    detail: clientsSvc.error ? clientsSvc.error.message : `${clientsSvc.count} rijen`,
  });
  checks.push({
    group: "Service client data",
    label: "services leesbaar",
    status: servicesSvc.error ? "fail" : "ok",
    detail: servicesSvc.error ? servicesSvc.error.message : `${servicesSvc.count} rijen`,
  });

  // STORAGE
  const { data: storageFiles, error: storageErr } = await svc.storage
    .from("company-assets")
    .list(companyId ?? "", { limit: 1 });
  checks.push({
    group: "Storage",
    label: "company-assets bucket toegankelijk",
    status: storageErr ? "fail" : "ok",
    detail: storageErr ? storageErr.message : `${storageFiles?.length ?? 0} bestanden`,
  });

  // GROUPS
  const groups = [...new Set(checks.map((c) => c.group))];
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Systeemdiagnose</h1>
        <p className="mt-1 text-sm text-[#606774]">
          Controleert auth, RLS-helpers, dataleestoegang en storage.
          {failCount > 0 && <span className="ml-2 font-semibold text-red-600">{failCount} fout{failCount !== 1 ? "en" : ""}</span>}
          {warnCount > 0 && <span className="ml-2 font-semibold text-amber-600">{warnCount} waarschuwing{warnCount !== 1 ? "en" : ""}</span>}
          {failCount === 0 && warnCount === 0 && <span className="ml-2 font-semibold text-emerald-600">Alles in orde</span>}
        </p>
      </div>

      {groups.map((group) => (
        <section key={group} className="rounded-[20px] border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#101536]/06 bg-[#F8F9FB]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">{group}</p>
          </div>
          <div className="divide-y divide-[#101536]/06">
            {checks.filter((c) => c.group === group).map((check) => (
              <div key={check.label} className="flex items-center gap-3 px-5 py-3.5">
                {check.status === "ok" && <CheckCircle size={16} className="shrink-0 text-emerald-500" />}
                {check.status === "fail" && <XCircle size={16} className="shrink-0 text-red-500" />}
                {check.status === "warn" && <AlertCircle size={16} className="shrink-0 text-amber-500" />}
                <span className="flex-1 text-sm text-[#101536]">{check.label}</span>
                {check.detail && (
                  <span className="text-xs text-[#606774] font-mono truncate max-w-[260px]">{check.detail}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-[#606774]">
        Pagina wordt bij elke refresh opnieuw berekend. Ververs om de actuele status te zien.
      </p>
    </div>
  );
}
