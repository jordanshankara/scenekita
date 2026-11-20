# SceneKita: Panduan Database dan Supabase

| | |
|---|---|
| **Versi** | 1.0 |
| **Tanggal** | 20 November 2026 |
| **Sumber kebenaran data** | `scenekita_schema.sql` |
| **Dokumen terkait** | `BRD.md`, `PLAN.md`, `GUARDRAILS.md` |

> Dokumen ini menjelaskan cara memakai skema yang sudah dibuat. Jika dokumen ini berbeda dengan `scenekita_schema.sql`, file SQL yang benar dan dokumen ini yang diperbaiki.

---

## 1. Prinsip

1. **Aturan bisnis dijaga di database**, bukan hanya di tampilan. Klien bisa dilewati, database tidak.
2. **Semua perubahan pada pesanan lewat fungsi RPC.** Klien tidak boleh insert atau update langsung ke `pesanan` dan `pesanan_kursi`.
3. **Tidak ada tabel users sendiri.** Identitas memakai `auth.users` dari Supabase Auth.
4. **Tidak ada hapus** untuk jadwal (dan tidak ada policy hapus di tabel mana pun).
5. Perubahan skema dilakukan di `scenekita_schema.sql`, karena skema memuat aturan yang sudah disepakati (R1-R16).

## 2. Ringkasan Skema

| Tabel | Fungsi | Hal penting |
|---|---|---|
| `film` | Judul, durasi (menit), sinopsis | Tidak bisa dihapus |
| `studio` | Nama, jumlah baris, jumlah kolom | Tetap, diisi lewat seed (R7) |
| `kursi` | Satu baris per kursi fisik, mis. A1 sampai H10 | Dibuat dari seed |
| `jadwal` | Film, studio, `mulai`, `selesai` | `selesai` diisi otomatis dari durasi film. Constraint menolak jam tumpang tindih di studio yang sama (R15). |
| `pesanan` | Kode booking, `user_id` ke `auth.users`, status, `batas_waktu` | Status: `ditahan`, `terkonfirmasi`, `batal` |
| `pesanan_kursi` | Satu baris per kursi per pesanan, kolom `aktif` | Indeks unik parsial pada kursi aktif per jadwal menjamin R1 |

### Penjaga di level database

| Aturan | Dijaga oleh |
|---|---|
| R1 kursi tidak ganda | Indeks unik parsial `pesanan_kursi_aktif_uk` (jadwal + kursi, hanya yang `aktif`) |
| R2 maks 4 kursi | Pengecekan di `buat_pesanan`: 1-4 kursi per pesanan dan total kursi Ditahan per akun per jadwal maksimal 4 |
| R4 batas waktu | `batas_waktu` = yang lebih awal antara 60 menit sejak dibuat dan jam tayang. Pembatalan otomatis lewat `lepas_pesanan_kedaluwarsa` |
| R8 jadwal lewat | Pengecekan di `buat_pesanan` |
| R10 jadwal terkunci | Trigger `jadwal_cegah_ubah` menolak ubah jadwal yang punya pesanan aktif dan menolak hapus jadwal |
| R11 kode booking | `buat_kode_booking()`: 8 karakter acak, unik |
| R12, R13 | Pengecekan di `konfirmasi_pesanan` dan `batalkan_pesanan` |
| R15 jam bentrok | Constraint `jadwal_tidak_bentrok` |
| Mesin status | Trigger `pesanan_transisi`: ditahan → terkonfirmasi/batal, terkonfirmasi → batal, batal final. Kursi dilepas otomatis saat batal. |

## 3. Auth dan Peran

- **Pendaftaran penonton:** Supabase Auth dengan email dan password. Akun langsung aktif (tanpa verifikasi email). Nama disimpan di `user_metadata` (kunci `nama`) saat daftar.
- **Peran admin:** disimpan di `app_metadata` dengan `"role": "admin"`. Dicek oleh fungsi `is_admin()` dari JWT.
- **Membuat admin:** buat akun di Supabase Authentication, lalu jalankan perintah `update auth.users ...` yang ada di akhir `scenekita_schema.sql`. Admin harus **login ulang** agar peran terbaca.
- **Reset password:** dilakukan manual di Authentication > Users. Tidak ada fitur lupa password.
- Tidak ada UI untuk menjadikan seseorang admin.

