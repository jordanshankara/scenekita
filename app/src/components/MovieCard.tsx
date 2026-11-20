import React from "react";
import Link from "next/link";
import { Badge } from "./Badge";
import { formatJam, isJadwalLewat } from "@/lib/date";

export interface JadwalItem {
  id: string;
  mulai: string;
  selesai: string;
  studio?: {
    id: string;
    nama: string;
  };
}

export interface FilmWithJadwal {
  id: string;
  judul: string;
  durasi_menit: number;
  sinopsis: string | null;
  jadwal: JadwalItem[];
}

interface MovieCardProps {
  film: FilmWithJadwal;
  tanggalTerpilih?: string; // YYYY-MM-DD
}

export function MovieCard({ film, tanggalTerpilih }: MovieCardProps) {
  // Ambil maksimal 3 jadwal untuk hari terpilih (atau jadwal mendatang terdekat)
  const jadwalHariIni = film.jadwal.slice(0, 3);

  return (
    <article
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-card)", // 16px
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard)",
      }}
    >
      {/* Area Sampul Rasio 2:3 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "150%", // Rasio 2:3 (height = width * 1.5)
          background: "linear-gradient(135deg, var(--color-seat-available-bg) 0%, var(--color-surface-card) 100%)",
          borderRadius: "var(--radius-poster) var(--radius-poster) 0 0",
          overflow: "hidden",
        }}
      >
        {/* Dekorasi Visual Tipografi Teater */}
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
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "rgba(244, 246, 251, 0.15)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              userSelect: "none",
            }}
          >
            SceneKita
          </span>
        </div>

        {/* Overlay Poster Gradasi Gelap */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--overlay-poster)",
          }}
        />

        {/* Badge Durasi di Sudut Kanan Atas */}
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

      {/* Konten Kartu */}
      <div
        style={{
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          gap: "var(--space-3)",
        }}
      >
        {/* Judul Film */}
        <h3
          style={{
            fontSize: "var(--text-h3)", // 18px
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.35,
          }}
        >
          <Link
            href={`/film/${film.id}`}
            style={{
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {film.judul}
          </Link>
        </h3>

        {/* Potongan Sinopsis Maksimal 2 Baris */}
        <p
          style={{
            fontSize: "var(--text-caption)", // 14px (min font)
            color: "var(--color-text-muted)",
            margin: 0,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: "42px",
          }}
        >
          {film.sinopsis || "Sinopsis belum tersedia."}
        </p>

        {/* Chip Jam Tayang (Maksimal 3) */}
        <div>
          <p
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-2)",
              fontWeight: 500,
            }}
          >
            Jam Tayang:
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
              minHeight: "36px",
            }}
          >
            {jadwalHariIni.length > 0 ? (
              jadwalHariIni.map((j) => {
                const lewat = isJadwalLewat(j.mulai);
                const jamStr = formatJam(j.mulai);

                if (lewat) {
                  return (
                    <span
                      key={j.id}
                      title="Jadwal sudah lewat"
                      style={{
                        padding: "6px 10px",
                        borderRadius: "var(--radius-control)",
                        backgroundColor: "var(--color-surface-elevated)",
                        color: "var(--color-text-muted)",
                        fontSize: "var(--text-caption)",
                        opacity: 0.45,
                        cursor: "not-allowed",
                        border: "1px solid var(--color-border-subtle)",
                        textDecoration: "line-through",
                      }}
                      className="tabular-nums"
                    >
                      {jamStr}
                    </span>
                  );
                }

                return (
                  <Link
                    key={j.id}
                    href={`/jadwal/${j.id}/kursi`}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-control)",
                      backgroundColor: "var(--color-surface-elevated)",
                      color: "var(--color-primary-light)",
                      fontSize: "var(--text-caption)",
                      fontWeight: 600,
                      textDecoration: "none",
                      border: "1px solid var(--color-border-secondary)",
                      transition: "all var(--duration-fast) var(--ease-standard)",
                    }}
                    className="tabular-nums"
                  >
                    {jamStr}
                  </Link>
                );
              })
            ) : (
              <span
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--color-text-muted)",
                  fontStyle: "italic",
                }}
              >
                Tidak ada jam tayang
              </span>
            )}
          </div>
        </div>

        {/* Tombol Secondary Lebar Penuh: Lihat Jadwal */}
        <div style={{ marginTop: "auto", paddingTop: "var(--space-2)" }}>
          <Link
            href={`/film/${film.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "var(--touch-min)", // 44px
              backgroundColor: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border-secondary)",
              borderRadius: "var(--radius-control)",
              color: "var(--color-text-primary)",
              fontSize: "var(--text-caption)",
              fontWeight: 600,
              textDecoration: "none",
              transition: "border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard)",
            }}
          >
            Lihat Jadwal
          </Link>
        </div>
      </div>
    </article>
  );
}
