"use client";

import Link from "next/link";
import type { CalendarAppointment } from "@/lib/services/planning/appointments";
import { STATUS_COLORS } from "./PlanningCalendar";
import { HOUR_START, HOUR_END, PX_PER_MIN, timeToMinutes, minutesToTime } from "./WeekView";
import { useRef } from "react";

interface Props {
  date: string;
  appointments: CalendarAppointment[];
  onMove: (id: string, date: string, start: string, end: string) => void;
  onNewAppt: (date: string, start: string) => void;
}

export default function DayView({ date, appointments, onMove, onNewAppt }: Props) {
  const dragging = useRef<{ id: string; offsetMin: number; duration: number } | null>(null);
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const totalHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN;

  const getTop = (s: string) => Math.max(0, (timeToMinutes(s) - HOUR_START * 60) * PX_PER_MIN);
  const getHeight = (s: string, e: string) => Math.max(30, (timeToMinutes(e) - timeToMinutes(s)) * PX_PER_MIN);

  const handleDragStart = (ev: React.DragEvent, appt: CalendarAppointment) => {
    const offsetMin = Math.floor(ev.nativeEvent.offsetY / PX_PER_MIN);
    dragging.current = {
      id: appt.id,
      offsetMin,
      duration: timeToMinutes(appt.scheduled_end) - timeToMinutes(appt.scheduled_start),
    };
    ev.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    if (!dragging.current) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const y = ev.clientY - rect.top;
    const totalMin = Math.round((y / PX_PER_MIN) / 15) * 15;
    const startMin = Math.max(HOUR_START * 60, HOUR_START * 60 + totalMin - dragging.current.offsetMin);
    const endMin = startMin + dragging.current.duration;
    onMove(dragging.current.id, date, minutesToTime(startMin), minutesToTime(endMin));
    dragging.current = null;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a, [data-appt]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startMin = HOUR_START * 60 + Math.round((y / PX_PER_MIN) / 15) * 15;
    onNewAppt(date, minutesToTime(startMin));
  };

  return (
    <div className="flex h-full overflow-auto">
      {/* Hour labels */}
      <div className="w-14 shrink-0 bg-white">
        {hours.map((h) => (
          <div key={h} className="relative border-b border-[#101536]/06" style={{ height: 60 * PX_PER_MIN }}>
            <span className="absolute -top-2 right-2 text-[10px] text-[#606774]">{h}:00</span>
          </div>
        ))}
      </div>

      {/* Main column */}
      <div
        className="relative flex-1"
        style={{ height: totalHeight }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {hours.map((h) => (
          <div
            key={h}
            className="pointer-events-none absolute inset-x-0 border-b border-[#101536]/06"
            style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN, height: 60 * PX_PER_MIN }}
          />
        ))}

        {appointments.map((appt) => (
          <Link
            key={appt.id}
            href={`/admin/afspraken/${appt.id}`}
            data-appt="1"
            draggable
            onDragStart={(e) => handleDragStart(e, appt)}
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-x-2 overflow-hidden rounded-xl border-l-4 px-3 py-2 shadow-sm transition hover:shadow-md hover:z-10 cursor-grab active:cursor-grabbing ${STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled}`}
            style={{ top: getTop(appt.scheduled_start), height: getHeight(appt.scheduled_start, appt.scheduled_end), zIndex: 5 }}
          >
            <p className="font-semibold">{appt.client_name}</p>
            <p className="text-xs opacity-75">{appt.scheduled_start.slice(0,5)} – {appt.scheduled_end.slice(0,5)}</p>
            {!!appt.address && <p className="text-xs opacity-60 truncate">{appt.address}, {appt.city}</p>}
            <div className="mt-1 flex gap-1">
              {appt.employees.map((e) => (
                <span
                  key={e.employee_id}
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: e.color }}
                >
                  {e.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