## 4. Hak Akses (RLS)

Semua tabel memakai Row Level Security. Pengguna yang belum login tidak mendapat akses apa pun.

| Tabel | Baca | Tambah | Ubah | Hapus |
|---|---|---|---|---|
| `film` | Pengguna login | Admin | Admin | Tidak ada |
| `studio` | Pengguna login | Tidak ada | Tidak ada | Tidak ada |
| `kursi` | Pengguna login | Tidak ada | Tidak ada | Tidak ada |
| `jadwal` | Pengguna login | Admin | Admin (ditolak jika ada pesanan aktif) | Tidak ada (trigger menolak) |
| `pesanan` | Pemilik atau admin | Lewat `buat_pesanan` | Lewat fungsi | Tidak ada |
| `pesanan_kursi` | Pemilik pesanan atau admin | Lewat `buat_pesanan` | Lewat fungsi | Tidak ada |

## 5. Fungsi RPC

| Fungsi | Pemanggil | Parameter | Hasil | Dipakai di |
|---|---|---|---|---|
| `peta_kursi` | Penonton, admin | `p_jadwal_id` | Daftar kursi studio: `kursi_id`, `baris`, `kolom`, `kode`, `terisi`. Tidak membuka identitas pemesan. | F3 |
| `buat_pesanan` | Penonton | `p_jadwal_id`, `p_kursi_ids` (array) | Baris `pesanan` baru berstatus Ditahan | F4 |
| `pesanan_admin` | Admin | `p_jadwal_id` (opsional), `p_kode` (opsional) | `pesanan_id`, `kode_booking`, `status`, `batas_waktu`, `sisa_detik`, `jadwal_id`, `nama`, `email`, `kursi` | F6 |
| `konfirmasi_pesanan` | Admin | `p_pesanan_id` | Baris `pesanan` berstatus Terkonfirmasi | F6 |
| `batalkan_pesanan` | Admin | `p_pesanan_id` | Baris `pesanan` berstatus Batal (alasan `admin`) | F6 |
| `is_admin` | Dipakai RLS | tanpa parameter | Boolean | Internal |

Fungsi internal (`buat_kode_booking`, `lepas_pesanan_kedaluwarsa`, fungsi trigger) tidak boleh dipanggil dari klien.

### Pembatalan otomatis (R4)

`lepas_pesanan_kedaluwarsa` membatalkan pesanan Ditahan yang batas waktunya habis. Fungsi ini dipanggil oleh `pg_cron` tiap menit bila diaktifkan (opsional), dan juga dipanggil di dalam `buat_pesanan` dan trigger jadwal. `peta_kursi` dan `konfirmasi_pesanan` juga memperlakukan pesanan kedaluwarsa sebagai batal. Jadi aturan tetap aman tanpa cron.

## 6. Pesan Error dan Perilaku UI

Fungsi database mengembalikan pesan Bahasa Indonesia. Design System melarang menampilkan error mentah dari server, jadi klien memetakan pesan ke perilaku UI yang ramah. Jika teks di SQL diubah, ubah juga pemetaan ini.

| Sumber | Pesan dari database | Perilaku UI |
|---|---|---|
| `buat_pesanan` | Harus login untuk memesan | Arahkan ke Login |
| | Pilih 1 sampai 4 kursi | Tampilkan pesan inline di ringkasan pilihan |
| | Jadwal tidak ditemukan | Kembali ke Detail Film, tampilkan state error |
| | Jadwal sudah lewat, tidak bisa dipesan | Tampilkan pesan, kembali ke daftar jadwal |
| | Total kursi berstatus Ditahan untuk jadwal ini maksimal 4 | Tampilkan pesan kuota penuh |
| | Pesanan gagal: ada kursi yang baru saja dipesan orang lain | Toast error, muat ulang peta kursi, pilih ulang |
| | Pesanan gagal: kursi tidak valid untuk jadwal ini | Muat ulang peta kursi |
| `konfirmasi_pesanan` | Pesanan sudah batal / Pesanan sudah batal karena batas waktu habis | Toast, segarkan baris pesanan |
| | Pesanan sudah terkonfirmasi | Toast info, segarkan baris |
| | Hanya admin yang boleh mengonfirmasi pesanan | State `forbidden` |
| `batalkan_pesanan` | Pesanan terkonfirmasi tidak bisa dibatalkan setelah jam tayang | Aksi tampil terkunci dengan alasan |
| | Pesanan sudah batal | Toast info, segarkan baris |
| | Hanya admin yang boleh membatalkan pesanan | State `forbidden` |
| `pesanan_admin` | Hanya admin | State `forbidden` |
| Ubah/hapus jadwal | Jadwal masih punya pesanan aktif, batalkan pesanannya dulu | Blok validasi di form jadwal |
| | Jadwal tidak dapat dihapus | Tidak boleh muncul, karena tidak ada tombol hapus |
| Tambah/ubah jadwal | Constraint `jadwal_tidak_bentrok` (kode `23P01`) | Blok validasi "jam bentrok" di form jadwal |

