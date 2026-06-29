"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import type { ClientListItem } from "@/lib/services/crm/clients";
import { clientDisplayName, clientSubName } from "@/lib/utils/client";
import {
  Search, Filter, Building2, User, RefreshCw,
  Euro, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  ArrowUpDown,
} from "lucide-react";

interface Props {
  initialClients: ClientListItem[];
  total: number;
  currentPage: number;
  limit: number;
  initialQuery: string;
  initialActive?: string;
  initialMaintenance?: string;
  initialType?: string;
}

export default function ClientTable({
  initialClients,
  total,
  currentPage,
  limit,
  initialQuery,
  initialActive,
  initialMaintenance,
  initialType,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState(initialActive ?? "");
  const [maintenanceFilter, setMaintenanceFilter] = useState(initialMaintenance ?? "");
  const [typeFilter, setTypeFilter] = useState(initialType ?? "");

  const totalPages = Math.ceil(total / limit);

  const applyFilters = useCallback(
    (overrides: Record<string, string> = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      const vals: Record<string, string> = {
        q: query,
        active: activeFilter,
        maintenance: maintenanceFilter,
        type: typeFilter,
        page: "1",
        ...overrides,
      };
      Object.entries(vals).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [query, activeFilter, maintenanceFilter, pathname, router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* SEARCH + FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        {/* SEARCH */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#606774]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Zoek op naam, e-mail, telefoon..."
            className="w-full rounded-2xl border border-[#101536]/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[#101536] placeholder-[#606774]/50 outline-none transition focus:border-[#4D7EBA]/40 focus:ring-2 focus:ring-[#4D7EBA]/10"
          />
        </div>

        {/* FILTER: status */}
        <div className="flex items-center gap-1 rounded-2xl border border-[#101536]/10 bg-white p-1">
          {[
            { label: "Alle", value: "" },
            { label: "Actief", value: "true" },
            { label: "Inactief", value: "false" },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setActiveFilter(value); applyFilters({ active: value }); }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeFilter === value
                  ? "bg-[#4D7EBA] text-white shadow-sm"
                  : "text-[#606774] hover:bg-[#F3F5F7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FILTER: type */}
        <div className="flex items-center gap-1 rounded-2xl border border-[#101536]/10 bg-white p-1">
          {[
            { label: "Alle", value: "" },
            { label: "🏢 Bedrijven", value: "company" },
            { label: "👤 Particulieren", value: "private" },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setTypeFilter(value); applyFilters({ type: value }); }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                typeFilter === value
                  ? "bg-[#4D7EBA] text-white shadow-sm"
                  : "text-[#606774] hover:bg-[#F3F5F7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FILTER: maintenance */}
        <button
          onClick={() => {
            const v = maintenanceFilter === "true" ? "" : "true";
            setMaintenanceFilter(v);
            applyFilters({ maintenance: v });
          }}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition ${
            maintenanceFilter === "true"
              ? "border-[#4D7EBA]/30 bg-[#4D7EBA]/08 text-[#4D7EBA]"
              : "border-[#101536]/10 bg-white text-[#606774] hover:bg-[#F3F5F7]"
          }`}
        >
          <RefreshCw size={13} />
          Onderhoudscontract
        </button>

        <button
          onClick={() => applyFilters()}
          className="flex items-center gap-2 rounded-2xl bg-[#101536] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#101536]/85"
        >
          <Filter size={13} />
          Filteren
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/85 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
        {initialClients.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#606774]">Geen klanten gevonden.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 text-left">
                <Th label="Naam" sortKey="name" />
                <Th label="Contactgegevens" />
                <Th label="Stad" />
                <Th label="Laatste afspraak" sortKey="last_appointment" />
                <Th label="Open facturen" sortKey="open_invoices" />
                <Th label="Status" />
                <Th label="" />
              </tr>
            </thead>
            <tbody>
              {initialClients.map((client, i) => (
                <tr
                  key={client.id}
                  className={`border-b border-[#101536]/04 transition hover:bg-[#F3F5F7]/60 ${
                    i === initialClients.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4D7EBA]/15 to-[#95AEC1]/15">
                        {client.client_type === "company"
                          ? <Building2 size={16} className="text-[#4D7EBA]" />
                          : <User size={16} className="text-[#95AEC1]" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-[#101536]">
                          {clientDisplayName(client)}
                        </p>
                        {clientSubName(client) && (
                          <p className="text-xs text-[#606774]">{clientSubName(client)}</p>
                        )}
                      </div>
                      {client.has_maintenance && (
                        <span className="rounded-full bg-[#4D7EBA]/10 px-2 py-0.5 text-[10px] font-semibold text-[#4D7EBA]">
                          Contract
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {client.email && (
                      <p className="text-[#606774]">{client.email}</p>
                    )}
                    {client.phone && (
                      <p className="text-xs text-[#606774]">{client.phone}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[#606774]">{client.city ?? "—"}</td>
                  <td className="px-5 py-4">
                    {client.last_appointment ? (
                      <span className="flex items-center gap-1.5 text-[#606774]">
                        <Calendar size={13} />
                        {new Date(client.last_appointment).toLocaleDateString("nl-NL")}
                      </span>
                    ) : (
                      <span className="text-[#606774]/50">Nog nooit</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {client.open_invoices > 0 ? (
                      <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                        <Euro size={13} />
                        {client.open_invoice_total.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-[#606774]">({client.open_invoices})</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle size={13} />
                        Alles betaald
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {client.active ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle size={11} />
                        Actief
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
                        <XCircle size={11} />
                        Inactief
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/klanten/${client.id}`}
                      className="rounded-xl bg-[#F3F5F7] px-3.5 py-1.5 text-xs font-semibold text-[#101536] transition hover:bg-[#4D7EBA] hover:text-white"
                    >
                      Bekijken
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-[#606774]">
            {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, total)} van {total}
          </p>
          <div className="flex items-center gap-2">
            <PaginationButton
              onClick={() => applyFilters({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={16} />
            </PaginationButton>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <PaginationButton
                  key={p}
                  onClick={() => applyFilters({ page: String(p) })}
                  active={p === currentPage}
                >
                  {p}
                </PaginationButton>
              );
            })}
            <PaginationButton
              onClick={() => applyFilters({ page: String(currentPage + 1) })}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight size={16} />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ label, sortKey }: { label: string; sortKey?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort");
  const currentDir = searchParams.get("dir") ?? "asc";
  const isActive = currentSort === sortKey;

  function handleSort() {
    if (!sortKey) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortKey);
    params.set("dir", isActive && currentDir === "asc" ? "desc" : "asc");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <th
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#606774] ${
        sortKey ? "cursor-pointer select-none hover:text-[#101536]" : ""
      }`}
      onClick={handleSort}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {sortKey && <ArrowUpDown size={12} className={isActive ? "text-[#4D7EBA]" : ""} />}
      </span>
    </th>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled = false,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-medium transition ${
        active
          ? "bg-[#4D7EBA] text-white shadow-sm"
          : disabled
          ? "text-[#606774]/30 cursor-not-allowed"
          : "text-[#606774] hover:bg-[#F3F5F7]"
      }`}
    >
      {children}
    </button>
  );
}
