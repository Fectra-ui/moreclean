"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";
import type { CalendarAppointment, EmployeeWithColor } from "@/lib/services/planning/appointments";

interface Client {
  id: string;
  contact_name: string;
  company_name: string | null;
  address: string | null;
  city: string | null;
}

interface Props {
  defaultDate: string;
  defaultStart: string;
  clients: Client[];
  employees: EmployeeWithColor[];
  onCreated: (appt: CalendarAppointment) => void;
  onClose: () => void;
}

export default function AppointmentModal({ defaultDate, defaultStart, clients, employees, onCreated, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(() => {
    const [h, m] = defaultStart.split(":").map(Number);
    const end = h * 60 + m + 120;
    return `${Math.floor(end / 60).toString().padStart(2, "0")}:${(end % 60).toString().padStart(2, "0")}`;
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return (c.company_name ?? c.contact_name).toLowerCase().includes(q) || c.contact_name.toLowerCase().includes(q);
  }).slice(0, 8);

  const selectedClient = clients.find((c) => c.id === clientId);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { setError("Selecteer een klant"); return; }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        scheduled_date: date,
        scheduled_start: startTime,
        scheduled_end: endTime,
        address: selectedClient?.address ?? null,
        city: selectedClient?.city ?? null,
        notes: notes || null,
        employee_ids: selectedEmployees,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Fout bij aanmaken"); setLoading(false); return; }

    // Build optimistic CalendarAppointment
    const newAppt: CalendarAppointment = {
      id: data.id,
      status: "scheduled",
      scheduled_date: date,
      scheduled_start: startTime,
      scheduled_end: endTime,
      estimated_duration: null,
      address: selectedClient?.address ?? null,
      city: selectedClient?.city ?? null,
      notes: notes || null,
      client_id: clientId,
      client_name: selectedClient?.company_name || selectedClient?.contact_name || "Klant",
      client_phone: null,
      employees: employees
        .filter((e) => selectedEmployees.includes(e.id))
        .map((e, i) => ({
          employee_id: e.id,
          name: [e.first_name, e.last_name].filter(Boolean).join(" ") || "Medewerker",
          color: e.calendar_color,
          role: i === 0 ? "lead" : "assistant",
        })),
    };
    onCreated(newAppt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div ref={modalRef} className="w-full max-w-lg rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#101536]/08 px-6 py-4">
          <h2 className="text-lg font-bold text-[#101536]">Nieuwe afspraak</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-[#606774] hover:bg-[#F3F5F7] transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Client search */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#101536]">Klant <span className="text-red-500">*</span></label>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-2xl border border-[#4D7EBA]/30 bg-[#4D7EBA]/05 px-4 py-2.5">
                <div>
                  <p className="font-semibold text-[#101536]">{selectedClient.company_name || selectedClient.contact_name}</p>
                  {selectedClient.city && <p className="text-xs text-[#606774]">{selectedClient.address}, {selectedClient.city}</p>}
                </div>
                <button type="button" onClick={() => { setClientId(""); setClientSearch(""); }} className="text-xs text-[#606774] hover:text-red-500">Wijzigen</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  autoFocus
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Zoek op naam, bedrijf..."
                  className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/10"
                />
                {clientSearch.length > 0 && (
                  <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-2xl border border-[#101536]/08 bg-white shadow-lg">
                    {filteredClients.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-[#606774]">Geen klanten gevonden</li>
                    ) : filteredClients.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => { setClientId(c.id); setClientSearch(""); }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#F3F5F7] transition"
                        >
                          <p className="font-medium text-[#101536]">{c.company_name || c.contact_name}</p>
                          {c.city && <p className="text-xs text-[#606774]">{c.city}</p>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Datum</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Einde</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
            </div>
          </div>

          {/* Employees */}
          {employees.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#101536]">Medewerkers</label>
              <div className="flex flex-wrap gap-2">
                {employees.map((emp) => {
                  const selected = selectedEmployees.includes(emp.id);
                  const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Medewerker";
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${selected ? "text-white shadow-sm" : "bg-[#F3F5F7] text-[#606774] hover:bg-[#101536]/08"}`}
                      style={selected ? { backgroundColor: emp.calendar_color } : {}}
                    >
                      <span className="inline-flex size-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                        {(emp.first_name?.[0] ?? "") + (emp.last_name?.[0] ?? "")}
                      </span>
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#101536]">Notities</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Instructies voor de medewerker..."
              className="w-full resize-none rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/10"
            />
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-2xl border border-[#101536]/10 px-5 py-2.5 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.3)] transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Afspraak aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
