import { register } from "@/lib/events/eventBus";
import { archiveInvoicePdf } from "@/lib/services/accounting/receipts";
import { getInvoiceFull } from "@/lib/services/finance/invoices";
import { getCompany } from "@/lib/services/crm/company";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { DomainEvent, InvoiceSentPayload } from "@/lib/events/types";

// ============================================================
// ACCOUNTING HANDLER
// Luistert op invoice.sent en slaat de PDF automatisch op in
// de kwartaalmap in Supabase Storage. Zonder extra handelingen
// van admins of boekhouders.
// ============================================================

register("invoice.sent", [
  async (event: DomainEvent<"invoice.sent">) => {
    const p = event.payload as InvoiceSentPayload;

    try {
      // Haal volledige factuur op
      const [invoice, company] = await Promise.all([
        getInvoiceFull(p.invoiceId),
        getCompany(),
      ]);
      if (!invoice) return;

      const companyInfo = company ?? {
        name: "More Clean", address: null, postal_code: null, city: null,
        email: null, phone: null, kvk: null, vat_number: null, iban: null,
        logo_path: null, primary_color: "#4D7EBA",
      };

      // Genereer PDF dynamisch (zelfde als de API route)
      const { InvoicePdf } = await import("@/lib/services/pdf/invoicePdf");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfBuffer = await renderToBuffer(createElement(InvoicePdf, { invoice, company: companyInfo }) as any);

      // Archiveer in kwartaalmap
      await archiveInvoicePdf(
        p.invoiceId,
        p.invoiceNumber,
        pdfBuffer,
        invoice.issue_date
      );
    } catch (err) {
      // Niet-kritiek: log maar blokkeer de verzending niet
      console.error("[accountingHandler] PDF archivering mislukt:", p.invoiceNumber, err);
    }
  },
]);
