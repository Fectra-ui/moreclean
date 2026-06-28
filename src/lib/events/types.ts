// ============================================================
// DOMAIN EVENT TYPES — volledig type-safe via EventMap
//
// Voeg een nieuw event toe in drie stappen:
//   1. Definieer een payload-interface hieronder
//   2. Voeg een entry toe aan EventMap
//   3. Registreer een handler in de relevante handler-file
// ============================================================

export type AggregateType =
  | "quote"
  | "appointment"
  | "invoice"
  | "maintenance"
  | "message"
  | "payment";

// ---- Payload interfaces ----

export interface QuoteCreatedPayload {
  quoteId: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  total: number;
}

export interface QuoteSentPayload extends QuoteCreatedPayload {}

export interface QuoteAcceptedPayload {
  quoteId: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  total: number;
}

export interface QuoteRejectedPayload {
  quoteId: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
}

export interface QuoteExpiredPayload {
  quoteId: string;
  quoteNumber: string;
  clientId: string;
}

export interface AppointmentCreatedPayload {
  appointmentId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  scheduledDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  employeeIds: string[];
  address: string | null;
}

export interface AppointmentAssignedPayload {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  scheduledDate: string;
  scheduledStart: string | null;
  address: string | null;
  employeeId: string;
  employeeName: string;
}

export interface AppointmentRescheduledPayload {
  appointmentId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  oldDate: string;
  newDate: string;
  newStart: string | null;
  newEnd: string | null;
  address: string | null;
  employeeIds: string[];
}

export interface AppointmentStartedPayload {
  appointmentId: string;
  clientName: string;
  scheduledDate: string;
  employeeIds: string[];
}

export interface AppointmentCompletedPayload {
  appointmentId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  scheduledDate: string;
  employeeIds: string[];
  hasSig: boolean;
  address: string | null;
}

export interface AppointmentCancelledPayload {
  appointmentId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  scheduledDate: string;
  reason: string | null;
}

export interface InvoiceCreatedPayload {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  total: number;
  dueDate: string;
}

export interface InvoiceSentPayload extends InvoiceCreatedPayload {
  paymentUrl: string | null;
}

export interface InvoicePaidPayload {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  total: number;
  paidAt: string;
}

export interface InvoiceOverduePayload {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientEmail: string;
  daysOverdue: number;
  total: number;
}

export interface InvoiceCreditCreatedPayload {
  invoiceId: string;
  invoiceNumber: string;
  originalInvoiceId: string;
  clientId: string;
  clientName: string;
  total: number;
}

export interface MaintenanceDuePayload {
  maintenanceId: string;
  clientId: string;
  clientName: string;
  dueDate: string;
  serviceType: string;
}

export interface MaintenanceScheduledPayload {
  maintenanceId: string;
  appointmentId: string;
  clientId: string;
  scheduledDate: string;
}

export interface MessageReceivedPayload {
  messageId: string;
  fromClientId: string;
  fromName: string;
  preview: string;
}

export interface PaymentCompletedPayload {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  molliePaymentId: string;
}

export interface PaymentFailedPayload {
  paymentId: string;
  invoiceId: string;
  molliePaymentId: string;
  reason: string | null;
}

export interface PaymentRefundedPayload {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
}

// ============================================================
// EVENTMAP — centrale bron van waarheid
// Elke key is een event-type, elke value is het payload-type.
// publish() en on() zijn volledig type-safe dankzij deze map.
// ============================================================

export interface EventMap {
  "quote.created":            QuoteCreatedPayload;
  "quote.sent":               QuoteSentPayload;
  "quote.accepted":           QuoteAcceptedPayload;
  "quote.rejected":           QuoteRejectedPayload;
  "quote.expired":            QuoteExpiredPayload;
  "appointment.created":      AppointmentCreatedPayload;
  "appointment.assigned":     AppointmentAssignedPayload;
  "appointment.rescheduled":  AppointmentRescheduledPayload;
  "appointment.started":      AppointmentStartedPayload;
  "appointment.completed":    AppointmentCompletedPayload;
  "appointment.cancelled":    AppointmentCancelledPayload;
  "invoice.created":          InvoiceCreatedPayload;
  "invoice.sent":             InvoiceSentPayload;
  "invoice.paid":             InvoicePaidPayload;
  "invoice.overdue":          InvoiceOverduePayload;
  "invoice.credit_created":   InvoiceCreditCreatedPayload;
  "maintenance.due":          MaintenanceDuePayload;
  "maintenance.scheduled":    MaintenanceScheduledPayload;
  "message.received":         MessageReceivedPayload;
  "payment.completed":        PaymentCompletedPayload;
  "payment.failed":           PaymentFailedPayload;
  "payment.refunded":         PaymentRefundedPayload;
}

export type DomainEventType = keyof EventMap;

export interface DomainEvent<K extends DomainEventType = DomainEventType> {
  type: K;
  aggregateType: AggregateType;
  aggregateId: string;
  companyId: string;
  actorId?: string;
  payload: EventMap[K];
  occurredAt: Date;
}
