import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk komponen browser (Client Components).
 * Pakai hanya kunci anon/publik — JANGAN service_role.
 */
export function createClient() {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey!
  );
}
