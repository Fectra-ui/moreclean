// ============================================================
// RESEND E-MAIL CLIENT
// Centrale wrapper — één plek voor auth, logging en retry.
// ============================================================

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "More Clean <noreply@moreclean.nl>";

export async function sendEmail(opts: SendOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    const toList = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
    console.log(`[email] RESEND_API_KEY niet ingesteld — mail niet verzonden: "${opts.subject}" → ${toList}`);
    return;
  }

  const body = {
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}
