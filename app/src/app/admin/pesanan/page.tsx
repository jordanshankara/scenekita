export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { AdminOrdersManager, JadwalOption } from "@/components/AdminOrdersManager";

export default async function AdminPesananPage() {
  const supabase = await createClient();

  // Ambil daftar jadwal untuk pilihan dropdown admin
  const { data: rawJadwal } = await supabase
    .from("jadwal")
    .select(`
      id,
      mulai,
      selesai,
      film:film_id (judul),
      studio:studio_id (nama)
    `)
    .order("mulai", { ascending: false });

  const jadwalOptions: JadwalOption[] = (rawJadwal || []).map((j: any) => {
    const fData = Array.isArray(j.film) ? j.film[0] : j.film;
    const sData = Array.isArray(j.studio) ? j.studio[0] : j.studio;
    return {
      id: j.id,
      filmJudul: fData?.judul || "Film",
      studioNama: sData?.nama || "Studio",
      mulai: j.mulai,
      selesai: j.selesai,
    };
  });

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontSize: "var(--text-h2-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-2)",
          }}
        >
          Daftar Pesanan & Loket Kasir
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body-sm)",
            margin: 0,
          }}
        >
          Pilih jadwal tayang untuk melihat daftar pemesan, konfirmasi pembayaran fisik, atau batalkan pesanan.
        </p>
      </div>

      <AdminOrdersManager jadwalOptions={jadwalOptions} />
    </div>
  );
}
