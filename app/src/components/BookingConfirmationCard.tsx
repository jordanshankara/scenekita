"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "./Badge";
import { formatJam, formatTanggalLengkap } from "@/lib/date";

interface BookingConfirmationCardProps {
  kodeBooking: string;
  status: string;
  batasWaktu: string;
  filmJudul: string;
  studioNama: string;
  jamMulai: string;
  jamSelesai: string;
  kursiList: string[]; // e.g. ["C3", "C4"]
  userEmail: string;
}

export function BookingConfirmationCard({
  kodeBooking,
  status,
  batasWaktu,
  filmJudul,
  studioNama,
  jamMulai,
  jamSelesai,
  kursiList,
  userEmail,
}: BookingConfirmationCardProps) {
  const [copied, setCopied] = useState(false);
  const [sisaWaktu, setSisaWaktu] = useState<{ menit: number; detik: number } | null>(null);

  // Countdown timer sisa waktu penahanan
  useEffect(() => {
    function hitungSisa() {
      const now = Date.now();
      const target = new Date(batasWaktu).getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));

      const menit = Math.floor(diff / 60);
      const detik = diff % 60;
      setSisaWaktu({ menit, detik });
    }

    hitungSisa();
    const timer = setInterval(hitungSisa, 1000);
    return () => clearInterval(timer);
  }, [batasWaktu]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(kodeBooking);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-card)",
        padding: "var(--space-8) var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      {/* Header Status & Ucapan Sukses */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: "var(--space-3)" }}>
          <Badge variant="warning">
            Status: {status === "ditahan" ? "Ditahan (60 Menit)" : status}
          </Badge>
        </div>
        <h1
          style={{
            fontSize: "var(--text-h2-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 var(--space-2) 0",
          }}
        >
          Kursi Berhasil Dipesan!
        </h1>
        <p
          style={{
            fontSize: "var(--text-body-sm)",
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Kursi Anda sedang ditahan. Segera bayar di loket bioskop sebelum batas waktu berakhir.
        </p>
      </div>

      {/* Blok Kode Booking Besar & Tombol Salin */}
      <div
        style={{
          backgroundColor: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border-secondary)",
          borderRadius: "var(--radius-control)",
          padding: "var(--space-6)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-3)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-caption)",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Kode Booking
        </span>

        <span
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            color: "var(--color-primary-light)",
            fontFamily: "var(--font-sans)",
            userSelect: "all",
          }}
          className="tabular-nums"
        >
          {kodeBooking}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            height: "var(--touch-min)",
            padding: "0 var(--space-4)",
            backgroundColor: copied ? "var(--color-status-success)" : "var(--color-surface-card)",
            color: copied ? "#0B0D12" : "var(--color-text-primary)",
            border: copied ? "none" : "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-control)",
            fontSize: "var(--text-caption)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all var(--duration-fast)",
          }}
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Berhasil Disalin</span>
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Salin Kode</span>
            </>
          )}
        </button>
      </div>

      {/* Kotak Batas Waktu & Hitung Mundur */}
      <div
        style={{
          backgroundColor: "rgba(245, 183, 59, 0.1)",
          border: "1px solid rgba(245, 183, 59, 0.3)",
          borderRadius: "var(--radius-control)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "var(--text-caption)", color: "var(--color-status-warning)", fontWeight: 600 }}>
          Batas Waktu Pembayaran di Loket:
        </span>
        <div style={{ fontSize: "var(--text-body)", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {formatTanggalLengkap(batasWaktu)}, Pukul {formatJam(batasWaktu)} WIB
        </div>
        {sisaWaktu && (
          <div style={{ fontSize: "var(--text-caption)", color: "var(--color-status-warning)" }}>
            Sisa waktu:{" "}
            <span className="tabular-nums font-bold">
              {sisaWaktu.menit} menit {sisaWaktu.detik} detik
            </span>
          </div>
        )}
      </div>

      {/* Rincian Pesanan */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          backgroundColor: "var(--color-bg-page)",
          borderRadius: "var(--radius-control)",
          padding: "var(--space-4)",
          fontSize: "var(--text-caption)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Film:</span>
          <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{filmJudul}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Studio:</span>
          <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{studioNama}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Jam Tayang:</span>
          <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }} className="tabular-nums">
            {formatJam(jamMulai)} - {formatJam(jamSelesai)} WIB
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Kursi:</span>
          <span style={{ fontWeight: 700, color: "var(--color-primary-light)" }} className="tabular-nums">
            {kursiList.join(", ")} ({kursiList.length} Kursi)
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Email Akun:</span>
          <span style={{ color: "var(--color-text-primary)" }}>{userEmail}</span>
        </div>
      </div>

      {/* Instruksi Pembayaran Loket */}
      <div
        style={{
          fontSize: "var(--text-caption)",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          backgroundColor: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-control)",
          padding: "var(--space-4)",
        }}
      >
        <strong style={{ color: "var(--color-text-primary)", display: "block", marginBottom: "4px" }}>
          Instruksi di Loket Bioskop:
        </strong>
        Sebutkan <strong>Kode Booking ({kodeBooking})</strong> dan <strong>Email Akun ({userEmail})</strong> Anda kepada petugas loket SceneKita untuk konfirmasi pembayaran dan pengambilan tiket fisik sebelum batas waktu habis.
      </div>

      {/* Tombol Navigasi */}
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Link
          href="/pesanan-saya"
          style={{
            flex: 1,
            minWidth: "140px",
            height: "var(--touch-min)", // 44px
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-primary)",
            borderRadius: "var(--radius-control)",
            fontSize: "var(--text-caption)",
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Lihat Pesanan Saya
        </Link>
        <Link
          href="/"
          style={{
            flex: 1,
            minWidth: "140px",
            height: "var(--touch-min)", // 44px
            backgroundColor: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border-secondary)",
            color: "var(--color-text-primary)",
            borderRadius: "var(--radius-control)",
            fontSize: "var(--text-caption)",
            fontWeight: 500,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
