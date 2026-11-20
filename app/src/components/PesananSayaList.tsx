"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Badge, BadgeVariant } from "./Badge";
import { StateMessage } from "./StateMessage";
import { formatJam, formatTanggalLengkap } from "@/lib/date";

export interface PesananSayaItem {
  id: string;
  kodeBooking: string;
  status: "ditahan" | "terkonfirmasi" | "batal";
  batasWaktu: string;
  dibuatAt: string;
  filmJudul: string;
  studioNama: string;
  jamMulai: string;
  jamSelesai: string;
  kursiList: string[];
}

interface PesananSayaListProps {
  initialOrders: PesananSayaItem[];
  userEmail: string;
}

type FilterStatus = "semua" | "ditahan" | "terkonfirmasi" | "batal";

export function PesananSayaList({ initialOrders, userEmail }: PesananSayaListProps) {
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(kode: string, id: string) {
    try {
      await navigator.clipboard.writeText(kode);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  }

  const filteredOrders = useMemo(() => {
    if (filter === "semua") return initialOrders;
    return initialOrders.filter((order) => order.status === filter);
  }, [initialOrders, filter]);

  const filterOptions: { key: FilterStatus; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "ditahan", label: "Ditahan" },
    { key: "terkonfirmasi", label: "Terkonfirmasi" },
    { key: "batal", label: "Batal" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header Info Akun */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block" }}>
            Akun Penonton
          </span>
          <span style={{ fontSize: "var(--text-body)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {userEmail}
          </span>
        </div>
        <Badge variant="neutral">
          Total {initialOrders.length} Pesanan
        </Badge>
      </div>

      {/* Banner Aturan Konfirmasi & Pembatalan di Loket */}
      <div
        style={{
          backgroundColor: "rgba(63, 92, 224, 0.08)",
          border: "1px solid rgba(63, 92, 224, 0.25)",
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
          stroke="var(--color-primary-light)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0, marginTop: "2px" }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div style={{ fontSize: "var(--text-caption)", lineHeight: 1.55 }}>
          <strong style={{ color: "var(--color-primary-light)", display: "block", marginBottom: "2px" }}>
            Aturan Pengambilan Tiket di Loket
          </strong>
          <span style={{ color: "var(--color-text-muted)" }}>
            Tunjukkan kode booking dan email Anda ke loket bioskop untuk membayar tiket fisik sebelum batas waktu habis. Pesanan yang melewati batas waktu akan otomatis dibatalkan sistem.
          </span>
        </div>
      </div>

      {/* Pill Filter Status */}
      <div
        role="tablist"
        aria-label="Filter status pesanan"
        style={{
          display: "flex",
          gap: "var(--space-2)",
          overflowX: "auto",
          paddingBottom: "var(--space-1)",
        }}
      >
        {filterOptions.map((opt) => {
          const isSelected = filter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setFilter(opt.key)}
              style={{
                padding: "8px 16px",
                height: "var(--touch-min)", // 44px
                borderRadius: "var(--radius-pill)",
                fontSize: "var(--text-caption)",
                fontWeight: isSelected ? 600 : 500,
                cursor: "pointer",
                border: isSelected
                  ? "1px solid var(--color-primary-light)"
                  : "1px solid var(--color-border-default)",
                backgroundColor: isSelected
                  ? "var(--color-primary)"
                  : "var(--color-surface-elevated)",
                color: isSelected
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
                transition: "all var(--duration-fast) var(--ease-standard)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Daftar Kartu Pesanan (1 Kolom Mobile, 2 Kolom Desktop) */}
      {filteredOrders.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {filteredOrders.map((order) => {
            const statusVariant: Record<string, BadgeVariant> = {
              ditahan: "warning",
              terkonfirmasi: "success",
              batal: "error",
            };

            const statusLabel: Record<string, string> = {
              ditahan: "Ditahan",
              terkonfirmasi: "Terkonfirmasi",
              batal: "Batal",
            };

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: "var(--color-surface-card)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "var(--radius-card)",
                  padding: "var(--space-6)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                {/* Header Kartu: Status & Tanggal Pesan */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Badge variant={statusVariant[order.status] || "neutral"}>
                    {statusLabel[order.status] || order.status}
                  </Badge>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {formatTanggalLengkap(order.dibuatAt)}
                  </span>
                </div>

                {/* Judul Film & Studio */}
                <div>
                  <h3
                    style={{
                      fontSize: "var(--text-h3)",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {order.filmJudul}
                  </h3>
                  <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
                    {order.studioNama} •{" "}
                    <span className="tabular-nums font-semibold text-primary-light">
                      {formatJam(order.jamMulai)} - {formatJam(order.jamSelesai)} WIB
                    </span>
                  </p>
                </div>

                {/* Blok Kode Booking & Tombol Salin */}
                <div
                  style={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: "var(--radius-control)",
                    padding: "var(--space-3) var(--space-4)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase" }}>
                      Kode Booking
                    </span>
                    <span
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "var(--color-primary-light)",
                      }}
                      className="tabular-nums"
                    >
                      {order.kodeBooking}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(order.kodeBooking, order.id)}
                    style={{
                      height: "36px",
                      padding: "0 var(--space-3)",
                      backgroundColor:
                        copiedId === order.id
                          ? "var(--color-status-success)"
                          : "var(--color-surface-card)",
                      color:
                        copiedId === order.id
                          ? "#0B0D12"
                          : "var(--color-text-primary)",
                      border:
                        copiedId === order.id
                          ? "none"
                          : "1px solid var(--color-border-default)",
                      borderRadius: "var(--radius-control)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all var(--duration-fast)",
                    }}
                  >
                    {copiedId === order.id ? "✓ Tersalin" : "Salin"}
                  </button>
                </div>

                {/* Kursi */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
                    Kursi:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {order.kursiList.map((k) => (
                      <span
                        key={k}
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: "var(--color-surface-elevated)",
                          color: "var(--color-text-primary)",
                          fontSize: "12px",
                          fontWeight: 700,
                          border: "1px solid var(--color-border-subtle)",
                        }}
                        className="tabular-nums"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strip Sisa Waktu Khusus Pesanan Ditahan */}
                {order.status === "ditahan" && (
                  <SisaWaktuStrip batasWaktu={order.batasWaktu} />
                )}

                {/* Tombol Rincian Konfirmasi Booking */}
                <div style={{ marginTop: "auto", paddingTop: "var(--space-2)" }}>
                  <Link
                    href={`/booking/${order.id}`}
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
                      transition: "all var(--duration-fast)",
                    }}
                  >
                    Lihat Bukti Booking
                  </Link>
                </div>
              </div>
            );
          })}
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
            title="Tidak Ada Pesanan"
            description={
              filter === "semua"
                ? "Anda belum pernah memesan tiket bioskop. Silakan pilih film dan jadwal favorit Anda di katalog."
                : `Tidak ada pesanan dengan status ${filter}.`
            }
            action={{
              label: "Lihat Katalog Film",
              href: "/",
              variant: "primary",
            }}
          />
        </div>
      )}
    </div>
  );
}

function SisaWaktuStrip({ batasWaktu }: { batasWaktu: string }) {
  const [mounted, setMounted] = useState(false);
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    setMounted(true);
    function update() {
      const now = Date.now();
      const target = new Date(batasWaktu).getTime();
      setDiff(Math.max(0, Math.floor((target - now) / 1000)));
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [batasWaktu]);

  if (!mounted) {
    return (
      <div
        style={{
          backgroundColor: "rgba(245, 183, 59, 0.1)",
          border: "1px solid rgba(245, 183, 59, 0.3)",
          borderRadius: "var(--radius-control)",
          padding: "var(--space-3)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          fontSize: "12px",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-status-warning)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: "var(--color-status-warning)" }}>
          Menghitung sisa waktu...
        </span>
      </div>
    );
  }

  const isExpired = diff <= 0;
  const sisaMenit = Math.floor(diff / 60);
  const sisaDetik = diff % 60;

  return (
    <div
      style={{
        backgroundColor: isExpired
          ? "rgba(240, 82, 82, 0.1)"
          : "rgba(245, 183, 59, 0.1)",
        border: `1px solid ${
          isExpired
            ? "rgba(240, 82, 82, 0.3)"
            : "rgba(245, 183, 59, 0.3)"
        }`,
        borderRadius: "var(--radius-control)",
        padding: "var(--space-3)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        fontSize: "12px",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={
          isExpired
            ? "var(--color-status-error)"
            : "var(--color-status-warning)"
        }
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>
        {isExpired ? (
          <strong style={{ color: "var(--color-status-error)" }}>
            Batas waktu habis (Segera diproses batal)
          </strong>
        ) : (
          <>
            <span style={{ color: "var(--color-status-warning)" }}>
              Sisa waktu bayar di loket:{" "}
            </span>
            <strong
              style={{ color: "var(--color-text-primary)" }}
              className="tabular-nums"
              suppressHydrationWarning
            >
              {sisaMenit}m {sisaDetik}s
            </strong>
          </>
        )}
      </span>
    </div>
  );
}
