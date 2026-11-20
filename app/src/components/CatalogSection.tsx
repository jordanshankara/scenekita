"use client";

import React, { useState, useMemo } from "react";
import { DateTabs } from "./DateTabs";
import { MovieCard, FilmWithJadwal } from "./MovieCard";
import { StateMessage } from "./StateMessage";
import { getTigaHariKedepan, getTanggalKey, HariOpsi } from "@/lib/date";

interface CatalogSectionProps {
  initialFilms: FilmWithJadwal[];
}

export function CatalogSection({ initialFilms }: CatalogSectionProps) {
  const days = useMemo<HariOpsi[]>(() => getTigaHariKedepan(), []);
  // Default ke "all" atau hari ini (days[0].key)
  const [selectedDateKey, setSelectedDateKey] = useState<string>("all");

  // Filter film dan jadwal sesuai tanggal terpilih
  const filteredFilms = useMemo(() => {
    return initialFilms
      .map((film) => {
        // Urutkan jadwal mulai dari yang paling awal
        const sortedJadwal = [...(film.jadwal || [])].sort(
          (a, b) => new Date(a.mulai).getTime() - new Date(b.mulai).getTime()
        );

        if (selectedDateKey === "all") {
          return {
            ...film,
            jadwal: sortedJadwal,
          };
        }

        const jadwalOnDate = sortedJadwal.filter(
          (j) => getTanggalKey(j.mulai) === selectedDateKey
        );

        return {
          ...film,
          jadwal: jadwalOnDate,
        };
      })
      .filter((film) => film.jadwal.length > 0); // Tampilkan hanya yang memiliki jadwal
  }, [initialFilms, selectedDateKey]);

  return (
    <section>
      {/* Header & Filter Tanggal 3 Hari */}
      <div
        style={{
          marginBottom: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <h2
            style={{
              fontSize: "var(--text-h2-mobile)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Sedang Tayang
          </h2>
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            Pilih tanggal untuk melihat jadwal
          </span>
        </div>

        {/* Tab Filter Tanggal */}
        <DateTabs
          days={days}
          selectedKey={selectedDateKey}
          onSelect={setSelectedDateKey}
          showAllOption={true}
        />
      </div>

      {/* Grid Film (1 Kolom Mobile 390px, 2-4 Kolom Desktop) */}
      {filteredFilms.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          {filteredFilms.map((film) => (
            <MovieCard
              key={film.id}
              film={film}
              tanggalTerpilih={selectedDateKey}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-8)",
            marginTop: "var(--space-4)",
          }}
        >
          <StateMessage
            type="empty"
            title="Tidak Ada Jadwal Tayang"
            description="Tidak ada jadwal tayang film pada tanggal yang Anda pilih. Silakan pilih tanggal lain."
            action={{
              label: "Lihat Semua Tanggal",
              onClick: () => setSelectedDateKey("all"),
              variant: "primary",
            }}
          />
        </div>
      )}
    </section>
  );
}
