# SceneKita: Guardrails (Batasan dan Panduan Keamanan)

| | |
|---|---|
| **Versi** | 1.0 |
| **Tanggal** | 20 November 2026 |
| **Berlaku untuk** | Semua pengembang dan asisten kode yang mengerjakan SceneKita |
| **Dokumen terkait** | `BRD.md`, `DATABASE-SUPABASE.md`, `copilot-instructions.md`, `scenekita_schema.sql` |

> Guardrail ini merangkum batasan yang sudah disepakati dan praktik keamanan standar Supabase untuk menegakkannya. Tidak ada fitur baru. Jika ada kebutuhan yang tidak tertampung, laporkan, jangan menyiasati.

---

## 1. Prinsip

1. **Klien tidak dipercaya.** Semua aturan penting ditegakkan di database lewat RLS, constraint, trigger, dan fungsi RPC.
2. **Hak akses sekecil mungkin.** Penonton hanya mengakses miliknya sendiri. Admin dibatasi pada fungsi yang disediakan.
3. **Menyembunyikan tombol bukan keamanan.** Penjaga rute atau menu di UI hanya untuk kenyamanan. Pengecekan peran selalu terjadi di database.
4. **Tidak menyiasati aturan.** Jika sebuah aturan menghambat, laporkan. Jangan mengubah atau melewatinya.

## 2. Batasan Lingkup (Tidak Boleh Dibangun)

Daftar di luar cakupan v1 berlaku mutlak:

- Pembayaran online, harga tiket, dan total bayar
- Admin mengelola studio dan layout kursi
- Notifikasi email/WA dan info/pengumuman ke penonton
- E-tiket / QR code
- Voucher dan promo
- Laporan dan statistik
- Multi-bioskop
- Verifikasi email dan fitur lupa password
- Pengajuan pembatalan di dalam aplikasi oleh penonton
- Admin mengubah kursi pesanan
- Mengubah atau menghapus jadwal yang sudah punya pesanan aktif
- Hapus jadwal

## 3. Kunci dan Rahasia

| Boleh di klien | Dilarang di klien, repo, dan log |
|---|---|
| URL proyek Supabase | Kunci `service_role` |
| Kunci anon/publik | Password database |
| | Token sesi atau password pengguna yang dicetak ke console |

- Simpan konfigurasi di variabel lingkungan dan pastikan file lingkungan masuk daftar abaikan repo.
- Jangan menulis kunci rahasia di contoh kode, dokumentasi, atau komentar.

## 4. Identitas dan Peran

- Peran admin **hanya** dari `app_metadata` (`"role": "admin"`), dibaca lewat `is_admin()` di database.
- **Jangan pernah** memakai `user_metadata` untuk peran atau izin. Pengguna bisa mengubahnya sendiri. Kolom `nama` di `user_metadata` hanya untuk tampilan.
- Tidak ada pendaftaran admin sendiri dan tidak ada UI untuk menjadikan seseorang admin. Akun admin dibuat di awal oleh pemilik proyek.
- Rute admin untuk non-admin menampilkan state `forbidden`. Ini hanya lapisan UX, bukan pengganti pengecekan di database.
- Admin harus login ulang setelah perannya ditetapkan agar JWT terbaru terbaca.

## 5. Matriks Akses

| Objek | Anonim | Penonton | Admin |
|---|---|---|---|
| `film`, `jadwal` (baca) | Tidak | Ya | Ya |
| `studio`, `kursi` (baca) | Tidak | Ya | Ya |
| `film`, `jadwal` (tambah/ubah) | Tidak | Tidak | Ya (jadwal ditolak jika ada pesanan aktif) |
| Hapus data apa pun | Tidak | Tidak | Tidak |
| `pesanan`, `pesanan_kursi` (baca) | Tidak | Hanya miliknya | Semua |
| `pesanan`, `pesanan_kursi` (tulis langsung) | Tidak | Tidak | Tidak |
| `peta_kursi`, `buat_pesanan` | Tidak | Ya | Ya |
| `pesanan_admin`, `konfirmasi_pesanan`, `batalkan_pesanan` | Tidak | Ditolak | Ya |
| Fungsi internal (`buat_kode_booking`, `lepas_pesanan_kedaluwarsa`, fungsi trigger) | Tidak | Tidak | Tidak |

## 6. Integritas Data

