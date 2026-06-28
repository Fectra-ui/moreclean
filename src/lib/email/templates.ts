// ============================================================
// E-MAIL TEMPLATES
// Één functie per template. Returnwaarde: { subject, html }.
// Gebruik emailLayout() voor de branding-wrapper.
// ============================================================

import { emailLayout, btn, divider, infoRow, infoTable, h1, p, small } from "./layout";

const nl = (date: string) =>
  new Date(date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const euro = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

// ---- 1. Offerte verzonden ----

export function quoteSentEmail(opts: {
  clientName: string;
  quoteNumber: string;
  total: number;
  portalUrl: string;
}) {
  const content = `
    ${h1("Uw offerte is klaar")}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Wij hebben offerte <strong>${opts.quoteNumber}</strong> voor u klaargemaakt ter waarde van <strong>${euro(opts.total)}</strong>.`)}
    ${p("U kunt de offerte bekijken, downloaden en direct accepteren via uw persoonlijke portal:")}
    ${btn(opts.portalUrl, "Offerte bekijken →")}
    ${divider}
    ${infoTable(
      infoRow("Offertenummer", opts.quoteNumber) +
      infoRow("Bedrag", euro(opts.total))
    )}
    ${small("Heeft u vragen over deze offerte? Neem dan gerust contact met ons op.")}
  `;
  return {
    subject: `Offerte ${opts.quoteNumber} van More Clean`,
    html: emailLayout(content, `Offerte ${opts.quoteNumber} — ${euro(opts.total)}`),
  };
}

// ---- 2. Offerte geaccepteerd (bevestiging aan klant) ----

export function quoteAcceptedEmail(opts: {
  clientName: string;
  quoteNumber: string;
  total: number;
  portalUrl: string;
}) {
  const content = `
    ${h1("Bedankt voor uw akkoord!")}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Wij hebben uw akkoord op offerte <strong>${opts.quoteNumber}</strong> ontvangen. Wij nemen zo snel mogelijk contact met u op om een afspraak in te plannen.`)}
    ${btn(opts.portalUrl, "Mijn portal bekijken →")}
    ${divider}
    ${infoTable(
      infoRow("Offertenummer", opts.quoteNumber) +
      infoRow("Bedrag", euro(opts.total))
    )}
  `;
  return {
    subject: `Bevestiging: offerte ${opts.quoteNumber} geaccepteerd`,
    html: emailLayout(content, "Uw akkoord is ontvangen — wij nemen contact op"),
  };
}

// ---- 3. Afspraak bevestigd ----

export function appointmentConfirmedEmail(opts: {
  clientName: string;
  scheduledDate: string;
  scheduledStart: string | null;
  address: string | null;
  calendarUrl?: string;
  portalUrl: string;
}) {
  const timeStr = opts.scheduledStart
    ? ` om ${opts.scheduledStart.slice(0, 5)}`
    : "";
  const content = `
    ${h1("Afspraak bevestigd")}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Uw afspraak is ingepland. Wij komen bij u langs op <strong>${nl(opts.scheduledDate)}${timeStr}</strong>.`)}
    ${opts.calendarUrl ? btn(opts.calendarUrl, "Toevoegen aan agenda →", "#2D6A4F") : ""}
    ${divider}
    ${infoTable(
      infoRow("Datum", nl(opts.scheduledDate)) +
      (opts.scheduledStart ? infoRow("Tijd", opts.scheduledStart.slice(0, 5)) : "") +
      (opts.address ? infoRow("Adres", opts.address) : "")
    )}
    ${p(`Wilt u de afspraak wijzigen of annuleren? Dat kan via uw <a href="${opts.portalUrl}" style="color:#4D7EBA">persoonlijk portal</a>.`)}
  `;
  return {
    subject: `Afspraakbevestiging – ${nl(opts.scheduledDate)}`,
    html: emailLayout(content, `Uw afspraak op ${nl(opts.scheduledDate)}`),
  };
}

// ---- 4. Afspraak gewijzigd ----

export function appointmentRescheduledEmail(opts: {
  clientName: string;
  oldDate: string;
  newDate: string;
  newStart: string | null;
  address: string | null;
  portalUrl: string;
}) {
  const timeStr = opts.newStart ? ` om ${opts.newStart.slice(0, 5)}` : "";
  const content = `
    ${h1("Afspraak gewijzigd")}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Uw afspraak van <strong>${nl(opts.oldDate)}</strong> is verplaatst naar <strong>${nl(opts.newDate)}${timeStr}</strong>.`)}
    ${divider}
    ${infoTable(
      infoRow("Nieuwe datum", nl(opts.newDate)) +
      (opts.newStart ? infoRow("Nieuwe tijd", opts.newStart.slice(0, 5)) : "") +
      (opts.address ? infoRow("Adres", opts.address) : "")
    )}
    ${p(`Niet akkoord? Neem dan contact met ons op of <a href="${opts.portalUrl}" style="color:#4D7EBA">bekijk uw portal</a>.`)}
  `;
  return {
    subject: `Afspraak gewijzigd – nu ${nl(opts.newDate)}`,
    html: emailLayout(content, `Uw afspraak is verplaatst naar ${nl(opts.newDate)}`),
  };
}

// ---- 5. Afspraak geannuleerd ----

