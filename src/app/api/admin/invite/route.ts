import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type InviteReservation = {
  id: string;
  state: "reserved" | "identity_started" | "identity_created" |
    "mail_started" | "mail_accepted" | "complete" | "failed";
  auth_user_id: string | null;
};

const problem = (error: string, status: number) => NextResponse.json({ error }, { status });
const conflict = () => problem("Uitnodiging kan niet worden gestart. Controleer bestaande accounts of uitnodigingen.", 409);

function matchesReservation(
  candidate: { id: string; email?: string; app_metadata?: Record<string, unknown> } | null | undefined,
  reservationId: string,
  email: string,
) {
  return candidate?.id === reservationId && candidate.email?.trim().toLowerCase() === email &&
    candidate.app_metadata?.invite_reservation_id === reservationId;
}

export async function POST(request: NextRequest) {
  // Verify caller is an admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  // This endpoint already authenticates the caller using their session above.
  // Read the authorization profile with the server-only client so an RLS
  // lookup cannot turn a valid admin into a false 403 response.
  const service = createServiceClient();
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role, company_id, active")
    .eq("id", user.id)
    .single();

  if (profileError) return problem("Beheerdersrechten konden niet worden gecontroleerd.", 503);
  if (profile?.role !== "admin" || !profile.active) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; role?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "employee", "customer"].includes(String(role))) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const companyId = profile.company_id;
  if (!companyId) return NextResponse.json({ error: "Beheerder is niet aan een bedrijf gekoppeld" }, { status: 409 });

  const { data: reservationData, error: reservationError } = await service.rpc("reserve_invite", {
    p_actor: user.id,
    p_email: email,
    p_role: role,
    p_company: companyId,
  });
  if (reservationError || !reservationData) {
    const message = reservationError?.message ?? "";
    if (["invite_client_not_unique", "invite_existing_auth_user", "invite_intent_conflict", "invite_completed_drift"]
      .some((code) => message.includes(code))) return conflict();
    if (message.includes("invite_not_authorized")) return problem("Geen toegang", 403);
    return problem("Uitnodiging kon niet worden voorbereid. Probeer later opnieuw.", 503);
  }
  const reservation = reservationData as InviteReservation;

  if (reservation.state === "complete") return NextResponse.json({ ok: true });
  if (reservation.state === "failed") return conflict();
  if (reservation.state === "mail_started") {
    return problem("De uitkomst van de uitnodigingsmail is onzeker. Controleer deze eerst; er is geen nieuwe mail verstuurd.", 409);
  }
  if (reservation.state === "mail_accepted") {
    return NextResponse.json({ pending: true }, { status: 202 });
  }

  if (reservation.state === "reserved") {
    const { data: claimed, error: claimError } = await service.rpc("claim_invite", {
      p_actor: user.id, p_id: reservation.id,
    });
    if (claimError) return problem("De uitnodiging kon niet worden gestart. Probeer later opnieuw.", 503);
    if (claimed !== true) return conflict();

    try {
      // The reservation ID is server-generated and persisted before this call.
      // createUser rejects *all* existing email identities, including unconfirmed ones.
      const { data: created, error } = await service.auth.admin.createUser({
        id: reservation.id,
        email,
        email_confirm: false,
        app_metadata: { invite_reservation_id: reservation.id },
      });
      if (error) {
        if (error.code === "email_exists") {
          await service.rpc("fail_invite_existing_user", { p_actor: user.id, p_id: reservation.id });
          return conflict();
        }
        return problem("De uitkomst van het aanmaken van het account is onzeker. Controleer deze eerst.", 503);
      }
      if (!matchesReservation(created.user, reservation.id, email)) {
        return problem("De accountidentiteit kon niet veilig worden bevestigd. Controleer deze eerst.", 503);
      }
    } catch {
      return problem("De uitkomst van het aanmaken van het account is onzeker. Controleer deze eerst.", 503);
    }
  } else if (reservation.state === "identity_started") {
    // Never adopt an account found by email. A lost createUser response can be
    // reconciled only through the predetermined Auth ID and admin-only marker.
    const { data: existing, error } = await service.auth.admin.getUserById(reservation.id);
    if (error || !matchesReservation(existing.user, reservation.id, email)) {
      return problem("De uitkomst van het aanmaken van het account is onzeker. Controleer deze eerst.", 409);
    }
  }

  if (reservation.state !== "identity_created") {
    const { data: identityConfirmed, error: identityError } = await service.rpc("confirm_invite_identity", {
      p_actor: user.id, p_id: reservation.id,
    });
    if (identityError || identityConfirmed !== true) return problem("De accountidentiteit kon niet veilig worden bevestigd. Controleer deze eerst.", 409);
  }

  const { data: mailClaimed, error: mailClaimError } = await service.rpc("claim_invite_mail", {
    p_actor: user.id, p_id: reservation.id,
  });
  if (mailClaimError || mailClaimed !== true) return problem("De uitnodigingsmail kon niet veilig worden gestart. Controleer de uitnodiging eerst.", 409);

  let invitedUserId: string | undefined;
  try {
    const { data: invited, error } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.moreclean.nl"}/reset-password`,
    });
    if (error) return problem("De uitkomst van de uitnodigingsmail is onzeker. Controleer deze eerst; probeer niet opnieuw te verzenden.", 503);
    if (!matchesReservation(invited.user, reservation.id, email)) {
      return problem("De uitgenodigde accountidentiteit klopt niet. Controleer deze eerst; er wordt niet opnieuw gemaild.", 503);
    }
    invitedUserId = invited.user.id;
  } catch {
    return problem("De uitkomst van de uitnodigingsmail is onzeker. Controleer deze eerst; probeer niet opnieuw te verzenden.", 503);
  }

  const { data: confirmed, error: confirmError } = await service.rpc("confirm_invite_mail", {
    p_actor: user.id, p_id: reservation.id, p_auth_user: invitedUserId,
  });
  if (confirmError || confirmed !== true) return problem("De uitnodiging is mogelijk verstuurd, maar de accountkoppeling kon niet worden bevestigd. Controleer deze eerst.", 503);
  // Mail acceptance is not account acceptance. Only the recipient's verified
  // OTP/session may transactionally complete the application permissions.
  return NextResponse.json({ pending: true }, { status: 202 });
}
