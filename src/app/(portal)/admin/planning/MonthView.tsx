"use client";

import Link from "next/link";
import type { CalendarAppointment } from "@/lib/services/planning/appointments";
import { STATUS_DOT } from "./PlanningCalendar";

function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DAYS_NL = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

interface Props {
  startDate: string;
  appointments: CalendarAppointment[];
  onNewAppt: (date: string, start: string) => void;
}

export default function MonthView({ startDate, appointments, onNewAppt }: Props) {
  // Build 6-week grid starting from Monday before the first of the month
  const firstOfMonth = new Date(startDate.slice(0, 8) + "01");
  const monthNumber = firstOfMonth.getMonth();
  const yearNumber = firstOfMonth.getFullYear();

  // Monday of the week containing the 1st
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7));

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const today = new Date().toISOString().slice(0, 10);

  const apptsByDate = appointments.reduce<Record<string, CalendarAppointment[]>>((acc, a) => {
    (acc[a.scheduled_date] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#101536]/08">
        {DAYS_NL.map((d) => (
          <div key={d} className="border-r border-[#101536]/06 px-3 py-2 text-center text-xs font-semibold text-[#606774] last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-auto">
        {cells.map((date) => {
          const isCurrentMonth = new Date(date).getMonth() === monthNumber;
          const isToday = date === today;
          const dayAppts = apptsByDate[date] ?? [];

          return (
            <div
              key={date}
              onClick={() => onNewAppt(date, "09:00")}
              className={`border-r border-b border-[#101536]/06 p-1.5 last-of-type:border-r-0 cursor-pointer hover:bg-[#F3F5F7]/50 transition min-h-[80px] ${!isCurrentMonth ? "bg-[#F3F5F7]/30" : ""}`}
            >
              <p className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-[#4D7EBA] text-white" : isCurrentMonth ? "text-[#101536]" : "text-[#606774]/40"}`}>
                {new Date(date).getDate()}
              </p>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <Link
                    key={a.id}
                    href={`/admin/afspraken/${a.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium hover:bg-[#101536]/05 transition"
                  >
                    <span className={`inline-block size-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? STATUS_DOT.scheduled}`} />
                    <span className="truncate text-[#101536]">{a.scheduled_start.slice(0,5)} {a.client_name}</span>
                  </Link>
                ))}
                {dayAppts.length > 3 && (
                  <p className="px-1 text-[10px] text-[#606774]">+{dayAppts.length - 3} meer</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
