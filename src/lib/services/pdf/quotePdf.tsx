import {
  Document, Page, Text, View, StyleSheet, Font, Image as PdfImage,
} from "@react-pdf/renderer";
import type { Quote, QuoteItem, Client, Company } from "@/types/database";

// Inline font via system (no external fetch needed)
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#101536",
    padding: "40 50",
    backgroundColor: "#ffffff",
  },
  // HEADER
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  logo: { width: 120, height: 40, objectFit: "contain" },
  headerRight: { alignItems: "flex-end" },
  headerTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#4D7EBA", letterSpacing: -0.5 },
  headerSub: { fontSize: 10, color: "#606774", marginTop: 4 },
  headerNumber: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#101536", marginTop: 8 },

  // GRADIENT BAR
  bar: { height: 3, backgroundColor: "#4D7EBA", marginBottom: 28, borderRadius: 2 },

  // TWO COLUMNS
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  col: { width: "47%" },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#95AEC1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  label: { fontSize: 9, color: "#606774", marginBottom: 2 },
  value: { fontSize: 10, color: "#101536", marginBottom: 4 },
  valueBold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#101536", marginBottom: 4 },

  // TABLE
  tableHeader: { flexDirection: "row", backgroundColor: "#F3F5F7", padding: "8 10", borderRadius: 6, marginBottom: 4 },
  tableRow: { flexDirection: "row", padding: "7 10", borderBottomWidth: 1, borderBottomColor: "#F3F5F7" },
  tableDesc: { flex: 1, fontSize: 9 },
  tableQty: { width: 50, fontSize: 9, textAlign: "right" },
  tablePrice: { width: 70, fontSize: 9, textAlign: "right" },
  tableTotal: { width: 80, fontSize: 9, textAlign: "right" },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#606774" },

  // TOTALS
  totalsBox: { alignItems: "flex-end", marginTop: 12 },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4, width: 240 },
  totalsLabel: { flex: 1, fontSize: 9, color: "#606774" },
  totalsValue: { width: 80, fontSize: 9, textAlign: "right", color: "#101536" },
  totalRowFinal: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6, width: 240, backgroundColor: "#4D7EBA", borderRadius: 6, padding: "8 10" },
  totalLabelFinal: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold", color: "white" },
  totalValueFinal: { width: 80, fontSize: 11, fontFamily: "Helvetica-Bold", color: "white", textAlign: "right" },

  // NOTES
  notesBox: { marginTop: 20, backgroundColor: "#F3F5F7", borderRadius: 8, padding: 12 },
  notesText: { fontSize: 9, color: "#606774", lineHeight: 1.6 },

  // FOOTER
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: "#F3F5F7", paddingTop: 12 },
  footerText: { fontSize: 8, color: "#95AEC1", textAlign: "center" },
  footerBrand: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#4D7EBA" },

  // VALIDITY BADGE
  validBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  badge: { backgroundColor: "#4D7EBA", borderRadius: 10, padding: "3 8" },
  badgeText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "white" },

  // STATUS STAMP
  stamp: { position: "absolute", top: 80, right: 50, borderWidth: 2, borderColor: "#4D7EBA", borderRadius: 6, padding: "4 10", opacity: 0.3, transform: "rotate(-15deg)" },
  stampText: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#4D7EBA", textTransform: "uppercase" },
});

