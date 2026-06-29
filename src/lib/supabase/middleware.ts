import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Routes that require authentication
  // Note: (portal) route group removes URL segment, so routes are /admin, /klant, /medewerker
  const portalPrefixes = ["/admin", "/klant", "/medewerker"];
  const isPortalRoute = portalPrefixes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isPortalRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (user && isPortalRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Admin routes — only admins allowed
    if ((pathname === "/admin" || pathname.startsWith("/admin/")) && role !== "admin") {
      return NextResponse.redirect(new URL("/klant", request.url));
    }

    // Employee routes — employees and admins allowed
    if ((pathname === "/medewerker" || pathname.startsWith("/medewerker/")) && role !== "employee" && role !== "admin") {
      return NextResponse.redirect(new URL("/klant", request.url));
    }
  }

  return supabaseResponse;
}
