"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "./Badge";
import { createClient } from "@/lib/supabase/client";
import { formatJam, formatTanggalLengkap } from "@/lib/date";

export interface FilmOption {
  id: string;
  judul: string;
  durasi_menit: number;
}

export interface StudioOption {
  id: string;
  nama: string;
}

export interface JadwalRow {
  id: string;
  film_id: string;
  studio_id: string;
  mulai: string;
  selesai: string;
  film?: {
    id: string;
    judul: string;
    durasi_menit: number;
  };
  studio?: {
    id: string;
    nama: string;
  };
}

interface AdminJadwalManagerProps {
  initialJadwal: JadwalRow[];
  filmOptions: FilmOption[];
  studioOptions: StudioOption[];
}

export function AdminJadwalManager({
  initialJadwal,
  filmOptions,
  studioOptions,
}: AdminJadwalManagerProps) {
  const supabase = createClient();

  const [jadwalList, setJadwalList] = useState<JadwalRow[]>(initialJadwal);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalRow | null>(null);

  // Form state
  const [filmId, setFilmId] = useState<string>(filmOptions[0]?.id || "");
  const [studioId, setStudioId] = useState<string>(studioOptions[0]?.id || "");
  const [mulaiDate, setMulaiDate] = useState<string>(""); // YYYY-MM-DDTHH:mm
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cari durasi film terpilih
  const selectedFilm = useMemo(() => {
    return filmOptions.find((f) => f.id === filmId);
  }, [filmOptions, filmId]);

  // Hitung perkiraan jam selesai otomatis (Read-Only)
  const perkiraanSelesaiStr = useMemo(() => {
    if (!mulaiDate || !selectedFilm) return "-";
    try {
      const start = new Date(mulaiDate);
      const end = new Date(start.getTime() + selectedFilm.durasi_menit * 60 * 1000);
      return end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
    } catch {
      return "-";
    }
  }, [mulaiDate, selectedFilm]);

  function openCreateModal() {
    setEditingJadwal(null);
    setFilmId(filmOptions[0]?.id || "");
    setStudioId(studioOptions[0]?.id || "");

    // Set default waktu mulai ke besok jam 13:00
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 13, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setMulaiDate(localIso);

    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(j: JadwalRow) {
    setEditingJadwal(j);
    setFilmId(j.film_id);
    setStudioId(j.studio_id);

    try {
      const d = new Date(j.mulai);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setMulaiDate(localIso);
    } catch {
      setMulaiDate("");
    }

    setErrorMsg(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingJadwal(null);
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!mulaiDate) {
      setErrorMsg("Pilih tanggal dan jam mulai penayangan.");
      setLoading(false);
      return;
    }

    try {
      const startDate = new Date(mulaiDate);
      const startIso = startDate.toISOString();

      if (editingJadwal) {
        // Update jadwal (dijaga oleh trigger jadwal_cegah_ubah jika ada pesanan aktif)
        const { error } = await supabase
          .from("jadwal")
          .update({
            film_id: filmId,
            studio_id: studioId,
            mulai: startIso,
          })
          .eq("id", editingJadwal.id);

        if (error) {
          setErrorMsg(petakanErrorJadwal(error));
        } else {
          setSuccessMsg("Jadwal tayang berhasil diperbarui.");
          closeModal();
          await refreshJadwal();
        }
      } else {
        // Insert jadwal baru (dijaga oleh constraint jadwal_tidak_bentrok)
        const { error } = await supabase.from("jadwal").insert({
          film_id: filmId,
          studio_id: studioId,
          mulai: startIso,
        });

        if (error) {
          setErrorMsg(petakanErrorJadwal(error));
        } else {
          setSuccessMsg("Jadwal tayang baru berhasil ditambahkan.");
          closeModal();
          await refreshJadwal();
        }
      }
    } catch {
      setErrorMsg("Terjadi kendala saat menyimpan jadwal.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshJadwal() {
    const { data } = await supabase
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

    if (data) {
      setJadwalList(
        data.map((j: any) => ({
          id: j.id,
          film_id: j.film_id,
          studio_id: j.studio_id,
          mulai: j.mulai,
          selesai: j.selesai,
          film: Array.isArray(j.film) ? j.film[0] : j.film,
          studio: Array.isArray(j.studio) ? j.studio[0] : j.studio,
        }))
      );
    }
  }

  function petakanErrorJadwal(err: any): string {
    const msg = err.message || "";
    const code = err.code || "";

    // Constraint bentrok jam studio (code 23P01)
    if (code === "23P01" || msg.includes("jadwal_tidak_bentrok") || msg.includes("conflicting key value")) {
      return "Jam tayang bentrok dengan jadwal lain di studio ini pada rentang waktu yang sama. Silakan pilih jam atau studio lain.";
    }

    // Trigger jadwal_cegah_ubah
    if (msg.includes("masih punya pesanan aktif")) {
      return "Jadwal ini masih memiliki pesanan aktif dari penonton. Batalkan pesanannya terlebih dahulu sebelum mengubah jadwal.";
    }

    if (msg.includes("Jadwal tidak dapat dihapus")) {
      return "Jadwal penayangan tidak dapat dihapus sesuai aturan sistem.";
    }

    return msg || "Gagal menyimpan jadwal.";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Toast Alert */}
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

      {/* Baris Atas: Tombol Tambah Jadwal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
          Total {jadwalList.length} jadwal tayang terdaftar.
        </p>

        <button
          type="button"
          onClick={openCreateModal}
          style={{
            height: "var(--touch-min)", // 44px
            padding: "0 var(--space-4)",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-primary)",
            border: "none",
            borderRadius: "var(--radius-control)",
            fontSize: "var(--text-caption)",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span>+</span>
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Tabel Jadwal */}
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
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Film</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Studio</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tanggal</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Jam Tayang</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jadwalList.map((j) => {
                const now = Date.now();
                const start = new Date(j.mulai).getTime();
                const end = new Date(j.selesai).getTime();

                let statusText = "Mendatang";
                let statusVariant: "neutral" | "info" | "warning" = "info";

                if (now > end) {
                  statusText = "Selesai";
                  statusVariant = "neutral";
                } else if (now >= start && now <= end) {
                  statusText = "Sedang Tayang";
                  statusVariant = "warning";
                }

                return (
                  <tr
                    key={j.id}
                    style={{
                      borderBottom: "1px solid var(--color-border-subtle)",
                      transition: "background-color var(--duration-fast)",
                    }}
                    className="hover:bg-surface-elevated"
                  >
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {j.film?.judul || "Film"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>
                      {j.studio?.nama || "Studio"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>
                      {formatTanggalLengkap(j.mulai)}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--color-primary-light)" }} className="tabular-nums">
                      {formatJam(j.mulai)} - {formatJam(j.selesai)} WIB
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Badge variant={statusVariant}>{statusText}</Badge>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(j)}
                        style={{
                          height: "var(--touch-min)",
                          padding: "0 16px",
                          backgroundColor: "var(--color-surface-elevated)",
                          border: "1px solid var(--color-border-secondary)",
                          color: "var(--color-text-primary)",
                          borderRadius: "var(--radius-control)",
                          fontSize: "var(--text-caption)",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Ubah
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Jadwal */}
      {modalOpen && (
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
              maxWidth: "540px",
              width: "100%",
              boxShadow: "var(--shadow-floating)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--text-h3)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "0 0 var(--space-4) 0",
              }}
            >
              {editingJadwal ? "Ubah Jadwal Penayangan" : "Tambah Jadwal Penayangan"}
            </h2>

            {errorMsg && (
              <div
                role="alert"
                style={{
                  backgroundColor: "rgba(240, 82, 82, 0.12)",
                  border: "1px solid var(--color-status-error)",
                  borderRadius: "var(--radius-control)",
                  padding: "var(--space-3)",
                  color: "var(--color-status-error)",
                  fontSize: "var(--text-caption)",
                  marginBottom: "var(--space-4)",
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {/* Pilihan Film */}
              <div>
                <label
                  htmlFor="form-film"
                  style={{
                    display: "block",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-2)",
                    fontWeight: 500,
                  }}
                >
                  Pilih Film:
                </label>
                <select
                  id="form-film"
                  required
                  value={filmId}
                  onChange={(e) => setFilmId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "var(--touch-min)",
                    backgroundColor: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-control)",
                    color: "var(--color-text-primary)",
                    padding: "0 var(--space-3)",
                    fontSize: "var(--text-caption)",
                    outline: "none",
                  }}
                >
                  {filmOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.judul} ({f.durasi_menit} Menit)
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Studio */}
              <div>
                <label
                  htmlFor="form-studio"
                  style={{
                    display: "block",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-2)",
                    fontWeight: 500,
                  }}
                >
                  Pilih Studio:
                </label>
                <select
                  id="form-studio"
                  required
                  value={studioId}
                  onChange={(e) => setStudioId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "var(--touch-min)",
                    backgroundColor: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-control)",
                    color: "var(--color-text-primary)",
                    padding: "0 var(--space-3)",
                    fontSize: "var(--text-caption)",
                    outline: "none",
                  }}
                >
                  {studioOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Jam Mulai */}
              <div>
                <label
                  htmlFor="form-mulai"
                  style={{
                    display: "block",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-2)",
                    fontWeight: 500,
                  }}
                >
                  Waktu Mulai Tayang:
                </label>
                <input
                  id="form-mulai"
                  type="datetime-local"
                  required
                  value={mulaiDate}
                  onChange={(e) => setMulaiDate(e.target.value)}
                  style={{
                    width: "100%",
                    height: "var(--touch-min)",
                    backgroundColor: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-control)",
                    color: "var(--color-text-primary)",
                    padding: "0 var(--space-3)",
                    fontSize: "var(--text-caption)",
                  }}
                  className="tabular-nums"
                />
              </div>

              {/* Perkiraan Jam Selesai (Read-Only sesuai Design System) */}
              <div>
                <label
                  htmlFor="form-selesai"
                  style={{
                    display: "block",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-2)",
                    fontWeight: 500,
                  }}
                >
                  Perkiraan Jam Selesai (Otomatis):
                </label>
                <input
                  id="form-selesai"
                  type="text"
                  readOnly
                  disabled
                  value={perkiraanSelesaiStr !== "-" ? `${perkiraanSelesaiStr} WIB (Dihitung dari durasi ${selectedFilm?.durasi_menit || 0} menit)` : "-"}
                  style={{
                    width: "100%",
                    height: "var(--touch-min)",
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "var(--radius-control)",
                    color: "var(--color-primary-light)",
                    fontWeight: 600,
                    padding: "0 var(--space-3)",
                    fontSize: "var(--text-caption)",
                    cursor: "not-allowed",
                  }}
                  className="tabular-nums"
                />
              </div>

              {/* Tombol Aksi Form */}
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
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
                  type="submit"
                  disabled={loading}
                  style={{
                    height: "var(--touch-min)",
                    padding: "0 var(--space-6)",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-text-primary)",
                    border: "none",
                    borderRadius: "var(--radius-control)",
                    fontSize: "var(--text-caption)",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
