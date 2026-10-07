import { createClient, createServiceClient } from "@/lib/supabase/server";
import { buildEmailRequestBody, EmailProviderError, requireEmailConfiguration, sendStoredEmail } from "@/lib/email/client";
import { quoteSentEmail } from "@/lib/email/templates";

type SendClaim = {
  state: "reserved" | "sending" | "rejected" | "uncertain" | "accepted" | "complete";
  request_body: string;
  idempotency_key: string;
  started_at: string | null;
  last_attempt_at: string | null;
};

export class QuoteSendError extends Error {
  constructor(message: string, public readonly status = 422) { super(message); }
}

function rpcResult<T>(data: T | null, error: { message: string } | null): T {
  if (error || !data) throw new QuoteSendError("Verzending kon niet worden vastgelegd; controleer de offerte voordat u opnieuw probeert.");
  return data;
}

function isDefiniteRefusal(error: unknown): boolean {
  if (!(error instanceof EmailProviderError)) return false;
  // Never infer non-acceptance from a generic 4xx/5xx or an idempotency conflict.
  return error.status === 429 || (error.status === 400 && error.code === "validation_error")
    || (error.status === 401 && error.code === "invalid_api_key")
    || (error.status === 403 && error.code === "validation_error");
}

export async function sendQuoteToClient(quoteId: string): Promise<void> {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new QuoteSendError("Niet ingelogd.", 401);

  const { data: profile, error: profileError } = await userClient.from("profiles")
    .select("role, company_id, active").eq("id", user.id).single();
  if (profileError || profile?.role !== "admin" || !profile.company_id || !profile.active) {
    throw new QuoteSendError("Geen toegang tot deze offerte.", 403);
  }
  const { data: quote, error: quoteError } = await userClient.from("quotes")
    .select("id, company_id, client_id, quote_number, total, status, workflow_state, sent_at")
    .eq("id", quoteId).eq("company_id", profile.company_id).single();
  if (quoteError || !quote) throw new QuoteSendError("Offerte niet gevonden.", 404);
  const { data: client, error: clientError } = await userClient.from("clients")
    .select("id, company_id, contact_name, email")
    .eq("id", quote.client_id).eq("company_id", profile.company_id).single();
  if (clientError || !client) throw new QuoteSendError("Klant niet gevonden.", 404);

  const svc = createServiceClient();
  const { data: existing, error: lookupError } = await svc.from("quote_email_sends")
    .select("state, request_body, idempotency_key, started_at")
    .eq("quote_id", quoteId).maybeSingle();
  if (lookupError) throw new QuoteSendError("Verzendstatus kon niet worden opgehaald.", 500);
  let claim = existing as SendClaim | null;
  if (claim?.state === "complete") return;
  if (claim?.state === "accepted") {
    const result = await svc.rpc("finalize_quote_email_send", { p_quote_id: quoteId });
    rpcResult(result.data, result.error);
    return;
  }

  // Configuration and recipient failures must not create a provider-attempt state.
  requireEmailConfiguration();
  const email = client.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new QuoteSendError("De klant heeft geen geldig e-mailadres.");
  }
  if (!claim) {
    if (quote.status !== "draft" || quote.workflow_state !== "concept" || quote.sent_at) {
      throw new QuoteSendError("Deze offerte kan niet worden verzonden.");
    }
    const tpl = quoteSentEmail({
      clientName: client.contact_name, quoteNumber: quote.quote_number,
      total: quote.total,
      portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.moreclean.nl"}/klant/offertes/${quoteId}`,
    });
    const requestBody = buildEmailRequestBody({ to: email, ...tpl });
    const result = await svc.rpc("reserve_quote_email_send", {
      p_quote_id: quoteId, p_actor_id: user.id, p_request_body: requestBody,
    });
    claim = rpcResult(result.data as SendClaim | null, result.error);
  }

  // The DB lease is acquired before any provider call. It never resets started_at.
  const start = await svc.rpc("claim_quote_email_send", { p_quote_id: quoteId });
  claim = rpcResult(start.data as SendClaim | null, start.error);
  if (claim.state === "complete") return;
  if (claim.state === "accepted") {
    const result = await svc.rpc("finalize_quote_email_send", { p_quote_id: quoteId });
    rpcResult(result.data, result.error);
    return;
  }
  if (claim.state !== "sending") throw new QuoteSendError("Verzendpoging is niet beschikbaar.");

  let providerId: string;
  try {
    providerId = await sendStoredEmail(claim.request_body, claim.idempotency_key);
  } catch (error) {
    const state = isDefiniteRefusal(error) ? "rejected" : "uncertain";
    const result = await svc.rpc("record_quote_email_outcome", {
      p_quote_id: quoteId, p_state: state, p_attempt_at: claim.last_attempt_at, p_provider_email_id: null,
    });
    rpcResult(result.data, result.error);
    throw new QuoteSendError(state === "uncertain"
      ? "De uitkomst van de mail is onbekend. Probeer niet onbeperkt opnieuw."
      : "De e-mailprovider heeft verzending geweigerd.");
  }

  const proof = await svc.rpc("record_quote_email_outcome", {
    p_quote_id: quoteId, p_state: "accepted", p_attempt_at: claim.last_attempt_at, p_provider_email_id: providerId,
  });
  rpcResult(proof.data, proof.error);
  const finish = await svc.rpc("finalize_quote_email_send", { p_quote_id: quoteId });
  rpcResult(finish.data, finish.error);
}
