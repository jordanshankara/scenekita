import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Route handler untuk mengambil data user aktif.
 * Dipakai oleh Navbar (Client Component) agar layout tidak memblok prerendering.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, isAdmin: false, displayName: "" });
  }

  const isAdmin =
    (user.app_metadata as { role?: string })?.role === "admin";

  const displayName =
    (user.user_metadata as { nama?: string })?.nama ||
    user.email?.split("@")[0] ||
    "Pengguna";

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    isAdmin,
    displayName,
  });
}
