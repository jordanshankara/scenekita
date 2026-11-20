import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Halaman Pesanan Saya — placeholder Fase 4.
 * Middleware sudah guard rute ini untuk non-login.
 */
export default async function PesananSayaPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/pesanan-saya");
  }

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "var(--space-8) var(--gutter-mobile)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--text-h1-mobile)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: "var(--space-6)",
        }}
      >
        Pesanan Saya
      </h1>
      <div
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-card)",
          padding: "var(--space-8)",
          textAlign: "center",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-body-sm)",
        }}
      >
        Daftar pesanan kamu akan tampil di sini (Fase 4).
      </div>
    </div>
  );
}
