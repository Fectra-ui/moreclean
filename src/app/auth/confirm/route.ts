import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP = /^\d{6,10}$/;

function redirect(path: "/reset-password" | "/auth/confirm-invite?error=invalid" | "/auth/confirm-invite?error=retry") {
  const response = new NextResponse(null, { status: 303, headers: { Location: path } });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let sameOrigin = false;
  try {
    const parsed = new URL(origin ?? "");
    sameOrigin = parsed.origin === origin && parsed.host === host &&
      parsed.protocol === request.nextUrl.protocol;
  } catch {
    // A missing or malformed Origin is not allowed for this browser form.
  }
  if (!sameOrigin || request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("content-type")?.split(";", 1)[0] !== "application/x-www-form-urlencoded") {
    return new Response("Niet toegestaan", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const body = await request.formData().catch(() => null);
  const resume = body?.get("resume") === "1";
  const email = body?.get("email");
  const token = body?.get("code");
  if (!resume && (typeof email !== "string" || !EMAIL.test(email.trim()) ||
      email.length > 254 || typeof token !== "string" || !OTP.test(token))) {
    return redirect("/auth/confirm-invite?error=invalid");
  }

  const supabase = await createClient();
  let user: User;
  try {
    if (resume) {
      const result = await supabase.auth.getUser();
      if (result.error || !result.data.user) return redirect("/auth/confirm-invite?error=invalid");
      user = result.data.user;
    } else {
      const result = await supabase.auth.verifyOtp({
        email: (email as string).trim().toLowerCase(),
        token: token as string,
        type: "invite",
      });
      if (result.error || !result.data.session || !result.data.user) {
        return redirect("/auth/confirm-invite?error=invalid");
      }
      user = result.data.user;
    }
  } catch {
    return redirect("/auth/confirm-invite?error=invalid");
  }

  // The code/session proves possession of the invited email, not authorization.
  // The durable reservation and server-owned Auth metadata must still agree.
  const service = createServiceClient();
  const [{ data: reservation, error: reservationError }, { data: identity, error: identityError }] =
    await Promise.all([
      service.from("invite_reservations")
        .select("id, email_normalized, auth_user_id, state, active")
        .eq("id", user.id).maybeSingle(),
      service.auth.admin.getUserById(user.id),
    ]);
  if (reservationError || identityError || !reservation || !identity.user ||
      !reservation.active || reservation.id !== user.id || reservation.auth_user_id !== user.id ||
      !["mail_started", "mail_accepted", "complete"].includes(reservation.state) ||
      identity.user.id !== user.id ||
      identity.user.email?.trim().toLowerCase() !== reservation.email_normalized ||
      user.email?.trim().toLowerCase() !== reservation.email_normalized ||
      identity.user.app_metadata?.invite_reservation_id !== reservation.id) {
    if (!resume) await supabase.auth.signOut().catch(() => undefined);
    return redirect("/auth/confirm-invite?error=invalid");
  }

  const { data: complete, error: completeError } = await service.rpc("complete_invite", {
    p_id: reservation.id,
    p_auth_user: user.id,
  });
  if (completeError || complete !== true) {
    // Keep the verified session: a retry resumes only this transaction.
    return redirect("/auth/confirm-invite?error=retry");
  }
  return redirect("/reset-password");
}
