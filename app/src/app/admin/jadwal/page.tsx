export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { AdminJadwalManager, JadwalRow, FilmOption, StudioOption } from "@/components/AdminJadwalManager";

export default async function AdminJadwalPage() {
  const supabase = await createClient();

  // 1. Ambil daftar jadwal
  const { data: rawJadwal } = await supabase
    .from("jadwal")
    .select(`
      id,
      film_id,
      studio_id,
      mulai,
      selesai,
      film:film_id (id, judul, durasi_menit),
      studio:studio_id (id, nama)
    `)
    .order("mulai", { ascending: false });

  // 2. Ambil daftar film untuk pilihan dropdown
  const { data: rawFilms } = await supabase
    .from("film")
    .select("id, judul, durasi_menit")
    .order("judul", { ascending: true });

  // 3. Ambil daftar studio tetap (Studio 1, Studio 2)
  const { data: rawStudios } = await supabase
    .from("studio")
    .select("id, nama")
    .order("nama", { ascending: true });

  const initialJadwal: JadwalRow[] = (rawJadwal || []).map((j: any) => ({
    id: j.id,
    film_id: j.film_id,
    studio_id: j.studio_id,
    mulai: j.mulai,
    selesai: j.selesai,
    film: Array.isArray(j.film) ? j.film[0] : j.film,
    studio: Array.isArray(j.studio) ? j.studio[0] : j.studio,
  }));

  const filmOptions: FilmOption[] = rawFilms || [];
  const studioOptions: StudioOption[] = rawStudios || [];

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
          Kelola Jadwal Tayang Bioskop
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body-sm)",
            margin: 0,
          }}
        >
          Atur jadwal penayangan film per studio. Sistem secara otomatis menghitung perkiraan jam selesai dan mencegah jadwal bentrok.
        </p>
      </div>

      <AdminJadwalManager
        initialJadwal={initialJadwal}
        filmOptions={filmOptions}
        studioOptions={studioOptions}
      />
    </div>
  );
}
