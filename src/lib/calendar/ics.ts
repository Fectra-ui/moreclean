// ============================================================
// ICS GENERATOR
// Genereert RFC 5545-conforme .ics bestanden voor afspraken.
// Ondersteunt: Apple Agenda, Google Calendar, Outlook.
//
// Geen externe dependencies — puur string-manipulatie.
// ============================================================

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsDateLocal(dateStr: string, timeStr: string | null): string {
  if (!timeStr) {
    // All-day event
    return dateStr.replace(/-/g, "");
  }
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  return icsDate(dt);
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Vouw lange regels conform RFC 5545 (max 75 octetten per regel)
function fold(line: string): string {
  const max = 74;
  if (line.length <= max) return line;
  let result = line.slice(0, max);
  let remaining = line.slice(max);
  while (remaining.length > 0) {
    result += "\r\n " + remaining.slice(0, max - 1);
    remaining = remaining.slice(max - 1);
  }
  return result;
}

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string;       // ISO date: "2025-06-15"
  startTime?: string;    // "09:00"
  dtend?: string;        // ISO date (optioneel, anders dtstart)
  endTime?: string;      // "11:00"
  organizer?: { name: string; email: string };
  url?: string;
}

export function generateIcs(event: IcsEvent): string {
  const now = icsDate(new Date());
  const start = icsDateLocal(event.dtstart, event.startTime ?? null);
  const endDate = event.dtend ?? event.dtstart;
  const end = icsDateLocal(endDate, event.endTime ?? event.startTime ?? null);

  const isAllDay = !event.startTime;

  const dtStartProp = isAllDay
    ? `DTSTART;VALUE=DATE:${start}`
    : `DTSTART:${start}`;

  const dtEndProp = isAllDay
    ? `DTEND;VALUE=DATE:${end}`
    : `DTEND:${end}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//More Clean//Afspraakbevestiging//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    fold(`UID:${event.uid}@moreclean.nl`),
    `DTSTAMP:${now}`,
    fold(dtStartProp),
    fold(dtEndProp),
    fold(`SUMMARY:${escapeIcs(event.summary)}`),
    ...(event.description ? [fold(`DESCRIPTION:${escapeIcs(event.description)}`)] : []),
    ...(event.location ? [fold(`LOCATION:${escapeIcs(event.location)}`)] : []),
    ...(event.url ? [fold(`URL:${event.url}`)] : []),
    ...(event.organizer
      ? [fold(`ORGANIZER;CN=${escapeIcs(event.organizer.name)}:mailto:${event.organizer.email}`)]
      : []),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

// ---- Helpers voor More Clean context ----

export function appointmentToIcs(appt: {
  id: string;
  clientName: string;
  scheduledDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  address: string | null;
  notes?: string | null;
}): string {
  return generateIcs({
    uid: appt.id,
    summary: `More Clean – ${appt.clientName}`,
    description: appt.notes ?? `Schoonmaakwerkzaamheden bij ${appt.clientName}`,
    location: appt.address ?? undefined,
    dtstart: appt.scheduledDate,
    startTime: appt.scheduledStart?.slice(0, 5) ?? undefined,
    dtend: appt.scheduledDate,
    endTime: appt.scheduledEnd?.slice(0, 5) ?? undefined,
    organizer: { name: "More Clean", email: "info@moreclean.nl" },
  });
}

// Google Calendar deep-link (opent in nieuwe tab, geen OAuth nodig)
export function googleCalendarUrl(appt: {
  clientName: string;
  scheduledDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  address: string | null;
}): string {
  const dateStr = appt.scheduledDate.replace(/-/g, "");
  let dates: string;

  if (appt.scheduledStart) {
    const start = icsDateLocal(appt.scheduledDate, appt.scheduledStart);
    const end = icsDateLocal(appt.scheduledDate, appt.scheduledEnd ?? appt.scheduledStart);
    dates = `${start}/${end}`;
  } else {
    const next = new Date(appt.scheduledDate);
    next.setDate(next.getDate() + 1);
    dates = `${dateStr}/${next.toISOString().slice(0, 10).replace(/-/g, "")}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `More Clean – ${appt.clientName}`,
    dates,
    details: `Schoonmaakafspraak via More Clean`,
    location: appt.address ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

// Outlook.com deep-link
export function outlookCalendarUrl(appt: {
  clientName: string;
  scheduledDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  address: string | null;
}): string {
  const startDt = appt.scheduledStart
    ? new Date(`${appt.scheduledDate}T${appt.scheduledStart}:00`).toISOString()
    : `${appt.scheduledDate}T08:00:00`;
  const endDt = appt.scheduledEnd
    ? new Date(`${appt.scheduledDate}T${appt.scheduledEnd}:00`).toISOString()
    : `${appt.scheduledDate}T10:00:00`;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: startDt,
    enddt: endDt,
    subject: `More Clean – ${appt.clientName}`,
    body: "Schoonmaakafspraak via More Clean",
    location: appt.address ?? "",
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}