- Semua perubahan pesanan lewat RPC. Jangan membuka policy insert/update langsung untuk memudahkan pengembangan.
- Jangan mengandalkan validasi di klien untuk R1 (kursi unik), R2 (maks 4), R4 (batas waktu), R8, R10, R12, R13, dan R15.
- Jangan menonaktifkan RLS, trigger, atau constraint untuk menyelesaikan masalah atau mempercepat pengujian.
- Perubahan status pesanan hanya mengikuti mesin status: ditahan → terkonfirmasi/batal, terkonfirmasi → batal, batal final.
- Peta kursi tidak boleh mengungkap siapa yang memegang kursi.

## 7. Privasi Data

- Email dan nama penonton hanya terlihat oleh pemiliknya dan admin (lewat `pesanan_admin`).
- Jangan menampilkan data pengguna lain kepada penonton.
- Jangan mencetak email, nama, atau token ke console atau log.
- Jangan menyimpan password dalam bentuk apa pun di luar Supabase Auth.

## 8. Input dan Output

- Semua panggilan data memakai parameter (RPC atau query terparameter). Jangan menyusun perintah SQL dari teks input.
- Teks dari pengguna dan admin (nama, judul film, sinopsis) dirender sebagai teks biasa. Jangan memakai penyisipan HTML mentah.
- Kode booking dari input pencarian dinormalisasi (huruf besar) dan dikirim sebagai parameter, bukan digabung ke query.

## 9. Penanganan Error

- Jangan menampilkan kode error mentah, nama tabel, nama constraint, atau jejak SQL ke pengguna.
- Petakan pesan database ke teks Bahasa Indonesia yang ramah dan sediakan tombol pemulihan (lihat `DATABASE-SUPABASE.md`, Bagian 6).
- Jangan menelan error secara diam-diam. Pengguna harus tahu bahwa aksinya gagal.

## 10. Autentikasi: Keputusan yang Diterima

- Tanpa verifikasi email dan tanpa lupa password. Reset password dilakukan manual oleh pemilik proyek. Jangan menambahkan fitur ini.
- **Risiko diterima:** satu orang bisa membuat banyak akun untuk menyiasati batas 4 kursi (R2). Kontrol pengganti: konfirmasi tetap di loket dengan kode booking dan email akun (R14).
- **Risiko diterima:** tanpa `pg_cron`, pesanan kedaluwarsa bisa tampil Ditahan sampai ada aktivitas di jadwal itu. Kursi tetap diperlakukan terbuka dan konfirmasinya ditolak (R12).

## 11. Pemeriksaan Keamanan Sebelum Dipakai

### Konfigurasi
- [ ] RLS aktif di enam tabel: `film`, `studio`, `kursi`, `jadwal`, `pesanan`, `pesanan_kursi`
- [ ] Tidak ada policy hapus di tabel mana pun
- [ ] Tidak ada policy insert/update untuk klien di `pesanan`, `pesanan_kursi`, `studio`, `kursi`
- [ ] Hak eksekusi fungsi hanya untuk `authenticated` pada fungsi RPC, dan tidak ada untuk fungsi internal
- [ ] Kunci `service_role` tidak ada di klien, repo, atau log
- [ ] Akun admin sudah ditandai di `app_metadata` dan hanya akun yang dimaksud

### Uji negatif
- [ ] Pengguna belum login tidak bisa membaca `film`, `jadwal`, `pesanan`, dan tidak bisa memanggil fungsi RPC
- [ ] Penonton A tidak bisa membaca pesanan penonton B
- [ ] Penonton tidak bisa insert, update, atau delete langsung ke `pesanan`, `pesanan_kursi`, `film`, `jadwal`, `studio`, `kursi`
- [ ] Penonton memanggil `konfirmasi_pesanan`, `batalkan_pesanan`, atau `pesanan_admin`: ditolak ("Hanya admin...")
- [ ] Penonton tidak bisa menjadikan dirinya admin lewat `user_metadata` atau pembaruan profil
- [ ] Tidak ada cara menghapus jadwal, termasuk oleh admin
- [ ] Memesan lebih dari 4 kursi, kursi yang sama dari dua sesi, dan jadwal yang sudah lewat: ditolak
- [ ] Admin tidak bisa mengonfirmasi pesanan yang sudah kedaluwarsa atau batal
- [ ] `peta_kursi` tidak mengembalikan `user_id` atau email
- [ ] Rute admin dibuka oleh penonton: tampil state `forbidden`, dan panggilan data tetap ditolak database

## 12. Jika Menemukan Masalah

1. Berhenti pada bagian yang bermasalah.
2. Laporkan: apa yang ditemukan, aturan atau dokumen mana yang terkait, dan dampaknya.
3. Tunggu keputusan pemilik proyek. Jangan menyiasati dengan mengubah aturan, melonggarkan RLS, atau menambah fitur.
