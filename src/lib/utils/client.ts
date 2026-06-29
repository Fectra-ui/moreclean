export type ClientType = "company" | "private";

export interface ClientNameFields {
  client_type?: ClientType | null;
  company_name?: string | null;
  contact_name: string;
}

/**
 * Primaire weergavenaam — de naam die je als titel gebruikt.
 * Bedrijf  → bedrijfsnaam (bijv. "Janssen Bouw BV")
 * Particulier → volledige naam (bijv. "Jan de Vries")
 */
export function clientDisplayName(c: ClientNameFields): string {
  if (isCompanyType(c) && c.company_name) return c.company_name;
  return c.contact_name;
}

/**
 * Secundaire regel — alleen voor bedrijven, anders null.
 * Bedrijf  → contactpersoon (bijv. "Pieter Janssen")
 * Particulier → null (geen tweede regel nodig)
 */
export function clientSubName(c: ClientNameFields): string | null {
  if (isCompanyType(c) && c.company_name) return c.contact_name;
  return null;
}

/**
 * Aanhef voor e-mails en documenten.
 * Bedrijf  → "Beste {contactpersoon},"
 * Particulier → "Beste {voornaam},"
 */
export function clientGreeting(c: ClientNameFields): string {
  const first = c.contact_name.split(" ")[0];
  return `Beste ${first},`;
}

/** Emoji-icoon voor gebruik in dropdowns. */
export function clientTypeIcon(c: ClientNameFields): string {
  return isCompanyType(c) ? "🏢" : "👤";
}

/** Label voor badges/filters. */
export function clientTypeLabel(c: ClientNameFields): string {
  return isCompanyType(c) ? "Bedrijf" : "Particulier";
}

function isCompanyType(c: ClientNameFields): boolean {
  // Gebruik client_type als beschikbaar, val terug op company_name-aanwezigheid
  if (c.client_type != null) return c.client_type === "company";
  return !!c.company_name;
}
