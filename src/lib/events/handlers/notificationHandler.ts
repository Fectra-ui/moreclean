import { register } from "@/lib/events/eventBus";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  DomainEvent,
  AppointmentAssignedPayload,
  AppointmentCompletedPayload,
  AppointmentCreatedPayload,
  AppointmentCancelledPayload,
  QuoteAcceptedPayload,
  InvoicePaidPayload,
  InvoiceOverduePayload,
  MessageReceivedPayload,
} from "@/lib/events/types";

async function notify(recipientId: string, type: string, title: string, body: string, link: string | null = null) {
  const supabase = createServiceClient();
  await supabase.from("notifications").insert({ recipient_id: recipientId, type, title, body, link });
}

async function notifyAdmins(companyId: string, type: string, title: string, body: string, link: string | null = null) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", companyId)
    .eq("role", "admin")
    .eq("active", true);
  await Promise.all(
    (data ?? []).map((p: { id: string }) => notify(p.id, type, title, body, link))
  );
}

// ============================================================
// REGISTRATIES
// ============================================================

register("appointment.assigned", [
  async (event: DomainEvent<"appointment.assigned">) => {
    const p = event.payload as AppointmentAssignedPayload;
    await notify(
      p.employeeId,
      "appointment_assigned",
      "Nieuwe opdracht ingepland",
      `${p.clientName} – ${new Date(p.scheduledDate).toLocaleDateString("nl-NL")}`,
      `/medewerker/opdracht/${p.appointmentId}`
    );
  },
]);

register("appointment.created", [
  async (event: DomainEvent<"appointment.created">) => {
    const p = event.payload as AppointmentCreatedPayload;
    await notifyAdmins(
      event.companyId,
      "appointment_created",
      "Afspraak ingepland",
      `${p.clientName} – ${new Date(p.scheduledDate).toLocaleDateString("nl-NL")}`,
      `/admin/planning`
    );
  },
]);

register("appointment.completed", [
  async (event: DomainEvent<"appointment.completed">) => {
    const p = event.payload as AppointmentCompletedPayload;
    await notifyAdmins(
      event.companyId,
      "appointment_completed",
      "Klus afgerond",
      `${p.clientName} – ${new Date(p.scheduledDate).toLocaleDateString("nl-NL")}`,
      `/admin/planning`
    );
  },
]);

register("appointment.cancelled", [
  async (event: DomainEvent<"appointment.cancelled">) => {
    const p = event.payload as AppointmentCancelledPayload;
    await notifyAdmins(
      event.companyId,
      "appointment_cancelled",
      "Afspraak geannuleerd",
      `${p.clientName} – ${new Date(p.scheduledDate).toLocaleDateString("nl-NL")}`,
      `/admin/planning`
    );
  },
]);

register("quote.accepted", [
  async (event: DomainEvent<"quote.accepted">) => {
    const p = event.payload as QuoteAcceptedPayload;
    await notifyAdmins(
      event.companyId,
      "quote_accepted",
      "Offerte geaccepteerd",
      `${p.clientName} heeft offerte ${p.quoteNumber} geaccepteerd`,
      `/admin/offertes/${p.quoteId}`
    );
  },
]);

register("invoice.paid", [
  async (event: DomainEvent<"invoice.paid">) => {
    const p = event.payload as InvoicePaidPayload;
    await notifyAdmins(
      event.companyId,
      "invoice_paid",
      "Factuur betaald",
      `${p.clientName} heeft factuur ${p.invoiceNumber} betaald`,
      `/admin/facturen/${p.invoiceId}`
    );
  },
]);

register("invoice.overdue", [
  async (event: DomainEvent<"invoice.overdue">) => {
    const p = event.payload as InvoiceOverduePayload;
    await notifyAdmins(
      event.companyId,
      "invoice_overdue",
      "Factuur verlopen",
      `Factuur ${p.invoiceNumber} is ${p.daysOverdue} dag${p.daysOverdue !== 1 ? "en" : ""} verlopen`,
      `/admin/facturen/${p.invoiceId}`
    );
  },
]);

register("message.received", [
  async (event: DomainEvent<"message.received">) => {
    const p = event.payload as MessageReceivedPayload;
    await notifyAdmins(
      event.companyId,
      "message_received",
      "Nieuw bericht",
      `${p.fromName}: ${p.preview}`,
      `/admin/berichten/${p.messageId}`
    );
  },
]);
