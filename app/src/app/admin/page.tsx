import { getUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Root admin — redirect middleware sudah menangani non-admin.
 * Ini double-check di sisi Server Component.
 */
export default async function AdminRootPage() {
  const user = await getUser();

  if (!user || !isAdmin(user)) {
    redirect("/forbidden");
  }

  redirect("/admin/pesanan");
}
