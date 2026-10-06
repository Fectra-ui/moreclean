import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_LENGTHS = { name: 120, email: 254, phone: 50, service: 120, message: 3_000 };

function asText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char] ?? char);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.nextUrl.host) {
    return NextResponse.json({ error: "Deze aanvraag is niet toegestaan." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });

  // Hidden honeypot: bots get a harmless successful response and no email is sent.
  if (asText(body.website, 200)) return NextResponse.json({ ok: true });

  const name = asText(body.name, MAX_LENGTHS.name);
  const email = asText(body.email, MAX_LENGTHS.email).toLowerCase();
  const phone = asText(body.phone, MAX_LENGTHS.phone);
  const service = asText(body.service, MAX_LENGTHS.service);
  const message = asText(body.message, MAX_LENGTHS.message);

  if (!name || !email || !service) {
    return NextResponse.json({ error: "Vul naam, e-mailadres en dienst in." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("Quote request email is not configured: RESEND_API_KEY is missing.");
    return NextResponse.json({ error: "Het formulier is tijdelijk niet beschikbaar. Bel of mail ons gerust rechtstreeks." }, { status: 503 });
  }

  const supabase = createServiceClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name,email")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const recipient = process.env.QUOTE_REQUEST_TO_EMAIL ?? company?.email;
  if (!recipient) {
    console.error("Quote request email is not configured: no recipient email found.");
    return NextResponse.json({ error: "Het formulier is tijdelijk niet beschikbaar. Bel of mail ons gerust rechtstreeks." }, { status: 503 });
  }

  const rows = [
    ["Naam", name],
    ["E-mailadres", email],
    ["Telefoon", phone || "Niet ingevuld"],
    ["Dienst", service],
    ["Bericht", message || "Niet ingevuld"],
  ].map(([label, value]) => `<tr><td style="padding:8px 14px 8px 0;color:#606774;vertical-align:top"><strong>${label}</strong></td><td style="padding:8px 0;color:#101536;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join("");

  try {
    await sendEmail({
      to: recipient,
      replyTo: email,
      subject: `Nieuwe offerteaanvraag: ${name}`,
      html: `<!doctype html><html lang="nl"><body style="margin:0;padding:32px;background:#F3F5F7;font-family:Arial,sans-serif;color:#101536"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:16px;padding:32px"><tr><td><h1 style="margin:0 0 8px;font-size:24px">Nieuwe offerteaanvraag</h1><p style="margin:0 0 24px;color:#606774">Via moreclean.nl</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation">${rows}</table></td></tr></table></td></tr></table></body></html>`,
    });
  } catch (error) {
    console.error("Quote request email failed:", error);
    return NextResponse.json({ error: "Versturen is niet gelukt. Probeer het later opnieuw of neem rechtstreeks contact op." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
