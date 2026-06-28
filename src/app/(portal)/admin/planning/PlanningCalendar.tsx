"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CalendarAppointment, EmployeeWithColor } from "@/lib/services/planning/appointments";
import WeekView from "./WeekView";
import DayView from "./DayView";
import MonthView from "./MonthView";
import EmployeeView from "./EmployeeView";
import AppointmentModal from "./AppointmentModal";

type ViewType = "dag" | "week" | "maand" | "medewerker";

interface Client {
  id: string;
  contact_name: string;
  company_name: string | null;
  address: string | null;
  city: string | null;
}

interface Props {
  initialAppointments: CalendarAppointment[];
  employees: EmployeeWithColor[];
  clients: Client[];
  startDate: string;
  view: ViewType;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled:   "bg-[#4D7EBA]/15 border-[#4D7EBA] text-[#4D7EBA]",
  in_progress: "bg-amber-50 border-amber-400 text-amber-700",
  completed:   "bg-emerald-50 border-emerald-400 text-emerald-700",
  cancelled:   "bg-red-50 border-red-300 text-red-500",
  no_show:     "bg-gray-100 border-gray-300 text-gray-500",
};

export const STATUS_DOT: Record<string, string> = {
  scheduled:   "bg-[#4D7EBA]",
  in_progress: "bg-amber-400",
  completed:   "bg-emerald-500",
  cancelled:   "bg-red-400",
  no_show:     "bg-gray-400",
};

export { STATUS_COLORS };

function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function startOfMonth(date: string): string {
  return date.slice(0, 8) + "01";
}

function formatDateNL(date: string): string {
  return new Date(date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function weekLabel(startDate: string): string {
  const end = addDays(startDate, 6);
  const s = new Date(startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  const e = new Date(end).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
  return `${s} – ${e}`;
}

function monthLabel(date: string): string {
  return new Date(date + "-01").toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}

export default function PlanningCalendar({ initialAppointments, employees, clients, startDate: initialStart, view: initialView }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(initialAppointments);
  const [view, setView] = useState<ViewType>(initialView);
  const [startDate, setStartDate] = useState(initialStart);
  const [showModal, setShowModal] = useState(false);
  const [newApptDefaults, setNewApptDefaults] = useState<{ date: string; start: string } | undefined>();

  const navigate = useCallback((newStart: string, newView: ViewType) => {
    setStartDate(newStart);
    setView(newView);
    startTransition(() => {
      router.push(`/admin/planning?from=${newStart}&view=${newView}`, { scroll: false });
    });
  }, [router]);

  const prev = () => {
    if (view === "dag")        navigate(addDays(startDate, -1), view);
    else if (view === "week")  navigate(addDays(startDate, -7), view);
    else if (view === "maand") navigate(addDays(startOfMonth(startDate), -1).slice(0, 8) + "01", view);
    else                       navigate(addDays(startDate, -7), view);
  };

  const next = () => {
    if (view === "dag")        navigate(addDays(startDate, 1), view);
    else if (view === "week")  navigate(addDays(startDate, 7), view);
    else if (view === "maand") navigate(addDays(startOfMonth(startDate), 32).slice(0, 8) + "01", view);
    else                       navigate(addDays(startDate, 7), view);
  };

  const goToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    navigate(view === "week" || view === "medewerker" ? startOfWeek(today) : today, view);
  };

  const handleMove = async (id: string, date: string, start: string, end: string) => {
    // Optimistic update
    setAppointments((prev) => prev.map((a) =>
      a.id === id ? { ...a, scheduled_date: date, scheduled_start: start, scheduled_end: end } : a
    ));
    await fetch(`/api/appointments/${id}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_date: date, scheduled_start: start, scheduled_end: end }),
    });
  };

  const handleNewAppt = (date: string, start?: string) => {
    setNewApptDefaults({ date, start: start ?? "09:00" });
    setShowModal(true);
  };

  const handleApptCreated = (newAppt: CalendarAppointment) => {
    setAppointments((prev) => [...prev, newAppt]);
    setShowModal(false);
  };

  const label = view === "dag" ? formatDateNL(startDate)
    : view === "week" || view === "medewerker" ? weekLabel(startDate)
    : monthLabel(startDate);

  const views: { key: ViewType; label: string }[] = [
    { key: "dag", label: "Dag" },
    { key: "week", label: "Week" },
    { key: "maand", label: "Maand" },
    { key: "medewerker", label: "Medewerker" },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-2xl border border-[#101536]/10 bg-white p-1 shadow-sm">
          <button onClick={prev} className="rounded-xl px-3 py-1.5 text-[#606774] hover:bg-[#F3F5F7] transition">‹</button>
          <button onClick={goToday} className="rounded-xl px-3 py-1.5 text-sm font-medium text-[#101536] hover:bg-[#F3F5F7] transition">Vandaag</button>
          <button onClick={next} className="rounded-xl px-3 py-1.5 text-[#606774] hover:bg-[#F3F5F7] transition">›</button>
        </div>

        <h2 className="flex-1 text-base font-semibold text-[#101536] capitalize">{label}</h2>

        {/* View switcher */}
        <div className="flex gap-1 rounded-2xl border border-[#101536]/10 bg-white p-1 shadow-sm">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => navigate(view === "dag" ? startDate : view === "maand" ? startDate : startDate, v.key)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${view === v.key ? "bg-[#101536] text-white" : "text-[#606774] hover:bg-[#F3F5F7]"}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleNewAppt(startDate)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.3)] transition hover:-translate-y-0.5"
        >
          <span>+</span> Nieuwe afspraak
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries({ scheduled: "Gepland", in_progress: "Onderweg/Bezig", completed: "Afgerond", cancelled: "Geannuleerd" }).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${STATUS_DOT[k]}`} />
            <span className="text-xs text-[#606774]">{v}</span>
          </div>
        ))}
      </div>

      {/* Calendar body */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
        {view === "dag" && (
          <DayView
            date={startDate}
            appointments={appointments.filter((a) => a.scheduled_date === startDate)}
            onMove={handleMove}
            onNewAppt={handleNewAppt}
          />
        )}
        {view === "week" && (
          <WeekView
            startDate={startDate}
            appointments={appointments}
            onMove={handleMove}
            onNewAppt={handleNewAppt}
          />
        )}
        {view === "maand" && (
          <MonthView
            startDate={startDate}
            appointments={appointments}
            onNewAppt={handleNewAppt}
          />
        )}
        {view === "medewerker" && (
          <EmployeeView
            startDate={startDate}
            appointments={appointments}
            employees={employees}
            onMove={handleMove}
            onNewAppt={handleNewAppt}
          />
        )}
      </div>

      {showModal && (
        <AppointmentModal
          defaultDate={newApptDefaults?.date ?? startDate}
          defaultStart={newApptDefaults?.start ?? "09:00"}
          clients={clients}
          employees={employees}
          onCreated={handleApptCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