export function appointmentCancelledEmail(opts: {
  clientName: string;
  scheduledDate: string;
  reason: string | null;
  portalUrl: string;
}) {
  const content = `
    ${h1("Afspraak geannuleerd")}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Uw afspraak van <strong>${nl(opts.scheduledDate)}</strong> is helaas geannuleerd.`)}
    ${opts.reason ? p(`Reden: ${opts.reason}`) : ""}
    ${p(`Wilt u een nieuwe afspraak inplannen? Dat kan via uw <a href="${opts.portalUrl}" style="color:#4D7EBA">persoonlijk portal</a> of door contact met ons op te nemen.`)}
  `;
  return {
    subject: `Afspraak geannuleerd – ${nl(opts.scheduledDate)}`,
    html: emailLayout(content),
  };
}

// ---- 6. Klus afgerond ----

export function appointmentCompletedEmail(opts: {
  clientName: string;
  scheduledDate: string;
  portalUrl: string;
}) {
  const content = `
    ${h1("Werkzaamheden afgerond")}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`De werkzaamheden van <strong>${nl(opts.scheduledDate)}</strong> zijn succesvol afgerond. Wij hopen dat alles naar wens is.`)}
    ${p("Heeft u opmerkingen of wensen voor een volgende keer? Laat het ons weten.")}
    ${btn(opts.portalUrl, "Bekijk uw portal →")}
    ${divider}
    ${small("Tevreden over onze service? Wij waarderen een aanbeveling aan uw netwerk!")}
  `;
  return {
    subject: "Werkzaamheden afgerond – More Clean",
    html: emailLayout(content, "Uw schoonmaak is klaar"),
  };
}

// ---- 7. Factuur verzonden ----

export function invoiceSentEmail(opts: {
  clientName: string;
  invoiceNumber: string;
  total: number;
  dueDate: string;
  paymentUrl: string | null;
  portalUrl: string;
}) {
  const content = `
    ${h1(`Factuur ${opts.invoiceNumber}`)}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Hierbij ontvangt u factuur <strong>${opts.invoiceNumber}</strong> ten bedrage van <strong>${euro(opts.total)}</strong>.`)}
    ${opts.paymentUrl ? btn(opts.paymentUrl, "Factuur direct betalen →") : ""}
    ${divider}
    ${infoTable(
      infoRow("Factuurnummer", opts.invoiceNumber) +
      infoRow("Bedrag", euro(opts.total)) +
      infoRow("Vervaldatum", nl(opts.dueDate))
    )}
    ${p(`U kunt de factuur ook bekijken via uw <a href="${opts.portalUrl}" style="color:#4D7EBA">persoonlijk portal</a>.`)}
    ${small("Heeft u vragen over deze factuur? Neem dan contact met ons op.")}
  `;
  return {
    subject: `Factuur ${opts.invoiceNumber} van More Clean`,
    html: emailLayout(content, `Factuur ${opts.invoiceNumber} – ${euro(opts.total)}`),
  };
}

// ---- 8. Betalingsbevestiging ----

export function paymentReceiptEmail(opts: {
  clientName: string;
  invoiceNumber: string;
  total: number;
  paidAt: string;
  portalUrl: string;
}) {
  const content = `
    ${h1("Betaling ontvangen")}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Wij hebben uw betaling voor factuur <strong>${opts.invoiceNumber}</strong> ontvangen. Hartelijk dank!`)}
    ${divider}
    ${infoTable(
      infoRow("Factuurnummer", opts.invoiceNumber) +
      infoRow("Bedrag", euro(opts.total)) +
      infoRow("Betaald op", nl(opts.paidAt))
    )}
    ${btn(opts.portalUrl, "Bekijk uw overzicht →", "#2D6A4F")}
  `;
  return {
    subject: `Betaling ontvangen – factuur ${opts.invoiceNumber}`,
    html: emailLayout(content, "Uw betaling is verwerkt"),
  };
}

// ---- 9. Betalingsherinnering ----

export function invoiceReminderEmail(opts: {
  clientName: string;
  invoiceNumber: string;
  total: number;
  dueDate: string;
  daysOverdue: number;
  paymentUrl: string | null;
  portalUrl: string;
}) {
  const urgency = opts.daysOverdue > 14 ? "dringende " : "";
  const content = `
    ${h1(`${urgency === "" ? "H" : "Dringende h"}erinnering – openstaande factuur`)}
    ${p(`Beste ${opts.clientName},`)}
    ${p(`Wij willen u er vriendelijk aan herinneren dat factuur <strong>${opts.invoiceNumber}</strong> ter waarde van <strong>${euro(opts.total)}</strong> nog openstaat.`)}
    ${p(`De vervaldatum was <strong>${nl(opts.dueDate)}</strong> (${opts.daysOverdue} dag${opts.daysOverdue !== 1 ? "en" : ""} geleden).`)}
    ${opts.paymentUrl ? btn(opts.paymentUrl, "Nu betalen →") : ""}
    ${divider}
    ${infoTable(
      infoRow("Factuurnummer", opts.invoiceNumber) +
      infoRow("Bedrag", euro(opts.total)) +
      infoRow("Vervallen op", nl(opts.dueDate))
    )}
    ${p(`Indien u al betaald heeft, kunt u deze herinnering negeren. Vragen? Bekijk uw <a href="${opts.portalUrl}" style="color:#4D7EBA">portal</a> of neem contact op.`)}
  `;
  return {
    subject: `Herinnering: factuur ${opts.invoiceNumber} nog niet betaald`,
    html: emailLayout(content, `Openstaande factuur – ${euro(opts.total)}`),
  };
}
