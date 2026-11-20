import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: refresh session Supabase + guard rute admin.
 *
 * Rute yang dilindungi:
 * - /admin/* → hanya admin (app_metadata.role === "admin")
 * - Halaman yang butuh login akan redirect ke /login
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey!,
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

  // Refresh session — JANGAN hapus ini
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Guard: rute admin
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // Belum login → redirect ke /login
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cek peran admin HANYA dari app_metadata (lewat JWT)
    const isAdmin =
      (user.app_metadata as { role?: string })?.role === "admin";

    if (!isAdmin) {
      // Login tapi bukan admin → tampilkan halaman forbidden
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/forbidden";
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // Guard: rute yang butuh login
  const authRequired = ["/pesanan-saya"];
  if (authRequired.some((r) => pathname.startsWith(r)) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const matcher = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];
