"use client";

import React from "react";

export interface KursiData {
  kursi_id: string;
  baris: string;
  kolom: number;
  kode: string;
  terisi: boolean;
}

interface SeatMapProps {
  kursiList: KursiData[];
  selectedKursiIds: string[];
  onToggleKursi: (kursi: KursiData) => void;
  maxSelectable: number;
  studioNama: string;
  jumlahBaris: number;
  jumlahKolom: number;
}

export function SeatMap({
  kursiList,
  selectedKursiIds,
  onToggleKursi,
  maxSelectable,
  studioNama,
  jumlahBaris,
  jumlahKolom,
}: SeatMapProps) {
  // Susun kursi ke dalam baris-baris (A, B, C, ...)
  const barisMap = React.useMemo(() => {
    const map: Record<string, KursiData[]> = {};
    kursiList.forEach((k) => {
      if (!map[k.baris]) {
        map[k.baris] = [];
      }
      map[k.baris].push(k);
    });

    // Urutkan kolom dalam tiap baris
    Object.keys(map).forEach((b) => {
      map[b].sort((a, b) => a.kolom - b.kolom);
    });

    return map;
  }, [kursiList]);

  const barisKeys = Object.keys(barisMap).sort();

  // Tentukan kolom pemisah lorong tengah (misal: kolom 4 di Studio 2 yang 8 kolom, kolom 5 di Studio 1 yang 10 kolom)
  const aisleAfterKolom = Math.floor(jumlahKolom / 2);

  const isQuotaLocked = selectedKursiIds.length >= maxSelectable;

  return (
    <div
      role="region"
      aria-label={`Denah kursi ${studioNama}`}
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-card)",
        padding: "var(--space-6) var(--space-4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        overflowX: "auto", // Dukung scroll horizontal halus di 390px
      }}
    >
      {/* Layar Bioskop Melengkung */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "var(--space-8)",
        }}
      >
        <div
          style={{
            width: "85%",
            height: "8px",
            background: "linear-gradient(90deg, rgba(63,92,224,0.1) 0%, var(--color-primary-light) 50%, rgba(63,92,224,0.1) 100%)",
            borderRadius: "50% 50% 0 0",
            boxShadow: "var(--glow-screen)",
          }}
        />
        <span
          style={{
            marginTop: "var(--space-2)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
          }}
        >
          Layar Bioskop
        </span>
      </div>

      {/* Legenda Multimodal (Bukan Hanya Warna) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-border-subtle)",
          width: "100%",
          maxWidth: "520px",
        }}
      >
        {/* Tersedia */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px 4px 2px 2px",
              backgroundColor: "var(--color-seat-available-bg)",
              border: "1.5px solid var(--color-seat-available-border)",
            }}
          />
          <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
            Tersedia
          </span>
        </div>

        {/* Dipilih */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px 4px 2px 2px",
              backgroundColor: "var(--color-seat-selected-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-primary)",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
            Dipilih
          </span>
        </div>

        {/* Terisi */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px 4px 2px 2px",
              backgroundColor: "var(--color-seat-occupied-bg)",
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 6px)",
              opacity: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-muted)",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            ×
          </div>
          <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
            Terisi
          </span>
        </div>
      </div>

      {/* Grid Denah Kursi */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: "fit-content",
          padding: "var(--space-2)",
        }}
      >
        {barisKeys.map((baris) => {
          const kursiDiBaris = barisMap[baris];
          return (
            <div
              key={baris}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {/* Label Huruf Baris di Kiri */}
              <span
                style={{
                  width: "24px",
                  fontSize: "var(--text-caption)",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                }}
              >
                {baris}
              </span>

              {/* Kursi-kursi dalam satu baris */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {kursiDiBaris.map((kursi) => {
                  const isSelected = selectedKursiIds.includes(kursi.kursi_id);
                  const isOccupied = kursi.terisi;
                  const isLocked = isQuotaLocked && !isSelected && !isOccupied;

                  // Jarak lorong tengah pemisah
                  const isAisleEdge = kursi.kolom === aisleAfterKolom;

                  return (
                    <div
                      key={kursi.kursi_id}
                      style={{
                        marginRight: isAisleEdge ? "18px" : "0",
                      }}
                    >
                      <button
                        type="button"
                        disabled={isOccupied || isLocked}
                        onClick={() => onToggleKursi(kursi)}
                        aria-label={`Kursi ${kursi.kode}, ${
                          isOccupied
                            ? "sudah terisi"
                            : isSelected
                            ? "dipilih"
                            : isLocked
                            ? "kuota penuh"
                            : "tersedia"
                        }`}
                        aria-pressed={isSelected}
                        title={
                          isOccupied
                            ? `Kursi ${kursi.kode} sudah terisi`
                            : isLocked
                            ? "Maksimal 4 kursi per akun"
                            : `Pilih Kursi ${kursi.kode}`
                        }
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "var(--radius-seat) var(--radius-seat) 4px 4px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isOccupied || isLocked ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          fontSize: "12px",
                          fontWeight: 600,
                          transition: "all var(--duration-fast) var(--ease-standard)",
                          position: "relative",
                          outline: "none",
                          // Multimodal styling
                          ...(isSelected
                            ? {
                                backgroundColor: "var(--color-seat-selected-bg)",
                                color: "var(--color-text-primary)",
                                border: "1.5px solid var(--color-primary-light)",
                                boxShadow: "0 0 10px rgba(63,92,224,0.5)",
                              }
                            : isOccupied
                            ? {
                                backgroundColor: "var(--color-seat-occupied-bg)",
                                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 6px)",
                                color: "var(--color-text-muted)",
                                border: "1px solid var(--color-border-subtle)",
                                opacity: 0.45,
                              }
                            : isLocked
                            ? {
                                backgroundColor: "var(--color-seat-available-bg)",
                                color: "var(--color-text-muted)",
                                border: "1px solid var(--color-border-subtle)",
                                opacity: 0.35,
                              }
                            : {
                                backgroundColor: "var(--color-seat-available-bg)",
                                color: "var(--color-text-primary)",
                                border: "1.5px solid var(--color-seat-available-border)",
                              }),
                        }}
                      >
                        {isSelected ? (
                          <>
                            <span style={{ fontSize: "11px", lineHeight: 1 }}>✓</span>
                            <span style={{ fontSize: "11px", lineHeight: 1 }}>{kursi.kode}</span>
                          </>
                        ) : isOccupied ? (
                          <>
                            <span style={{ fontSize: "12px", lineHeight: 1 }}>×</span>
                            <span style={{ fontSize: "10px", opacity: 0.6 }}>{kursi.kode}</span>
                          </>
                        ) : (
                          <span>{kursi.kode}</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Label Huruf Baris di Kanan */}
              <span
                style={{
                  width: "24px",
                  fontSize: "var(--text-caption)",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                }}
              >
                {baris}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
