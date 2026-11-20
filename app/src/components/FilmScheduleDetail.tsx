"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DateTabs } from "./DateTabs";
import { Badge } from "./Badge";
import { StateMessage } from "./StateMessage";
import { getTigaHariKedepan, getTanggalKey, formatJam, isJadwalLewat, HariOpsi } from "@/lib/date";
import { JadwalItem } from "./MovieCard";

interface FilmScheduleDetailProps {
  jadwalList: JadwalItem[];
}

export function FilmScheduleDetail({ jadwalList }: FilmScheduleDetailProps) {
  const days = useMemo<HariOpsi[]>(() => getTigaHariKedepan(), []);
  // Default ke hari pertama (Hari Ini)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(days[0]?.key || "all");

  // Filter jadwal sesuai tanggal yang dipilih
  const jadwalHariTerpilih = useMemo(() => {
    if (selectedDateKey === "all") return jadwalList;
    return jadwalList.filter((j) => getTanggalKey(j.mulai) === selectedDateKey);
  }, [jadwalList, selectedDateKey]);

  // Kelompokkan jadwal per studio
  const jadwalByStudio = useMemo(() => {
    const groups: Record<string, { studioNama: string; items: JadwalItem[] }> = {};

    jadwalHariTerpilih.forEach((j) => {
      const studioNama = j.studio?.nama || "Studio Lain";
      if (!groups[studioNama]) {
        groups[studioNama] = {
          studioNama,
          items: [],
        };
      }
      groups[studioNama].items.push(j);
    });

    // Urutkan item jadwal per studio berdasarkan waktu mulai
    Object.values(groups).forEach((g) => {
      g.items.sort((a, b) => new Date(a.mulai).getTime() - new Date(b.mulai).getTime());
    });

    return Object.values(groups);
  }, [jadwalHariTerpilih]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Tab Filter Tanggal 3 Hari */}
      <div>
        <h2
          style={{
            fontSize: "var(--text-h3)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-3)",
          }}
        >
          Pilih Tanggal Penayangan
        </h2>
        <DateTabs
          days={days}
          selectedKey={selectedDateKey}
          onSelect={setSelectedDateKey}
          showAllOption={false}
        />
      </div>

      {/* Daftar Jadwal Per Studio */}
      {jadwalByStudio.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {jadwalByStudio.map((group) => (
            <div
              key={group.studioNama}
              style={{
                backgroundColor: "var(--color-surface-card)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-card)",
                padding: "var(--space-4) var(--space-6)",
              }}
            >
              {/* Header Studio */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-4)",
                  paddingBottom: "var(--space-3)",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-primary-light)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                  <span style={{ fontWeight: 600, fontSize: "var(--text-body)" }}>
                    {group.studioNama}
                  </span>
                </div>
                <Badge variant="neutral">Kursi Bernomor</Badge>
              </div>

              {/* Grid Jam Tayang */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--space-3)",
                }}
              >
                {group.items.map((j) => {
                  const lewat = isJadwalLewat(j.mulai);
                  const jamMulai = formatJam(j.mulai);
                  const jamSelesai = formatJam(j.selesai);

                  if (lewat) {
                    return (
                      <div
                        key={j.id}
                        title="Jam tayang sudah lewat (tidak dapat dipesan)"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "56px",
                          minWidth: "96px",
                          padding: "0 var(--space-3)",
                          backgroundColor: "var(--color-bg-page)",
                          border: "1px solid var(--color-border-subtle)",
                          borderRadius: "var(--radius-control)",
                          opacity: 0.45,
                          cursor: "not-allowed",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--text-body)",
                            fontWeight: 600,
                            color: "var(--color-text-muted)",
                            textDecoration: "line-through",
                          }}
                          className="tabular-nums"
                        >
                          {jamMulai}
                        </span>
                        <span
                          style={{
                            fontSize: "var(--text-caption)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Selesai
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={j.id}
                      href={`/jadwal/${j.id}/kursi`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "56px",
                        minWidth: "96px",
                        padding: "0 var(--space-3)",
                        backgroundColor: "var(--color-surface-elevated)",
                        border: "1px solid var(--color-border-secondary)",
                        borderRadius: "var(--radius-control)",
                        color: "var(--color-text-primary)",
                        textDecoration: "none",
                        transition: "all var(--duration-fast) var(--ease-standard)",
                      }}
                      className="hover:border-primary hover:bg-surface-shimmer"
                    >
                      <span
                        style={{
                          fontSize: "var(--text-body)",
                          fontWeight: 700,
                          color: "var(--color-primary-light)",
                        }}
                        className="tabular-nums"
                      >
                        {jamMulai}
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-caption)",
                          color: "var(--color-text-muted)",
                        }}
                        className="tabular-nums"
                      >
                        s/d {jamSelesai}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
            title="Tidak Ada Jadwal"
            description="Tidak ada penayangan film ini pada tanggal yang dipilih. Silakan coba pilih hari lain."
            action={{
              label: "Pilih Hari Lain",
              onClick: () => setSelectedDateKey(days[0]?.key || "all"),
              variant: "secondary",
            }}
          />
        </div>
      )}

      {/* Kotak Info Pembayaran di Loket */}
      <div
        style={{
          backgroundColor: "rgba(245, 183, 59, 0.08)",
          border: "1px solid rgba(245, 183, 59, 0.25)",
          borderRadius: "var(--radius-card)",
          padding: "var(--space-4) var(--space-6)",
          display: "flex",
          gap: "var(--space-3)",
          alignItems: "flex-start",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-status-warning)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0, marginTop: "2px" }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div style={{ fontSize: "var(--text-caption)", lineHeight: 1.55 }}>
          <strong style={{ color: "var(--color-status-warning)", display: "block", marginBottom: "2px" }}>
            Informasi Penting Pemesanan
          </strong>
          <span style={{ color: "var(--color-text-muted)" }}>
            Aplikasi ini menahan kursi selama 60 menit. Pembayaran dan konfirmasi tiket fisik dilakukan langsung di loket bioskop dengan menyebutkan kode booking dan email akun Anda.
          </span>
        </div>
      </div>
    </div>
  );
}
