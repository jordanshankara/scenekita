"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SeatMap, KursiData } from "./SeatMap";
import { createClient } from "@/lib/supabase/client";
import { formatJam, formatTanggalLengkap } from "@/lib/date";

interface BookingFormProps {
  jadwalId: string;
  filmJudul: string;
  filmDurasi: number;
  studioNama: string;
  jumlahBaris: number;
  jumlahKolom: number;
  jamMulai: string;
  jamSelesai: string;
  initialKursiList: KursiData[];
  kursiSedangDitahan: number; // Jumlah kursi aktif berstatus ditahan milik akun ini pada jadwal ini
}

export function BookingForm({
  jadwalId,
  filmJudul,
  filmDurasi,
  studioNama,
  jumlahBaris,
  jumlahKolom,
  jamMulai,
  jamSelesai,
  initialKursiList,
  kursiSedangDitahan: initialSedangDitahan,
}: BookingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [kursiList, setKursiList] = useState<KursiData[]>(initialKursiList);
  const [selectedKursi, setSelectedKursi] = useState<KursiData[]>([]);
  const [kursiSedangDitahan, setKursiSedangDitahan] = useState<number>(initialSedangDitahan);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Kuota maksimal 4 kursi per akun per jadwal (R2)
  const maxSelectable = Math.max(0, 4 - kursiSedangDitahan);

  // Cek ulang kuota aktif milik akun yang sedang login saat komponen dimuat
  React.useEffect(() => {
    async function cekKuotaAkun() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: pesananUser } = await supabase
          .from("pesanan")
          .select("id")
          .eq("user_id", user.id)
          .eq("jadwal_id", jadwalId)
          .eq("status", "ditahan")
          .gt("batas_waktu", new Date().toISOString());

        const pesananIds = (pesananUser || []).map((p: any) => p.id);
        if (pesananIds.length > 0) {
          const { count } = await supabase
            .from("pesanan_kursi")
            .select("id", { count: "exact", head: true })
            .in("pesanan_id", pesananIds)
            .eq("aktif", true);

          setKursiSedangDitahan(count || 0);
        } else {
          setKursiSedangDitahan(0);
        }
      } catch {
        // Fallback ke nilai server
      }
    }

    cekKuotaAkun();
  }, [jadwalId]);

  // Refresh peta kursi terbaru dari database
  async function refreshPetaKursi() {
    try {
      const { data, error } = await supabase.rpc("peta_kursi", {
        p_jadwal_id: jadwalId,
      });
      if (!error && data) {
        setKursiList(data);
      }
    } catch {
      // Abaikan jika error jaringan minor
    }
  }

  function handleToggleKursi(kursi: KursiData) {
    setErrorMsg(null);
    const exists = selectedKursi.some((k) => k.kursi_id === kursi.kursi_id);

    if (exists) {
      setSelectedKursi((prev) => prev.filter((k) => k.kursi_id !== kursi.kursi_id));
    } else {
      if (selectedKursi.length >= maxSelectable) {
        if (maxSelectable === 0) {
          setErrorMsg("Anda sudah memiliki 4 kursi berstatus Ditahan pada jadwal ini.");
        } else {
          setErrorMsg(`Anda hanya dapat memilih maksimal ${maxSelectable} kursi lagi.`);
        }
        return;
      }
      setSelectedKursi((prev) => [...prev, kursi]);
    }
  }

  async function handleBuatPesanan(e: React.FormEvent) {
    e.preventDefault();
    if (selectedKursi.length === 0) {
      setErrorMsg("Pilih minimal 1 kursi terlebih dahulu.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const kursiIds = selectedKursi.map((k) => k.kursi_id);

    // Panggil RPC buat_pesanan sesuai aturan database (R1-R4)
    const { data, error } = await supabase.rpc("buat_pesanan", {
      p_jadwal_id: jadwalId,
      p_kursi_ids: kursiIds,
    });

    if (error) {
      setLoading(false);
      const msg = error.message || "";

      if (msg.includes("Harus login")) {
        router.push(`/login?redirect=/jadwal/${jadwalId}/kursi`);
        return;
      }

      if (msg.includes("baru saja dipesan orang lain")) {
        setErrorMsg("Kursi yang Anda pilih baru saja dipesan orang lain. Denah telah dimuat ulang, silakan pilih kursi lain.");
        await refreshPetaKursi();
        setSelectedKursi([]);
        return;
      }

      if (msg.includes("Total kursi berstatus Ditahan")) {
        setErrorMsg("Total kursi berstatus Ditahan untuk jadwal ini maksimal 4 kursi per akun.");
        return;
      }

      if (msg.includes("Jadwal sudah lewat")) {
        setErrorMsg("Jadwal penayangan ini sudah lewat dan tidak dapat dipesan.");
        return;
      }

      setErrorMsg(msg || "Gagal membuat pesanan. Silakan coba kembali.");
      await refreshPetaKursi();
      return;
    }

    if (data && data.id) {
      // Sukses: Bawa ke layar Konfirmasi Booking (Layar 4)
      router.push(`/booking/${data.id}`);
    } else {
      setLoading(false);
      setErrorMsg("Respons pesanan tidak valid.");
    }
  }

  return (
    <div
      className="booking-layout-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "var(--space-8)",
        alignItems: "start",
      }}
    >
      {/* Kolom Kiri: Peta Kursi (SeatMap) */}
      <div style={{ width: "100%", minWidth: 0 }}>
        <SeatMap
          kursiList={kursiList}
          selectedKursiIds={selectedKursi.map((k) => k.kursi_id)}
          onToggleKursi={handleToggleKursi}
          maxSelectable={maxSelectable}
          studioNama={studioNama}
          jumlahBaris={jumlahBaris}
          jumlahKolom={jumlahKolom}
        />
      </div>

      {/* Kolom Kanan: Ringkasan Pilihan & Tombol Pesan */}
      <div className="booking-summary-sidebar" style={{ width: "100%", minWidth: 0 }}>
        <form
          onSubmit={handleBuatPesanan}
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--text-h3)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              paddingBottom: "var(--space-3)",
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            Ringkasan Pemesanan
          </h2>

          {/* Info Jadwal */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div>
              <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>Film</span>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)", fontSize: "var(--text-body-sm)" }}>
                {filmJudul}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
              <div>
                <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>Studio</span>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)", fontSize: "var(--text-caption)" }}>
                  {studioNama}
                </p>
              </div>
              <div>
                <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>Jam Tayang</span>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--color-primary-light)", fontSize: "var(--text-caption)" }} className="tabular-nums">
                  {formatJam(jamMulai)} - {formatJam(jamSelesai)}
                </p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>Tanggal</span>
              <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-text-primary)" }}>
                {formatTanggalLengkap(jamMulai)}
              </p>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border-subtle)", margin: 0 }} />

          {/* Kursi Terpilih */}
          <div aria-live="polite">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                Kursi Terpilih ({selectedKursi.length}/4)
              </span>
              {kursiSedangDitahan > 0 && (
                <span style={{ fontSize: "var(--text-caption)", color: "var(--color-status-warning)" }}>
                  ({kursiSedangDitahan} sedang ditahan)
                </span>
              )}
            </div>

            {selectedKursi.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {selectedKursi.map((k) => (
                  <span
                    key={k.kursi_id}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-control)",
                      backgroundColor: "var(--color-seat-selected-bg)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--text-caption)",
                      fontWeight: 700,
                    }}
                    className="tabular-nums"
                  >
                    {k.kode}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)", margin: 0, fontStyle: "italic" }}>
                Klik kursi di denah untuk memilih (1 - 4 kursi).
              </p>
            )}
          </div>

          {/* Kotak Peringatan Batas Waktu 60 Menit (R4, R5) */}
          <div
            style={{
              backgroundColor: "rgba(245, 183, 59, 0.12)",
              border: "1px solid rgba(245, 183, 59, 0.3)",
              borderRadius: "var(--radius-control)",
              padding: "var(--space-3) var(--space-4)",
              display: "flex",
              gap: "var(--space-2)",
              alignItems: "flex-start",
            }}
          >
            <svg
              width="18"
              height="18"
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
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div style={{ fontSize: "var(--text-caption)", lineHeight: 1.45 }}>
              <strong style={{ color: "var(--color-status-warning)", display: "block" }}>
                Batas Waktu Penahanan 60 Menit
              </strong>
              <span style={{ color: "var(--color-text-muted)" }}>
                Pesanan Anda ditahan selama 60 menit (atau hingga jam tayang) untuk pembayaran langsung di loket.
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              role="alert"
              style={{
                backgroundColor: "rgba(240, 82, 82, 0.1)",
                border: "1px solid var(--color-status-error)",
                borderRadius: "var(--radius-control)",
                padding: "var(--space-3)",
                color: "var(--color-status-error)",
                fontSize: "var(--text-caption)",
                display: "flex",
                gap: "var(--space-2)",
                alignItems: "center",
              }}
            >
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Keterangan Tanpa Pembayaran di Aplikasi */}
          <p
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
              margin: 0,
              textAlign: "center",
            }}
          >
            Tidak ada pembayaran online. Pembayaran dilakukan di loket.
          </p>

          {/* Tombol Pesan Kursi */}
          <button
            type="submit"
            disabled={loading || selectedKursi.length === 0}
            style={{
              width: "100%",
              height: "var(--touch-min)", // 44px
              backgroundColor:
                loading || selectedKursi.length === 0
                  ? "var(--color-surface-elevated)"
                  : "var(--color-primary)",
              color: "var(--color-text-primary)",
              border: "none",
              borderRadius: "var(--radius-control)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              cursor: loading || selectedKursi.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || selectedKursi.length === 0 ? 0.5 : 1,
              transition: "all var(--duration-fast) var(--ease-standard)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)",
            }}
          >
            {loading ? (
              <span>Memproses Pesanan...</span>
            ) : (
              <span>
                Pesan Kursi {selectedKursi.length > 0 ? `(${selectedKursi.length} Kursi)` : ""}
              </span>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .booking-layout-grid {
            grid-template-columns: 1fr 380px !important;
          }
          .booking-summary-sidebar {
            position: sticky;
            top: 80px;
          }
        }
      `}</style>
    </div>
  );
}
