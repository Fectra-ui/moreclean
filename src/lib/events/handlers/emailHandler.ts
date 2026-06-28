import { register } from "@/lib/events/eventBus";
import { sendEmail } from "@/lib/email/client";
import {
  quoteSentEmail,
  quoteAcceptedEmail,
  appointmentConfirmedEmail,
  appointmentRescheduledEmail,
  appointmentCancelledEmail,
  appointmentCompletedEmail,
  invoiceSentEmail,
  paymentReceiptEmail,
  invoiceReminderEmail,
} from "@/lib/email/templates";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  DomainEvent,
  QuoteSentPayload,
  QuoteAcceptedPayload,
  AppointmentCreatedPayload,
  AppointmentRescheduledPayload,
  AppointmentCancelledPayload,
  AppointmentCompletedPayload,
  InvoiceSentPayload,
  InvoicePaidPayload,
  InvoiceOverduePayload,
} from "@/lib/events/types";

const PORTAL_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://moreclean.nl";
const klantPortal = (path: string) => `${PORTAL_BASE}/klant${path}`;

// Haal client-e-mailadres op (gecacht per request is niet nodig — handler loopt zelden)
async function clientEmail(clientId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("clients").select("email").eq("id", clientId).single();
  return (data as { email?: string } | null)?.email ?? null;
}

// ============================================================
// REGISTRATIES — declaratief, één plek per event
// ============================================================

register("quote.sent", [
  async (event: DomainEvent<"quote.sent">) => {
    const p = event.payload as QuoteSentPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = quoteSentEmail({
      clientName: p.clientName,
      quoteNumber: p.quoteNumber,
      total: p.total,
      portalUrl: klantPortal(`/offertes/${p.quoteId}`),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("quote.accepted", [
  async (event: DomainEvent<"quote.accepted">) => {
    const p = event.payload as QuoteAcceptedPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = quoteAcceptedEmail({
      clientName: p.clientName,
      quoteNumber: p.quoteNumber,
      total: p.total,
      portalUrl: klantPortal("/offertes"),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("appointment.created", [
  async (event: DomainEvent<"appointment.created">) => {
    const p = event.payload as AppointmentCreatedPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = appointmentConfirmedEmail({
      clientName: p.clientName,
      scheduledDate: p.scheduledDate,
      scheduledStart: p.scheduledStart,
      address: p.address,
      portalUrl: klantPortal(`/afspraken/${p.appointmentId}`),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("appointment.rescheduled", [
  async (event: DomainEvent<"appointment.rescheduled">) => {
    const p = event.payload as AppointmentRescheduledPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = appointmentRescheduledEmail({
      clientName: p.clientName,
      oldDate: p.oldDate,
      newDate: p.newDate,
      newStart: p.newStart,
      address: p.address,
      portalUrl: klantPortal(`/afspraken/${p.appointmentId}`),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("appointment.cancelled", [
  async (event: DomainEvent<"appointment.cancelled">) => {
    const p = event.payload as AppointmentCancelledPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = appointmentCancelledEmail({
      clientName: p.clientName,
      scheduledDate: p.scheduledDate,
      reason: p.reason,
      portalUrl: klantPortal("/afspraken"),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("appointment.completed", [
  async (event: DomainEvent<"appointment.completed">) => {
    const p = event.payload as AppointmentCompletedPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = appointmentCompletedEmail({
      clientName: p.clientName,
      scheduledDate: p.scheduledDate,
      portalUrl: klantPortal("/afspraken"),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("invoice.sent", [
  async (event: DomainEvent<"invoice.sent">) => {
    const p = event.payload as InvoiceSentPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = invoiceSentEmail({
      clientName: p.clientName,
      invoiceNumber: p.invoiceNumber,
      total: p.total,
      dueDate: p.dueDate,
      paymentUrl: p.paymentUrl,
      portalUrl: klantPortal(`/facturen/${p.invoiceId}`),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("invoice.paid", [
  async (event: DomainEvent<"invoice.paid">) => {
    const p = event.payload as InvoicePaidPayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    const tpl = paymentReceiptEmail({
      clientName: p.clientName,
      invoiceNumber: p.invoiceNumber,
      total: p.total,
      paidAt: p.paidAt,
      portalUrl: klantPortal(`/facturen/${p.invoiceId}`),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);

register("invoice.overdue", [
  async (event: DomainEvent<"invoice.overdue">) => {
    const p = event.payload as InvoiceOverduePayload;
    const email = p.clientEmail || await clientEmail(p.clientId);
    if (!email) return;
    // Haal extra info op
    const supabase = createServiceClient();
    const { data: inv } = await supabase
      .from("invoices")
      .select("invoice_number, total, due_date, payment_url, clients(contact_name, company_name)")
      .eq("id", p.invoiceId)
      .single();
    if (!inv) return;
    const client = (inv.clients as { contact_name: string; company_name?: string } | null);
    const tpl = invoiceReminderEmail({
      clientName: client?.company_name ?? client?.contact_name ?? "Klant",
      invoiceNumber: p.invoiceNumber,
      total: p.total,
      dueDate: (inv as { due_date: string }).due_date,
      daysOverdue: p.daysOverdue,
      paymentUrl: (inv as { payment_url?: string | null }).payment_url ?? null,
      portalUrl: klantPortal(`/facturen/${p.invoiceId}`),
    });
    await sendEmail({ to: email, ...tpl });
  },
]);
