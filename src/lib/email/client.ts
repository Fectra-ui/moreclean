// ============================================================
// RESEND E-MAIL CLIENT
// Centrale wrapper — één plek voor auth, logging en retry.
// ============================================================

export interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "More Clean <noreply@moreclean.nl>";

export class EmailProviderError extends Error {
  constructor(message: string, public readonly status?: number, public readonly code?: string) {
    super(message);
  }
}

export function buildEmailRequestBody(opts: SendOptions): string {
  return JSON.stringify({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
  });
}

export function requireEmailConfiguration(): void {
  if (!process.env.RESEND_API_KEY) throw new Error("E-mailverzending is niet geconfigureerd.");
}

export async function sendStoredEmail(requestBody: string, idempotencyKey?: string): Promise<string> {
  requireEmailConfiguration();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: requestBody,
    signal: AbortSignal.timeout(15_000),
  });
  const result = await res.json().catch(() => null) as { id?: unknown; name?: unknown; message?: unknown } | null;
  if (!res.ok) {
    throw new EmailProviderError("E-mailprovider heeft het verzoek geweigerd.", res.status,
      typeof result?.name === "string" ? result.name : undefined);
  }
  if (typeof result?.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.id)) {
    throw new Error("E-mailprovider gaf geen geldig verzendbewijs terug.");
  }
  return result.id;
}

export async function sendEmail(opts: SendOptions): Promise<void> {
  await sendStoredEmail(buildEmailRequestBody(opts));
}
