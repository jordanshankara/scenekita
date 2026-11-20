import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { CatalogSection } from "@/components/CatalogSection";
import { StateMessage } from "@/components/StateMessage";
import { FilmWithJadwal } from "@/components/MovieCard";

export default async function HomePage() {
  const user = await getUser();

  // Pengguna belum login: Tampilkan prompt masuk sesuai RLS & Guardrails
  if (!user) {
    return (
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "var(--space-8) var(--gutter-mobile)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-8)",
          }}
        >
          <StateMessage
            type="empty"
            title="Selamat Datang di SceneKita"
            description="Pesan kursi bioskop dengan cepat tanpa antrean. Silakan masuk dengan akun penonton untuk melihat jadwal tayang dan memilih kursi."
            action={{
              label: "Masuk Sekarang",
              href: "/login",
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  console.log("[Katalog Film] Mengambil data film dan jadwal...");

  // Query data film beserta jadwal dan studio
  const { data: rawFilms, error } = await supabase
    .from("film")
    .select(`
      id,
      judul,
      durasi_menit,
      sinopsis,
      jadwal (
        id,
        mulai,
        selesai,
        studio_id,
        studio (
          id,
          nama
        )
      )
    `)
    .order("judul", { ascending: true });

  if (error) {
    console.error("[Katalog Film Error]:", error);
    return (
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "var(--space-8) var(--gutter-mobile)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-8)",
          }}
        >
          <StateMessage
            type="error"
            title="Gagal Memuat Film"
            description={`Terjadi kendala saat memuat katalog film: ${error.message || "Error server"}.`}
            action={{
              label: "Muat Ulang",
              href: "/",
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  console.log(`[Katalog Film Sukses] Berhasil memuat ${rawFilms?.length || 0} film.`);

  // Normalisasi data dari PostgREST
  const films: FilmWithJadwal[] = (rawFilms || []).map((f: any) => ({
    id: f.id,
    judul: f.judul,
    durasi_menit: f.durasi_menit,
    sinopsis: f.sinopsis,
    jadwal: (f.jadwal || []).map((j: any) => ({
      id: j.id,
      mulai: j.mulai,
      selesai: j.selesai,
      studio: Array.isArray(j.studio) ? j.studio[0] : j.studio,
    })),
  }));

  return (
    <div
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--space-8) var(--gutter-mobile) var(--space-16)",
      }}
    >
      <header style={{ marginBottom: "var(--space-8)" }}>
        <h1
          style={{
            fontSize: "var(--text-h1-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-2)",
            letterSpacing: "-0.02em",
          }}
        >
          Katalog Film Bioskop
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body)",
            margin: 0,
          }}
        >
          Pilih film dan jadwal tayang favoritmu. Pembayaran dilakukan langsung di loket bioskop.
        </p>
      </header>

      <CatalogSection initialFilms={films} />
    </div>
  );
}