## 7. Membaca Data dari Klien

- **Film dan jadwal (F2):** baca `film` dan `jadwal`. Tampilkan hanya jadwal yang belum lewat (R8). Waktu disimpan sebagai `timestamptz`, tampilkan dalam zona waktu Asia/Jakarta sesuai data contoh.
- **Kuota kursi di layar Pilih Kursi:** hitung dari pesanan milik akun di jadwal itu yang berstatus Ditahan. Total kursi terpilih + kursi Ditahan miliknya tidak boleh lebih dari 4 (R2). Ini hanya untuk UX, keputusan akhir ada di `buat_pesanan`.
- **Pesanan Saya (F5):** baca `pesanan` milik sendiri beserta `pesanan_kursi`, `kursi`, dan jadwalnya. Relasi memakai foreign key komposit, jadi jika embedded select PostgREST gagal atau ambigu, pakai query terpisah lalu gabungkan di klien.
- **Admin (F6):** daftar pesanan lewat `pesanan_admin`, bukan query langsung ke `auth.users`.

## 8. Operasional

1. **Migrasi awal:** jalankan seluruh `scenekita_schema.sql` sekali di SQL Editor Supabase. Isinya juga seed data contoh.
2. **Admin:** buat akun, jalankan `update auth.users ...`, login ulang.
3. **Cron (opsional):** aktifkan `pg_cron`, lalu jadwalkan `lepas_pesanan_kedaluwarsa()` tiap menit seperti di akhir file SQL.
4. **Reset password penonton:** manual di Authentication > Users.

## 9. Skenario Uji Fungsional Database

| # | Skenario | Hasil yang benar |
|---|---|---|
| 1 | Dua sesi memanggil `buat_pesanan` untuk kursi yang sama hampir bersamaan | Satu berhasil, satu mendapat "kursi baru saja dipesan orang lain" |
| 2 | `buat_pesanan` dengan 5 kursi | Ditolak: pilih 1 sampai 4 kursi |
| 3 | Satu akun menahan 3 kursi, lalu memesan 2 kursi lagi di jadwal yang sama | Ditolak: total kursi Ditahan maksimal 4 |
| 4 | `buat_pesanan` untuk jadwal yang sudah lewat | Ditolak |
| 5 | Pesanan dibuat 10 menit sebelum jam tayang | `batas_waktu` = jam tayang (bukan 60 menit) |
| 6 | Pesanan Ditahan lewat `batas_waktu` | Menjadi Batal (alasan kedaluwarsa), kursi muncul kosong di `peta_kursi` |
| 7 | `konfirmasi_pesanan` pada pesanan yang sudah kedaluwarsa | Ditolak: pesanan sudah batal |
| 8 | `batalkan_pesanan` pada pesanan Terkonfirmasi setelah jam tayang | Ditolak |
| 9 | Admin mengubah jadwal yang punya pesanan aktif | Ditolak |
| 10 | Admin menambah jadwal yang jamnya tumpang tindih di studio yang sama | Ditolak oleh constraint |
| 11 | Pesanan dibatalkan | Semua `pesanan_kursi` miliknya menjadi `aktif = false`, kursi bisa dipesan lagi |
| 12 | Mengubah status Batal menjadi Ditahan | Ditolak oleh trigger |
