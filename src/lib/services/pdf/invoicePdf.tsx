import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { InvoiceFull } from "@/lib/services/finance/invoices";

const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const styles = StyleSheet.create({
  page:     { fontFamily: "Helvetica", fontSize: 9, color: "#333", padding: 48 },
  header:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brand:    { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#101536" },
  sub:      { fontSize: 8, color: "#606774", marginTop: 2 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 8, fontFamily: "Helvetica-Bold" },
  section:  { marginBottom: 20 },
  label:    { fontSize: 7, color: "#606774", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  value:    { fontSize: 9, color: "#101536" },
  tableHdr: { flexDirection: "row", backgroundColor: "#F3F5F7", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4, marginBottom: 2 },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#E8EAF0" },
  colDesc:  { flex: 1 },
  colQty:   { width: 40, textAlign: "right" },
  colPrice: { width: 70, textAlign: "right" },
  colTotal: { width: 70, textAlign: "right" },
  totBox:   { alignSelf: "flex-end", width: 200, marginTop: 12 },
  totRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totFinal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#101536", marginTop: 4 },
  footer:   { position: "absolute", bottom: 32, left: 48, right: 48 },
  watermark:{ position: "absolute", top: 200, left: 80, fontSize: 60, color: "#101536", opacity: 0.06, transform: "rotate(-35deg)", fontFamily: "Helvetica-Bold" },
});

const STATUS_BADGE: Record<string, [string, string]> = {
  draft:   ["#F3F5F7", "#606774"],
  sent:    ["#EFF4FC", "#4D7EBA"],
  paid:    ["#ECFDF5", "#059669"],
  overdue: ["#FEF2F2", "#DC2626"],
  credit:  ["#FFF7ED", "#D97706"],
};

export interface CompanyInfo {
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  kvk: string | null;
  vat_number: string | null;
  iban: string | null;
  logo_path: string | null;
  primary_color: string;
}

interface Props {
  invoice: InvoiceFull;
  company: CompanyInfo;
}

export function InvoicePdf({ invoice, company }: Props) {
  const c = invoice.client;
  const isCredit = invoice.type === "credit";
  const [badgeBg, badgeColor] = STATUS_BADGE[isCredit ? "credit" : invoice.status] ?? STATUS_BADGE.sent;

  const cityLine = [company.postal_code, company.city].filter(Boolean).join(" ");
  const addressLine = [company.address, cityLine].filter(Boolean).join(", ");
  const accentColor = company.primary_color ?? "#4D7EBA";

  return (
    <Document title={`Factuur ${invoice.invoice_number}`} author={company.name}>
      <Page size="A4" style={styles.page}>
        {/* Watermark for paid invoices */}
        {invoice.status === "paid" && (
          <Text style={styles.watermark}>BETAALD</Text>
        )}
        {isCredit && (
          <Text style={styles.watermark}>CREDIT</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logo_path ? (
              <Image
                src={company.logo_path}
                style={{ width: 120, height: 40, objectFit: "contain", marginBottom: 4 }}
              />
            ) : (
              <Text style={styles.brand}>{company.name}</Text>
            )}
            {addressLine && <Text style={styles.sub}>{addressLine}</Text>}
            {(company.email || company.phone) && (
              <Text style={styles.sub}>
                {[company.email, company.phone].filter(Boolean).join(" · ")}
              </Text>
            )}
            {(company.kvk || company.vat_number) && (
              <Text style={styles.sub}>
                {[company.kvk && `KVK ${company.kvk}`, company.vat_number && `BTW ${company.vat_number}`].filter(Boolean).join(" · ")}
              </Text>
            )}
            {company.iban && <Text style={styles.sub}>IBAN {company.iban}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: "#101536" }}>
              {isCredit ? "CREDITFACTUUR" : "FACTUUR"}
            </Text>
            <Text style={{ fontSize: 11, color: accentColor, marginTop: 2 }}>{invoice.invoice_number}</Text>
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.badge, { backgroundColor: badgeBg, color: badgeColor }]}>
                {isCredit ? "Credit" : { draft: "Concept", sent: "Verzonden", paid: "Betaald", overdue: "Verlopen" }[invoice.status] ?? invoice.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Metadata */}
        <View style={{ flexDirection: "row", gap: 40, marginBottom: 24 }}>
          <View style={styles.section}>
            <Text style={styles.label}>Factuur aan</Text>
            {c.company_name && <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{c.company_name}</Text>}
            <Text style={styles.value}>{c.contact_name}</Text>
            {c.address && <Text style={styles.value}>{c.address}</Text>}
            {c.city && <Text style={styles.value}>{c.postal_code} {c.city}</Text>}
            {c.email && <Text style={styles.value}>{c.email}</Text>}
            {c.vat_number && <Text style={styles.value}>BTW: {c.vat_number}</Text>}
          </View>
          <View style={styles.section}>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>Factuurdatum</Text>
              <Text style={styles.value}>{new Date(invoice.issue_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</Text>
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>Vervaldatum</Text>
              <Text style={[styles.value, invoice.status === "overdue" ? { color: "#DC2626" } : {}]}>
                {new Date(invoice.due_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
            {invoice.paid_at && (
              <View>
                <Text style={styles.label}>Betaald op</Text>
                <Text style={[styles.value, { color: "#059669" }]}>
                  {new Date(invoice.paid_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Line items */}
        <View>
          <View style={styles.tableHdr}>
            <Text style={[styles.colDesc, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Omschrijving</Text>
            <Text style={[styles.colQty, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Aantal</Text>
            <Text style={[styles.colPrice, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Stukprijs</Text>
            <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Totaal</Text>
          </View>

          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{Math.abs(item.quantity)}</Text>
              <Text style={styles.colPrice}>{euro(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{euro(Math.abs(item.total_price))}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totBox}>
          {invoice.discount_pct > 0 && (
            <View style={styles.totRow}>
              <Text style={{ color: "#606774" }}>Subtotaal</Text>
              <Text>{euro(invoice.subtotal / (1 - invoice.discount_pct / 100))}</Text>
            </View>
          )}
          {invoice.discount_pct > 0 && (
            <View style={styles.totRow}>
              <Text style={{ color: "#606774" }}>Korting ({invoice.discount_pct}%)</Text>
              <Text style={{ color: "#DC2626" }}>– {euro((invoice.subtotal / (1 - invoice.discount_pct / 100)) * invoice.discount_pct / 100)}</Text>
            </View>
          )}
          <View style={styles.totRow}>
            <Text style={{ color: "#606774" }}>Subtotaal</Text>
            <Text>{euro(Math.abs(invoice.subtotal))}</Text>
          </View>
          <View style={styles.totRow}>
            <Text style={{ color: "#606774" }}>BTW ({invoice.vat_rate}%)</Text>
            <Text>{euro(Math.abs(invoice.vat_amount))}</Text>
          </View>
          <View style={styles.totFinal}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
              {isCredit ? "Te ontvangen" : "Te betalen"}
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#101536" }}>
              {euro(Math.abs(invoice.total))}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 20, padding: 10, backgroundColor: "#F9FAFB", borderRadius: 4 }}>
            <Text style={styles.label}>Opmerkingen</Text>
            <Text style={{ ...styles.value, marginTop: 3 }}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment reference */}
        {invoice.status !== "paid" && !isCredit && company.iban && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...styles.value, color: "#606774" }}>
              Gelieve te betalen onder vermelding van{" "}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{invoice.invoice_number}</Text>
              {" "}op IBAN {company.iban} t.n.v. {company.name}.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={{ fontSize: 7, color: "#606774", textAlign: "center" }}>
            {company.name}
            {addressLine ? ` · ${addressLine}` : ""}
            {company.email ? ` · ${company.email}` : ""}
            {company.kvk ? ` · KVK ${company.kvk}` : ""}
            {company.vat_number ? ` · BTW ${company.vat_number}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
