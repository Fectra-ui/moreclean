// Auto-synced with Supabase schema — run `npx supabase gen types typescript` to regenerate

export type UserRole = "admin" | "employee" | "customer";
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type InvoiceReminderType = "reminder_1" | "reminder_2" | "final";
export type FileOwnerType = "client" | "appointment" | "quote" | "invoice" | "employee" | "asset";
export type FileType = "photo_before" | "photo_during" | "photo_after" | "signature" | "quote_pdf" | "invoice_pdf" | "contract" | "certificate" | "other";
export type ServiceUnit = "per_raam" | "per_uur" | "vast" | "per_m2" | "per_paneel";
export type ServiceCategory = "glasbewassing" | "zonnepanelen" | "schoonmaak" | "gevelreiniging" | "overig";
export type AssetStatus = "available" | "in_use" | "maintenance" | "retired";
export type AssetType = "voertuig" | "machine" | "gereedschap" | "overig";
export type AppointmentRole = "lead" | "assistant";
export type MessageDirection = "inbound" | "outbound" | "internal";
export type NotificationType =
  | "appointment_scheduled" | "appointment_reminder" | "appointment_completed"
  | "quote_sent" | "quote_accepted" | "quote_rejected"
  | "invoice_sent" | "invoice_paid" | "invoice_overdue"
  | "message_received" | "employee_assigned" | "maintenance_due";

// ============================================================
// CORE ENTITIES
// ============================================================

export interface Company {
  id: string;
  name: string;
  kvk: string | null;
  vat_number: string | null;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string | null;
  email: string | null;
  timezone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  company_id: string | null;
  branch_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_path: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProfile {
  id: string;
  profile_id: string;
  branch_id: string | null;
  function: string | null;
  hourly_rate: number | null;
  calendar_color: string;
  iban: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  date: string;
  available: boolean;
  note: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  category: ServiceCategory;
  default_price: number | null;
  unit: ServiceUnit;
  vat_rate: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  profile_id: string | null;
  company_id: string | null;
  branch_id: string | null;
  is_company: boolean;
  company_name: string | null;
  contact_name: string;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  vat_number: string | null;
  payment_terms: number;
  notes: string | null;
  internal_notes: string | null;
  source: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  client_id: string;
  service_id: string;
  frequency_weeks: number;
  next_due_at: string | null;
  last_done_at: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  company_id: string | null;
  name: string;
  type: AssetType;
  serial_number: string | null;
  license_plate: string | null;
  purchase_date: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  status: AssetStatus;
  assigned_employee: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  company_id: string | null;
  client_id: string;
  quote_number: string;
  status: QuoteStatus;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  subject: string | null;
  intro_text: string | null;
  notes: string | null;
  internal_notes: string | null;
  subtotal: number;
  discount_pct: number;
  vat_amount: number;
  total: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  company_id: string | null;
  branch_id: string | null;
  client_id: string;
  quote_id: string | null;
  status: AppointmentStatus;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  estimated_duration: number | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  travel_duration: number | null;
  route_order: number | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentEmployee {
  id: string;
  appointment_id: string;
  employee_id: string;
  role: AppointmentRole;
  created_at: string;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string | null;
  description: string | null;
  quantity: number;
  unit_price: number | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface AppointmentStatusHistory {
  id: string;
  appointment_id: string;
  old_status: AppointmentStatus | null;
  new_status: AppointmentStatus;
  changed_by: string | null;
  note: string | null;
  changed_at: string;
}

export interface AppointmentSignature {
  id: string;
  appointment_id: string;
  signature_data: string;
  signed_at: string;
  signed_by_name: string;
}

export interface File {
  id: string;
  owner_type: FileOwnerType;
  owner_id: string;
  type: FileType;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  caption: string | null;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string | null;
  client_id: string;
  appointment_id: string | null;
  quote_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  sent_at: string | null;
  paid_at: string | null;
  subtotal: number;
  discount_pct: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  mollie_payment_id: string | null;
  payment_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

export interface InvoiceReminder {
  id: string;
  invoice_id: string;
  type: InvoiceReminderType;
  sent_at: string;
}

export interface Conversation {
  id: string;
  company_id: string | null;
  client_id: string;
  subject: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  direction: MessageDirection;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ============================================================
// ENRICHED TYPES (with joins)
// ============================================================

export type AppointmentWithClient = Appointment & {
  clients: Pick<Client, "contact_name" | "company_name" | "phone" | "email">;
};

export type AppointmentWithDetails = Appointment & {
  clients: Client;
  appointment_employees: (AppointmentEmployee & { profiles: Profile })[];
  appointment_services: (AppointmentService & { services: Service | null })[];
  files: File[];
};

export type QuoteWithItems = Quote & {
  quote_items: QuoteItem[];
  clients: Client;
};

export type InvoiceWithItems = Invoice & {
  invoice_items: InvoiceItem[];
  clients: Client;
};

export type ClientWithSchedules = Client & {
  maintenance_schedules: (MaintenanceSchedule & { services: Service })[];
};

export type EmployeeWithProfile = Profile & {
  employee_profiles: EmployeeProfile | null;
};

// ============================================================
// DASHBOARD STATS TYPE
// ============================================================

export interface DashboardStats {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  openQuotes: number;
  openInvoices: number;
  overdueInvoices: number;
  revenueToday: number;
  revenueThisMonth: number;
  newClientsThisMonth: number;
  unreadMessages: number;
}
