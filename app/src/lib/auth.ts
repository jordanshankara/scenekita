import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Ambil user yang sedang login dari sisi server.
 * Kembalikan null jika belum login.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Cek apakah user adalah admin.
 * Peran admin HANYA dibaca dari app_metadata — JANGAN dari user_metadata.
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return (user.app_metadata as { role?: string })?.role === "admin";
}

/**
 * Ambil nama tampilan user dari user_metadata.
 * Hanya untuk tampilan, bukan untuk izin akses.
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return "";
  return (
    (user.user_metadata as { nama?: string })?.nama ||
    user.email?.split("@")[0] ||
    "Pengguna"
  );
}
