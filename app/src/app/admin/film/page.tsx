export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { AdminFilmManager, FilmRow } from "@/components/AdminFilmManager";

export default async function AdminFilmPage() {
  const supabase = await createClient();

  // Ambil daftar film
  const { data: rawFilms } = await supabase
    .from("film")
    .select("id, judul, durasi_menit, sinopsis, dibuat_at")
    .order("dibuat_at", { ascending: false });

  const films: FilmRow[] = rawFilms || [];

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
          Kelola Film Bioskop
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body-sm)",
            margin: 0,
          }}
        >
          Tambah film baru dan perbarui informasi judul, durasi, maupun sinopsis film.
        </p>
      </div>

      <AdminFilmManager initialFilms={films} />
    </div>
  );
}