const euro = (n: number) => `€ ${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  quote: Quote & { quote_items: QuoteItem[]; clients: Client; companies?: Company };
  company: { name: string; address: string; email: string; phone: string; vat_number?: string; kvk?: string; logo_path?: string | null };
}

export function QuotePdf({ quote, company }: Props) {
  const client = quote.clients;
  const items = quote.quote_items.sort((a, b) => a.sort_order - b.sort_order);
  const validUntil = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const isAccepted = quote.status === "accepted";

  return (
    <Document
      title={`Offerte ${quote.quote_number}`}
      author={company.name}
      subject="Offerte"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            {company.logo_path ? (
              <>
                <PdfImage src={company.logo_path} style={styles.logo} />
                <Text style={[styles.label, { marginBottom: 2, marginTop: 4 }]}>{company.name}</Text>
              </>
            ) : (
              <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: "#101536", marginBottom: 6, letterSpacing: -0.5 }}>
                {company.name.toUpperCase()}
              </Text>
            )}
            <Text style={styles.label}>{company.address}</Text>
            <Text style={styles.label}>{company.phone}</Text>
            <Text style={styles.label}>{company.email}</Text>
            {company.kvk && <Text style={styles.label}>KVK: {company.kvk}</Text>}
            {company.vat_number && <Text style={styles.label}>BTW: {company.vat_number}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>OFFERTE</Text>
            <Text style={styles.headerSub}>{quote.quote_number}</Text>
            <Text style={styles.headerNumber}>
              {new Date(quote.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
            {validUntil && (
              <View style={styles.validBadge}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Geldig tot {validUntil}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ACCEPTED STAMP */}
        {isAccepted && (
          <View style={styles.stamp}>
            <Text style={styles.stampText}>Geaccepteerd</Text>
          </View>
        )}

        {/* BAR */}
        <View style={styles.bar} />

        {/* CLIENT + SUBJECT */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Aan</Text>
            {client.company_name && <Text style={styles.valueBold}>{client.company_name}</Text>}
            <Text style={client.company_name ? styles.value : styles.valueBold}>{client.contact_name}</Text>
            {client.address && <Text style={styles.value}>{client.address}</Text>}
            {client.postal_code && <Text style={styles.value}>{client.postal_code} {client.city}</Text>}
            {client.email && <Text style={styles.value}>{client.email}</Text>}
            {client.vat_number && <Text style={styles.label}>BTW: {client.vat_number}</Text>}
          </View>

          {quote.subject && (
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Betreft</Text>
              <Text style={styles.valueBold}>{quote.subject}</Text>
              {quote.intro_text && (
                <Text style={[styles.value, { marginTop: 6, lineHeight: 1.5 }]}>{quote.intro_text}</Text>
              )}
            </View>
          )}
        </View>

        {/* TABLE */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableDesc, styles.tableHeaderText]}>Omschrijving</Text>
          <Text style={[styles.tableQty, styles.tableHeaderText]}>Aantal</Text>
          <Text style={[styles.tablePrice, styles.tableHeaderText]}>Prijs</Text>
          <Text style={[styles.tableTotal, styles.tableHeaderText]}>Totaal</Text>
        </View>

        {items.map((item, i) => (
          <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? { backgroundColor: "#FAFBFC" } : {}]}>
            <Text style={[styles.tableDesc, { color: "#101536" }]}>{item.description}</Text>
            <Text style={[styles.tableQty, { color: "#606774" }]}>{item.quantity}</Text>
            <Text style={[styles.tablePrice, { color: "#606774" }]}>{euro(item.unit_price)}</Text>
            <Text style={[styles.tableTotal, { fontFamily: "Helvetica-Bold" }]}>{euro(item.total_price)}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotaal</Text>
            <Text style={styles.totalsValue}>{euro(quote.subtotal)}</Text>
          </View>
          {quote.discount_pct > 0 && (
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: "#4D7EBA" }]}>Korting ({quote.discount_pct}%)</Text>
              <Text style={[styles.totalsValue, { color: "#4D7EBA" }]}>- {euro(quote.subtotal * (quote.discount_pct / 100))}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>BTW (21%)</Text>
            <Text style={styles.totalsValue}>{euro(quote.vat_amount)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Eindtotaal</Text>
            <Text style={styles.totalValueFinal}>{euro(quote.total)}</Text>
          </View>
        </View>

        {/* NOTES */}
        {quote.notes && (
          <View style={styles.notesBox}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Opmerkingen</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={styles.footerBrand}>{company.name}</Text>
            {"  ·  "}{company.phone}{"  ·  "}{company.email}
          </Text>
          <Text style={[styles.footerText, { marginTop: 3 }]}>
            Op alle offertes zijn onze algemene voorwaarden van toepassing · moreclean.nl/algemene-voorwaarden
          </Text>
        </View>
      </Page>
    </Document>
  );
}
