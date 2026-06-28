"use client";

import { useRef } from "react";
import Link from "next/link";
import type { CalendarAppointment } from "@/lib/services/planning/appointments";
import { STATUS_COLORS, STATUS_DOT } from "./PlanningCalendar";

const HOUR_START = 7;   // 07:00
const HOUR_END   = 20;  // 20:00
const PX_PER_MIN = 1.2; // pixel per minute

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DAYS_NL = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const DAYS_FULL = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

interface Props {
  startDate: string;
  appointments: CalendarAppointment[];
  onMove: (id: string, date: string, start: string, end: string) => void;
  onNewAppt: (date: string, start: string) => void;
}

export default function WeekView({ startDate, appointments, onMove, onNewAppt }: Props) {
  const dragging = useRef<{ id: string; offsetMin: number; duration: number } | null>(null);
  const totalHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN;
  const today = new Date().toISOString().slice(0, 10);

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const getTop = (start: string) =>
    Math.max(0, (timeToMinutes(start) - HOUR_START * 60) * PX_PER_MIN);

  const getHeight = (start: string, end: string) => {
    const dur = Math.max(30, timeToMinutes(end) - timeToMinutes(start));
    return dur * PX_PER_MIN;
  };

  const handleDragStart = (e: React.DragEvent, appt: CalendarAppointment) => {
    const offsetMin = Math.floor(e.nativeEvent.offsetY / PX_PER_MIN);
    const duration = timeToMinutes(appt.scheduled_end) - timeToMinutes(appt.scheduled_start);
    dragging.current = { id: appt.id, offsetMin, duration };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, date: string, colEl: HTMLElement) => {
    e.preventDefault();
    if (!dragging.current) return;
    const rect = colEl.getBoundingClientRect();
    const yInCol = e.clientY - rect.top;
    const totalMin = Math.round((yInCol / PX_PER_MIN) / 15) * 15; // snap to 15 min
    const startMin = Math.max(HOUR_START * 60, HOUR_START * 60 + totalMin - dragging.current.offsetMin);
    const endMin = startMin + dragging.current.duration;
    onMove(dragging.current.id, date, minutesToTime(startMin), minutesToTime(endMin));
    dragging.current = null;
  };

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, date: string) => {
    if ((e.target as HTMLElement).closest("a, button, [data-appt]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMin = Math.round((y / PX_PER_MIN) / 15) * 15;
    const startMin = HOUR_START * 60 + totalMin;
    onNewAppt(date, minutesToTime(startMin));
  };

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Day headers */}
      <div className="sticky top-0 z-20 grid border-b border-[#101536]/08 bg-white" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
        <div className="border-r border-[#101536]/06" />
        {days.map((date, i) => {
          const d = new Date(date);
          const isToday = date === today;
          return (
            <div key={date} className={`border-r border-[#101536]/06 px-2 py-3 text-center last:border-r-0 ${isToday ? "bg-[#4D7EBA]/05" : ""}`}>
              <p className="text-xs text-[#606774]">{DAYS_NL[i]}</p>
              <p className={`mt-0.5 inline-flex size-8 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-[#4D7EBA] text-white" : "text-[#101536]"}`}>
                {d.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="relative flex flex-1" style={{ height: totalHeight }}>
        {/* Hour labels */}
        <div className="sticky left-0 z-10 w-[52px] shrink-0 bg-white">
          {hours.map((h) => (
            <div
              key={h}
              className="relative border-b border-[#101536]/06 text-right pr-2"
              style={{ height: 60 * PX_PER_MIN }}
            >
              <span className="absolute -top-2 right-2 text-[10px] text-[#606774]">{h}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((date) => {
          const dayAppts = appointments.filter((a) => a.scheduled_date === date);
          return (
            <div
              key={date}
              className="relative flex-1 border-r border-[#101536]/06 last:border-r-0"
              style={{ height: totalHeight }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, date, e.currentTarget)}
              onClick={(e) => handleColumnClick(e, date)}
            >
              {/* Hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute inset-x-0 border-b border-[#101536]/05"
                  style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN, height: 60 * PX_PER_MIN }}
                />
              ))}

              {/* Appointments */}
              {dayAppts.map((appt) => (
                <Link
                  key={appt.id}
                  href={`/admin/afspraken/${appt.id}`}
                  data-appt="1"
                  draggable
                  onDragStart={(e) => handleDragStart(e, appt)}
                  className={`absolute inset-x-1 overflow-hidden rounded-lg border-l-2 px-2 py-1 text-xs shadow-sm transition hover:shadow-md hover:z-10 cursor-grab active:cursor-grabbing ${STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled}`}
                  style={{
                    top: getTop(appt.scheduled_start),
                    height: Math.max(24, getHeight(appt.scheduled_start, appt.scheduled_end)),
                    zIndex: 5,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="truncate font-semibold leading-tight">{appt.client_name}</p>
                  <p className="truncate opacity-75">{appt.scheduled_start.slice(0,5)} – {appt.scheduled_end.slice(0,5)}</p>
                  {appt.employees.length > 0 && (
                    <div className="mt-0.5 flex gap-0.5">
                      {appt.employees.slice(0, 3).map((e) => (
                        <span
                          key={e.employee_id}
                          className="inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: e.color }}
                          title={e.name}
                        >
                          {e.name[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { DAYS_FULL, timeToMinutes, minutesToTime, HOUR_START, HOUR_END, PX_PER_MIN };
