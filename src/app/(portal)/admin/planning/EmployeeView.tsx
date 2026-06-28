"use client";

import { useRef } from "react";
import Link from "next/link";
import type { CalendarAppointment, EmployeeWithColor } from "@/lib/services/planning/appointments";
import { HOUR_START, HOUR_END, PX_PER_MIN, timeToMinutes, minutesToTime } from "./WeekView";

function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DAYS_NL = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

interface Props {
  startDate: string;
  appointments: CalendarAppointment[];
  employees: EmployeeWithColor[];
  onMove: (id: string, date: string, start: string, end: string) => void;
  onNewAppt: (date: string, start: string) => void;
}

export default function EmployeeView({ startDate, appointments, employees, onMove, onNewAppt }: Props) {
  const dragging = useRef<{ id: string; offsetMin: number; duration: number } | null>(null);
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const totalHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN;
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  const today = new Date().toISOString().slice(0, 10);

  const getTop = (s: string) => Math.max(0, (timeToMinutes(s) - HOUR_START * 60) * PX_PER_MIN);
  const getHeight = (s: string, e: string) => Math.max(24, (timeToMinutes(e) - timeToMinutes(s)) * PX_PER_MIN);

  const handleDragStart = (ev: React.DragEvent, appt: CalendarAppointment) => {
    const offsetMin = Math.floor(ev.nativeEvent.offsetY / PX_PER_MIN);
    dragging.current = {
      id: appt.id,
      offsetMin,
      duration: timeToMinutes(appt.scheduled_end) - timeToMinutes(appt.scheduled_start),
    };
    ev.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (ev: React.DragEvent, date: string) => {
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

  // Total work minutes per employee per day
  const getTotals = (empId: string, date: string) => {
    const empAppts = appointments.filter(
      (a) => a.scheduled_date === date && a.employees.some((e) => e.employee_id === empId)
    );
    const totalMin = empAppts.reduce((sum, a) => sum + timeToMinutes(a.scheduled_end) - timeToMinutes(a.scheduled_start), 0);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return totalMin > 0 ? `${h}u${m > 0 ? m : ""}` : null;
  };

  return (
    <div className="flex h-full overflow-auto">
      {/* Employee columns per day — horizontal scroll */}
      <div className="flex min-w-full">
        {/* Hour gutter */}
        <div className="sticky left-0 z-20 w-12 shrink-0 bg-white">
          <div className="h-16 border-b border-[#101536]/08" /> {/* header placeholder */}
          {hours.map((h) => (
            <div key={h} className="relative border-b border-[#101536]/06" style={{ height: 60 * PX_PER_MIN }}>
              <span className="absolute -top-2 right-1 text-[10px] text-[#606774]">{h}:00</span>
            </div>
          ))}
        </div>

        {/* One column per employee per day */}
        {days.map((date, di) => {
          const isToday = date === today;
          return (
            <div key={date} className="flex shrink-0 flex-col border-r border-[#101536]/08 last:border-r-0" style={{ minWidth: employees.length * 120 }}>
              {/* Day header */}
              <div className={`flex items-center justify-center border-b border-[#101536]/08 h-16 px-2 ${isToday ? "bg-[#4D7EBA]/05" : ""}`}>
                <div className="text-center">
                  <p className="text-xs text-[#606774]">{DAYS_NL[di]}</p>
                  <p className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-[#4D7EBA] text-white" : "text-[#101536]"}`}>
                    {new Date(date).getDate()}
                  </p>
                </div>
              </div>

              {/* Employee sub-columns */}
              <div className="flex flex-1" style={{ height: totalHeight }}>
                {employees.map((emp) => {
                  const empAppts = appointments.filter(
                    (a) => a.scheduled_date === date && a.employees.some((e) => e.employee_id === emp.id)
                  );
                  const totals = getTotals(emp.id, date);

                  return (
                    <div
                      key={emp.id}
                      className="relative border-r border-[#101536]/05 last:border-r-0"
                      style={{ width: 120, height: totalHeight }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, date)}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("a")) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const startMin = HOUR_START * 60 + Math.round((y / PX_PER_MIN) / 15) * 15;
                        onNewAppt(date, minutesToTime(startMin));
                      }}
                    >
                      {/* Employee name header */}
                      <div className="sticky top-16 z-10 flex items-center gap-1.5 border-b border-[#101536]/06 bg-white/90 px-1.5 py-1.5 backdrop-blur">
                        <span
                          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: emp.calendar_color }}
                        >
                          {(emp.first_name?.[0] ?? "") + (emp.last_name?.[0] ?? "")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-[#101536]">
                            {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Medewerker"}
                          </p>
                          {totals && <p className="text-[9px] text-[#606774]">{totals}</p>}
                        </div>
                      </div>

                      {hours.map((h) => (
                        <div
                          key={h}
                          className="pointer-events-none absolute inset-x-0 border-b border-[#101536]/04"
                          style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN, height: 60 * PX_PER_MIN }}
                        />
                      ))}

                      {empAppts.map((appt) => (
                        <Link
                          key={appt.id}
                          href={`/admin/afspraken/${appt.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, appt)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-x-1 overflow-hidden rounded-lg px-1.5 py-1 text-[10px] font-medium text-white shadow-sm transition hover:shadow-md hover:z-10 cursor-grab"
                          style={{
                            top: getTop(appt.scheduled_start),
                            height: getHeight(appt.scheduled_start, appt.scheduled_end),
                            backgroundColor: emp.calendar_color,
                            zIndex: 5,
                          }}
                        >
                          <p className="truncate leading-tight">{appt.client_name}</p>
                          <p className="opacity-80">{appt.scheduled_start.slice(0,5)}</p>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
