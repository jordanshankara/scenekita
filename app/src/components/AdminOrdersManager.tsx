"use client";

import React, { useState, useEffect } from "react";
import { Badge, BadgeVariant } from "./Badge";
import { StateMessage } from "./StateMessage";
import { createClient } from "@/lib/supabase/client";
import { formatJam, formatTanggalLengkap } from "@/lib/date";

export interface JadwalOption {
  id: string;
  filmJudul: string;
  studioNama: string;
  mulai: string;
  selesai: string;
}

export interface PesananAdminRow {
  pesanan_id: string;
  kode_booking: string;
  status: "ditahan" | "terkonfirmasi" | "batal";
  batas_waktu: string;
  sisa_detik: number | null;
  jadwal_id: string;
  nama: string | null;
  email: string | null;
  kursi: string | null;
}

interface AdminOrdersManagerProps {
  jadwalOptions: JadwalOption[];
}

export function AdminOrdersManager({ jadwalOptions }: AdminOrdersManagerProps) {
  const supabase = createClient();

  const [selectedJadwalId, setSelectedJadwalId] = useState<string>(jadwalOptions[0]?.id || "");
  const [searchKode, setSearchKode] = useState<string>("");
  const [orders, setOrders] = useState<PesananAdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // State Modal Verifikasi Pencocokan di Loket (R14)
  const [modalAction, setModalAction] = useState<"konfirmasi" | "batal" | null>(null);
  const [targetOrder, setTargetOrder] = useState<PesananAdminRow | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Ambil daftar pesanan via RPC pesanan_admin
  async function fetchOrders() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc("pesanan_admin", {
        p_jadwal_id: selectedJadwalId || null,
        p_kode: searchKode.trim().toUpperCase() || null,
      });

      if (error) {
        setErrorMsg(`Gagal memuat pesanan: ${error.message}`);
      } else {
        setOrders(data || []);
      }
    } catch {
      setErrorMsg("Terjadi kendala saat memuat pesanan admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [selectedJadwalId]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchOrders();
  }

  // Buka Modal Verifikasi
  function openModal(action: "konfirmasi" | "batal", order: PesananAdminRow) {
    setModalAction(action);
    setTargetOrder(order);
    setIsVerified(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  function closeModal() {
    setModalAction(null);
    setTargetOrder(null);
    setIsVerified(false);
    setProcessingAction(false);
  }

  // Eksekusi Konfirmasi atau Pembatalan via RPC
  async function handleExecuteAction() {
    if (!targetOrder || !modalAction) return;

    setProcessingAction(true);
    setErrorMsg(null);

    try {
      if (modalAction === "konfirmasi") {
        const { error } = await supabase.rpc("konfirmasi_pesanan", {
          p_pesanan_id: targetOrder.pesanan_id,
        });

        if (error) {
          setErrorMsg(petakanErrorAdmin(error.message));
        } else {
          setSuccessMsg(`Pesanan ${targetOrder.kode_booking} berhasil DIKONFIRMASI.`);
          closeModal();
          await fetchOrders();
        }
      } else if (modalAction === "batal") {
        const { error } = await supabase.rpc("batalkan_pesanan", {
          p_pesanan_id: targetOrder.pesanan_id,
        });

        if (error) {
          setErrorMsg(petakanErrorAdmin(error.message));
        } else {
          setSuccessMsg(`Pesanan ${targetOrder.kode_booking} berhasil DIBATALKAN.`);
          closeModal();
          await fetchOrders();
        }
      }
    } catch {
      setErrorMsg("Gagal memproses aksi.");
    } finally {
      setProcessingAction(false);
    }
  }

  function petakanErrorAdmin(msg: string): string {
    if (msg.includes("Pesanan sudah batal")) {
      return "Pesanan sudah berstatus batal atau batas waktu penahanannya sudah habis.";
    }
    if (msg.includes("Pesanan sudah terkonfirmasi")) {
      return "Pesanan ini sudah pernah dikonfirmasi sebelumnya.";
    }
    if (msg.includes("tidak bisa dibatalkan setelah jam tayang")) {
      return "Pesanan terkonfirmasi tidak dapat dibatalkan setelah jam tayang dimulai.";
    }
    if (msg.includes("Hanya admin")) {
      return "Akses ditolak: Hanya akun admin yang dapat melakukan aksi ini.";
    }
    return msg || "Terjadi kesalahan sistem.";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Toast Notifikasi Berhasil / Gagal */}
      {successMsg && (
        <div
          role="status"
          style={{
            backgroundColor: "rgba(46, 212, 122, 0.12)",
            border: "1px solid var(--color-status-success)",
            borderRadius: "var(--radius-control)",
            padding: "var(--space-3) var(--space-4)",
            color: "var(--color-status-success)",
            fontSize: "var(--text-caption)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}
          >
            ×
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          style={{
            backgroundColor: "rgba(240, 82, 82, 0.12)",
            border: "1px solid var(--color-status-error)",
            borderRadius: "var(--radius-control)",
            padding: "var(--space-3) var(--space-4)",
            color: "var(--color-status-error)",
            fontSize: "var(--text-caption)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>⚠ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Kontrol: Dropdown Pilih Jadwal & Pencarian Kode Booking */}
      <div
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-card)",
          padding: "var(--space-4) var(--space-6)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-4)",
          alignItems: "flex-end",
        }}
      >
        {/* Dropdown Jadwal (Wajib Pilih Jadwal) */}
        <div style={{ flex: 1, minWidth: "260px" }}>
          <label
            htmlFor="pilih-jadwal"
            style={{
              display: "block",
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-2)",
              fontWeight: 500,
            }}
          >
            Pilih Jadwal Tayang Bioskop:
          </label>
          <select
            id="pilih-jadwal"
            value={selectedJadwalId}
            onChange={(e) => setSelectedJadwalId(e.target.value)}
            style={{
              width: "100%",
              height: "var(--touch-min)", // 44px
              backgroundColor: "var(--color-bg-input)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-control)",
              color: "var(--color-text-primary)",
              padding: "0 var(--space-3)",
              fontSize: "var(--text-caption)",
              outline: "none",
            }}
          >
            {jadwalOptions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.filmJudul} • {j.studioNama} • {formatJam(j.mulai)} WIB ({formatTanggalLengkap(j.mulai)})
              </option>
            ))}
          </select>
        </div>

        {/* Input Pencarian Kode Booking */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-2)", flex: 1, minWidth: "240px" }}>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="cari-kode"
              style={{
                display: "block",
                fontSize: "var(--text-caption)",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-2)",
                fontWeight: 500,
              }}
            >
              Cari Kode Booking:
            </label>
            <input
              id="cari-kode"
              type="text"
              placeholder="Contoh: 842CF22A"
              value={searchKode}
              onChange={(e) => setSearchKode(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                height: "var(--touch-min)",
                backgroundColor: "var(--color-bg-input)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-control)",
                color: "var(--color-text-primary)",
                padding: "0 var(--space-3)",
                fontSize: "var(--text-caption)",
                textTransform: "uppercase",
                fontFamily: "var(--font-sans)",
              }}
              className="tabular-nums"
            />
          </div>
          <button
            type="submit"
            style={{
              alignSelf: "flex-end",
              height: "var(--touch-min)",
              padding: "0 var(--space-4)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-primary)",
              border: "none",
              borderRadius: "var(--radius-control)",
              fontSize: "var(--text-caption)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cari
          </button>
        </form>
      </div>

      {/* Tabel Daftar Pesanan */}
      <div
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "var(--text-caption)",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                  backgroundColor: "var(--color-bg-sidebar)",
                  color: "var(--color-text-muted)",
                }}
              >
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Kode Booking</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Penonton</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Kursi</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Sisa Waktu</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Aksi Loket</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    Memuat daftar pesanan...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const statusVariant: Record<string, BadgeVariant> = {
                    ditahan: "warning",
                    terkonfirmasi: "success",
                    batal: "error",
                  };

                  const isDitahan = order.status === "ditahan";
                  const sisaDetik = order.sisa_detik || 0;
                  const isExpired = sisaDetik <= 0;
                  const canConfirm = isDitahan && !isExpired;
                  const canCancel = order.status !== "batal";

                  return (
                    <tr
                      key={order.pesanan_id}
                      style={{
                        borderBottom: "1px solid var(--color-border-subtle)",
                        transition: "background-color var(--duration-fast)",
                      }}
                      className="hover:bg-surface-elevated"
                    >
                      {/* Kode Booking */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-primary-light)", letterSpacing: "0.05em" }} className="tabular-nums">
                          {order.kode_booking}
                        </span>
                      </td>

                      {/* Penonton */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {order.nama || "Penonton"}
                        </div>
                        <div style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                          {order.email}
                        </div>
                      </td>

                      {/* Kursi */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }} className="tabular-nums">
                          {order.kursi || "-"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <Badge variant={statusVariant[order.status] || "neutral"}>
                          {order.status === "ditahan"
                            ? "Ditahan"
                            : order.status === "terkonfirmasi"
                            ? "Terkonfirmasi"
                            : "Batal"}
                        </Badge>
                      </td>

                      {/* Sisa Waktu */}
                      <td style={{ padding: "14px 16px" }}>
                        {isDitahan ? (
                          isExpired ? (
                            <span style={{ color: "var(--color-status-error)", fontWeight: 600, fontSize: "12px" }}>
                              Kedaluwarsa
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-status-warning)", fontWeight: 600 }} className="tabular-nums">
                              {Math.floor(sisaDetik / 60)}m {sisaDetik % 60}s
                            </span>
                          )
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                          {/* Tombol Konfirmasi Loket */}
                          {canConfirm && (
                            <button
                              type="button"
                              onClick={() => openModal("konfirmasi", order)}
                              style={{
                                height: "36px",
                                padding: "0 14px",
                                backgroundColor: "var(--color-primary)",
                                color: "var(--color-text-primary)",
                                border: "none",
                                borderRadius: "var(--radius-control)",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all var(--duration-fast)",
                              }}
                            >
                              Konfirmasi
                            </button>
                          )}

                          {/* Tombol Batalkan Pesanan */}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => openModal("batal", order)}
                              style={{
                                height: "36px",
                                padding: "0 12px",
                                backgroundColor: "var(--color-surface-elevated)",
                                color: "var(--color-status-error)",
                                border: "1px solid var(--color-status-error)",
                                borderRadius: "var(--radius-control)",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all var(--duration-fast)",
                              }}
                            >
                              Batalkan
                            </button>
                          )}

                          {!canConfirm && !canCancel && (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                              Final (Batal)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 16px" }}>
                    <StateMessage
                      type="empty"
                      title="Belum Ada Pesanan"
                      description="Belum ada pesanan penonton pada jadwal ini atau kode booking tidak ditemukan."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Verifikasi Pencocokan di Loket (R14) */}
      {modalAction && targetOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--backdrop-modal)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-card)",
              padding: "var(--space-6)",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "var(--shadow-floating)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-h3)",
                fontWeight: 700,
                color: modalAction === "konfirmasi" ? "var(--color-primary-light)" : "var(--color-status-error)",
                margin: 0,
              }}
            >
              {modalAction === "konfirmasi" ? "Verifikasi Konfirmasi Loket" : "Verifikasi Pembatalan Pesanan"}
            </h3>

            <p style={{ fontSize: "var(--text-caption)", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.55 }}>
              Sebelum memproses di loket, pastikan Anda telah mencocokkan kode booking dan identitas email pemesan secara fisik.
            </p>

            {/* Kotak Detail Verifikasi */}
            <div
              style={{
                backgroundColor: "var(--color-bg-page)",
                borderRadius: "var(--radius-control)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                fontSize: "var(--text-caption)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Kode Booking:</span>
                <strong style={{ color: "var(--color-primary-light)", letterSpacing: "0.05em" }} className="tabular-nums">
                  {targetOrder.kode_booking}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Email Pemesan:</span>
                <strong style={{ color: "var(--color-text-primary)" }}>{targetOrder.email}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Nama Akun:</span>
                <span style={{ color: "var(--color-text-primary)" }}>{targetOrder.nama || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Kursi:</span>
                <strong style={{ color: "var(--color-primary-light)" }} className="tabular-nums">
                  {targetOrder.kursi}
                </strong>
              </div>
            </div>

            {/* Checkbox Konfirmasi Fisik Petugas */}
            <label
              style={{
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "flex-start",
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--color-text-primary)",
              }}
            >
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "var(--color-primary)" }}
              />
              <span>
                Saya telah memverifikasi secara langsung kode booking dan email dengan penonton di loket.
              </span>
            </label>

            {/* Tombol Aksi Modal */}
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={processingAction}
                style={{
                  height: "var(--touch-min)",
                  padding: "0 var(--space-4)",
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-secondary)",
                  color: "var(--color-text-primary)",
                  borderRadius: "var(--radius-control)",
                  fontSize: "var(--text-caption)",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={!isVerified || processingAction}
                style={{
                  height: "var(--touch-min)",
                  padding: "0 var(--space-6)",
                  backgroundColor:
                    !isVerified || processingAction
                      ? "var(--color-surface-elevated)"
                      : modalAction === "konfirmasi"
                      ? "var(--color-primary)"
                      : "var(--color-status-error)",
                  color: "var(--color-text-primary)",
                  border: "none",
                  borderRadius: "var(--radius-control)",
                  fontSize: "var(--text-caption)",
                  fontWeight: 600,
                  cursor: !isVerified || processingAction ? "not-allowed" : "pointer",
                  opacity: !isVerified || processingAction ? 0.5 : 1,
                  transition: "all var(--duration-fast)",
                }}
              >
                {processingAction
                  ? "Memproses..."
                  : modalAction === "konfirmasi"
                  ? "Konfirmasi Pesanan"
                  : "Ya, Batalkan Pesanan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
