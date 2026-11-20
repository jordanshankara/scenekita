"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface FilmRow {
  id: string;
  judul: string;
  durasi_menit: number;
  sinopsis: string | null;
  dibuat_at: string;
}

interface AdminFilmManagerProps {
  initialFilms: FilmRow[];
}

export function AdminFilmManager({ initialFilms }: AdminFilmManagerProps) {
  const supabase = createClient();

  const [films, setFilms] = useState<FilmRow[]>(initialFilms);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<FilmRow | null>(null);

  // Form state
  const [judul, setJudul] = useState("");
  const [durasiMenit, setDurasiMenit] = useState<number>(100);
  const [sinopsis, setSinopsis] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function openCreateModal() {
    setEditingFilm(null);
    setJudul("");
    setDurasiMenit(100);
    setSinopsis("");
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(f: FilmRow) {
    setEditingFilm(f);
    setJudul(f.judul);
    setDurasiMenit(f.durasi_menit);
    setSinopsis(f.sinopsis || "");
    setErrorMsg(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingFilm(null);
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (editingFilm) {
        // Update film
        const { data, error } = await supabase
          .from("film")
          .update({
            judul: judul.trim(),
            durasi_menit: Number(durasiMenit),
            sinopsis: sinopsis.trim(),
          })
          .eq("id", editingFilm.id)
          .select()
          .single();

        if (error) {
          setErrorMsg(`Gagal memperbarui film: ${error.message}`);
        } else if (data) {
          setFilms((prev) => prev.map((f) => (f.id === data.id ? data : f)));
          setSuccessMsg(`Film "${data.judul}" berhasil diperbarui.`);
          closeModal();
        }
      } else {
        // Insert film baru
        const { data, error } = await supabase
          .from("film")
          .insert({
            judul: judul.trim(),
            durasi_menit: Number(durasiMenit),
            sinopsis: sinopsis.trim(),
          })
          .select()
          .single();

        if (error) {
          setErrorMsg(`Gagal menambah film: ${error.message}`);
        } else if (data) {
          setFilms((prev) => [data, ...prev]);
          setSuccessMsg(`Film "${data.judul}" berhasil ditambahkan.`);
          closeModal();
        }
      }
    } catch {
      setErrorMsg("Terjadi kendala saat menyimpan data film.");
    } finally {
      setLoading(false);
    }
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

      {/* Baris Atas: Tombol Tambah Film */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-text-muted)" }}>
          Total {films.length} film terdaftar di sistem.
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
          <span>Tambah Film</span>
        </button>
      </div>

      {/* Tabel Film */}
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
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Judul Film</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Durasi</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Sinopsis</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {films.map((f) => (
                <tr
                  key={f.id}
                  style={{
                    borderBottom: "1px solid var(--color-border-subtle)",
                    transition: "background-color var(--duration-fast)",
                  }}
                  className="hover:bg-surface-elevated"
                >
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {f.judul}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-muted)" }} className="tabular-nums">
                    {f.durasi_menit} Menit
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-muted)", maxWidth: "360px" }}>
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.45,
                      }}
                    >
                      {f.sinopsis || "-"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(f)}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Film */}
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
              {editingFilm ? "Ubah Data Film" : "Tambah Film Baru"}
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
              {/* Judul Film */}
              <div>
                <label
                  htmlFor="judul-film"
                  style={{
                    display: "block",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-2)",
                    fontWeight: 500,
                  }}
                >
                  Judul Film:
                </label>
                <input
                  id="judul-film"
                  type="text"
                  required
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Petualangan Rimba"
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
                />
              </div>

              {/* Durasi Menit */}
              <div>
                <label
                  htmlFor="durasi-film"
                  style={{
                    display: "block",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-2)",
                    fontWeight: 500,
                  }}
                >
                  Durasi (Menit):
                </label>
                <input
                  id="durasi-film"
                  type="number"
                  required
                  min={1}
                  max={300}
                  value={durasiMenit}
                  onChange={(e) => setDurasiMenit(Number(e.target.value))}
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

              {/* Sinopsis */}
              <div>
                <label
                  htmlFor="sinopsis-film"
                  style={{
                    display: "block",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-2)",
                    fontWeight: 500,
                  }}
                >
                  Sinopsis:
                </label>
                <textarea
                  id="sinopsis-film"
                  rows={4}
                  required
                  value={sinopsis}
                  onChange={(e) => setSinopsis(e.target.value)}
                  placeholder="Deskripsi ringkas jalan cerita film..."
                  style={{
                    width: "100%",
                    backgroundColor: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-control)",
                    color: "var(--color-text-primary)",
                    padding: "var(--space-3)",
                    fontSize: "var(--text-caption)",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
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
                  {loading ? "Menyimpan..." : "Simpan Film"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
