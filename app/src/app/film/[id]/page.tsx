import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/Badge";
import { StateMessage } from "@/components/StateMessage";
import { FilmScheduleDetail } from "@/components/FilmScheduleDetail";
import { JadwalItem } from "@/components/MovieCard";

interface FilmDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FilmDetailPage({ params }: FilmDetailPageProps) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/login?redirect=/film/${id}`);
  }

  const supabase = await createClient();

  console.log(`[Detail Film] Mengambil data film id: ${id}`);

  // Query detail film beserta jadwal dan studio
  const { data: film, error } = await supabase
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
    .eq("id", id)
    .single();

  if (error || !film) {
    console.error(`[Detail Film Error] id: ${id}:`, error);
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
            type="not-found"
            title="Film Tidak Ditemukan"
            description="Film yang Anda cari tidak ditemukan atau sudah tidak ditayangkan."
            action={{
              label: "Kembali ke Katalog",
              href: "/",
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  // Normalisasi data jadwal
  const jadwalList: JadwalItem[] = (film.jadwal || []).map((j: any) => ({
    id: j.id,
    mulai: j.mulai,
    selesai: j.selesai,
    studio: Array.isArray(j.studio) ? j.studio[0] : j.studio,
  }));

  return (
    <div
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--space-6) var(--gutter-mobile) var(--space-16)",
      }}
    >
      {/* Tombol Kembali */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-caption)",
            fontWeight: 500,
            textDecoration: "none",
            height: "var(--touch-min)", // 44px touch target
            paddingRight: "var(--space-3)",
            transition: "color var(--duration-fast) var(--ease-standard)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Kembali ke Katalog Film
        </Link>
      </div>

      {/* Grid Asimetris: 4 Kolom Kiri (Poster & Info), 8 Kolom Kanan (Jadwal & Info Loket) */}
      <div
        className="film-detail-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "var(--space-8)",
          alignItems: "start",
        }}
      >
        {/* Kolom Kiri: Poster, Judul, Durasi, Sinopsis Penuh */}
        <div className="film-summary-sidebar">
          <div
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              padding: "var(--space-4)",
            }}
          >
            {/* Sampul Rasio 2:3 */}
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "150%", // Rasio 2:3
                background: "linear-gradient(135deg, var(--color-seat-available-bg) 0%, var(--color-surface-card) 100%)",
                borderRadius: "var(--radius-poster)",
                overflow: "hidden",
                marginBottom: "var(--space-4)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "var(--space-4)",
                  textAlign: "center",
                }}
                aria-hidden="true"
              >
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "rgba(244, 246, 251, 0.15)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  SceneKita
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--overlay-poster)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "var(--space-3)",
                  right: "var(--space-3)",
                  zIndex: 2,
                }}
              >
                <Badge variant="neutral" className="tabular-nums">
                  {film.durasi_menit} mnt
                </Badge>
              </div>
            </div>

            {/* Judul & Detail */}
            <h1
              style={{
                fontSize: "var(--text-h2-desktop)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                marginBottom: "var(--space-3)",
                lineHeight: 1.25,
              }}
            >
              {film.judul}
            </h1>

            <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <Badge variant="neutral">Bioskop SceneKita</Badge>
              <Badge variant="neutral" className="tabular-nums">
                Durasi: {film.durasi_menit} Menit
              </Badge>
            </div>

            {/* Sinopsis Penuh (Render sebagai teks biasa, bukan HTML mentah) */}
            <div>
              <h2
                style={{
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Sinopsis
              </h2>
              <p
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {film.sinopsis || "Belum ada sinopsis untuk film ini."}
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Pilihan Jadwal Per Studio & Box Info */}
        <div style={{ minWidth: 0 }}>
          <FilmScheduleDetail jadwalList={jadwalList} />
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .film-detail-grid {
            grid-template-columns: 360px 1fr !important;
          }
          .film-summary-sidebar {
            position: sticky;
            top: 80px;
          }
        }
      `}</style>
    </div>
  );
}
