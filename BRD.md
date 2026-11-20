# SceneKita: Business Requirements Document (BRD)

| | |
|---|---|
| **Produk** | SceneKita, aplikasi web pemesanan kursi bioskop |
| **Tahap** | Project pilot (MVP v1) |
| **Versi** | 1.0 |
| **Tanggal** | 20 November 2026 |
| **Status** | Scope terkunci |
| **Dokumen terkait** | `SceneKita_Brief_MVP_v1.md`, `design_system_scenekita.md`, `scenekita_schema.sql`, `PLAN.md`, `DATABASE-SUPABASE.md`, `GUARDRAILS.md`, `copilot-instructions.md` |

> Dokumen ini hanya memuat keputusan yang sudah disepakati dalam wawancara kebutuhan dan tinjauan celah alur. Tidak ada fitur atau keputusan baru.

---

## 1. Latar Belakang

Bioskop yang menjadi sasaran pilot masih melayani pemesanan kursi secara manual. Penonton harus datang ke loket atau chat dulu untuk memesan kursi.

## 2. Masalah Bisnis

**Masalah utama:** antrean dan pemesanan manual.

## 3. Tujuan Bisnis

Memberi penonton cara memesan kursi lewat web tanpa antre atau chat manual, sambil tetap memakai loket untuk pembayaran dan konfirmasi. Pilot ini dibatasi **satu bioskop** dan waktu pembangunan sekitar **4 jam**.

## 4. Ruang Lingkup

### 4.1 Dalam cakupan (v1)

- Akun penonton dan login (email + password)
- Katalog film dan jadwal tayang
- Peta kursi per jadwal
- Pemesanan 1-4 kursi dengan penahanan 60 menit dan kode booking
- Halaman Pesanan Saya
- Panel admin: kelola film dan jadwal, lihat pesanan per jadwal, konfirmasi dan batalkan pesanan

### 4.2 Di luar cakupan (v1)

- Pembayaran online, harga tiket, dan total bayar
- Admin mengelola studio dan layout kursi
- Notifikasi email/WA dan info/pengumuman ke penonton
- E-tiket / QR code
- Voucher dan promo
- Laporan dan statistik
- Multi-bioskop
- Verifikasi email dan fitur lupa password (reset dilakukan manual)
- Pengajuan pembatalan di dalam aplikasi oleh penonton
- Admin mengubah kursi pesanan
- Mengubah atau menghapus jadwal yang sudah punya pesanan aktif
- Hapus jadwal (tidak ada sama sekali di v1)

## 5. Pemangku Kepentingan dan Peran

| Pihak | Peran dalam sistem | Kebutuhan utama |
|---|---|---|
| **Penonton** | Pengguna dengan akun sendiri (daftar mandiri dengan email, langsung aktif) | Memesan kursi tanpa antre dan memantau status pesanannya |
| **Admin bioskop** | Pengguna dengan akun yang dibuat di awal | Mengelola film dan jadwal, memproses pesanan di loket |
| **Pemilik proyek** | Pihak yang membuat akun admin di awal dan melakukan reset password manual | Pilot selesai dalam waktu dan scope yang disepakati |

## 6. Kebutuhan Bisnis

| Kode | Kebutuhan bisnis | Dipenuhi oleh |
|---|---|---|
| **BR-01** | Penonton dapat memesan kursi tanpa antre atau chat manual. | F1-F5 |
| **BR-02** | Satu kursi pada satu jadwal tidak boleh terpesan ganda. | R1, F3 |
| **BR-03** | Kursi tidak boleh tertahan tanpa batas oleh pesanan yang tidak dikonfirmasi. | R2, R4 |
| **BR-04** | Admin dapat mengelola film dan jadwal serta memproses pesanan di loket. | F6, R6, R10, R12-R15 |
| **BR-05** | Pembayaran tetap dilakukan di loket, tanpa pembayaran online. | R5 |
| **BR-06** | Aplikasi selesai dalam sekitar 4 jam dengan scope kecil. | Bagian 4.2 dan Bagian 12 |

## 7. Kebutuhan Fungsional Tingkat Tinggi

| Kode | Fitur | Keterangan |
|---|---|---|
| **F1** | Akun dan login | Penonton daftar dan login memakai email. Admin login. Tanpa verifikasi email dan tanpa lupa password. |
| **F2** | Daftar film dan jadwal | Penonton melihat film dan jam tayangnya. |
| **F3** | Peta kursi per jadwal | Status tiap kursi terlihat (kosong atau terisi). |
| **F4** | Buat pesanan | Pilih 1-4 kursi. Status Ditahan, kode booking dibuat, batas waktu tampil jelas. |
| **F5** | Pesanan Saya | Penonton melihat kode, kursi, status, dan batas waktu pesanannya. |
| **F6** | Admin | Tambah/ubah film dan jadwal, lihat pesanan per jadwal, konfirmasi dan batalkan pesanan. |

## 8. Aturan Bisnis

| Kode | Aturan |
|---|---|
| **R1** | Satu kursi pada satu jadwal tidak boleh dipegang oleh dua pesanan aktif. Pengecekan dan penyimpanan harus satu langkah tak terpisah, sehingga jika dua orang menekan Pesan bersamaan hanya satu yang berhasil. |
| **R2** | Maksimal 4 kursi per pesanan. Satu akun boleh punya beberapa pesanan di jadwal yang sama, tetapi total kursi berstatus Ditahan per akun per jadwal maksimal 4. |
| **R3** | Memesan wajib login. |
| **R4** | Pesanan ditahan sampai waktu yang lebih awal antara **60 menit sejak dibuat** dan **jam tayang dimulai**. Jika belum dikonfirmasi admin, pesanan otomatis batal dan kursi terbuka lagi. |
| **R5** | Pembayaran dilakukan di loket. Aplikasi tidak menampilkan harga atau total bayar. |
| **R6** | Hanya admin yang boleh mengelola film dan jadwal, serta mengonfirmasi atau membatalkan pesanan. |
| **R7** | Studio dan layout kursi bersifat tetap (diisi di awal). Tiap jadwal terhubung ke satu studio. |
| **R8** | Jadwal yang sudah lewat tidak bisa dipesan. |
| **R9** | Penonton tidak bisa membatalkan pesanan sendiri di aplikasi. Pengajuan dilakukan lewat loket atau telepon, lalu admin yang membatalkan. |
| **R10** | Jadwal yang masih punya pesanan aktif tidak boleh diubah. Tidak ada hapus jadwal di v1. Jadwal yang salah diperbaiki dengan membatalkan pesanannya dulu, lalu mengubahnya. |
| **R11** | Setiap pesanan punya kode booking pendek yang unik dan acak (tidak berurutan). |
| **R12** | Konfirmasi hanya berlaku untuk status Ditahan yang belum lewat batas waktu. Daftar pesanan admin menampilkan sisa waktu. Pesanan yang sudah batal tidak bisa dikonfirmasi. |
| **R13** | Pesanan Terkonfirmasi hanya bisa dibatalkan sebelum jam tayang. Setelah itu statusnya terkunci sebagai riwayat. |
| **R14** | Konfirmasi dan pembatalan di loket diproses hanya jika penonton menyebut **kode booking dan email akun**. |
| **R15** | Jadwal di studio yang sama tidak boleh tumpang tindih (memakai durasi film). |
| **R16** | Batas waktu penahanan ditampilkan dengan jelas sebelum penonton menekan Pesan. |

## 9. Proses Bisnis

**Penonton**
1. Daftar (nama, email, password), akun langsung aktif, lalu login.
2. Pilih film, jadwal (hanya yang belum lewat), dan 1-4 kursi.
3. Pesanan dibuat berstatus Ditahan dengan kode booking dan batas waktu.
4. Datang ke loket, sebut kode booking dan email akun, bayar di loket.
5. Jika ingin batal, hubungi loket atau telepon. Admin yang membatalkan.

**Admin**
1. Login dengan akun yang dibuat di awal.
2. Kelola film dan jadwal (tambah/ubah).
3. Cari pesanan per jadwal lewat kode booking, cocokkan kode dan email akun.
4. Konfirmasi pesanan Ditahan yang belum lewat batas waktu, atau batalkan pesanan.

**Status pesanan**

| Dari | Ke | Pemicu |
|---|---|---|
| Ditahan | Terkonfirmasi | Admin menekan Konfirmasi sebelum batas waktu (R12) |
| Ditahan | Batal | Otomatis saat batas waktu habis (R4), atau admin membatalkan |
| Terkonfirmasi | Batal | Admin membatalkan atas permintaan penonton, sebelum jam tayang (R13) |
| Batal | (final) | Tidak ada perubahan lagi |

## 10. Data Bisnis

| Entitas | Isi |
|---|---|
| Akun (Supabase Auth) | Nama, email, password. Peran admin ditandai di `app_metadata`. |
| Film | Judul, durasi (menit), sinopsis |
| Studio | Nama, jumlah baris, jumlah kolom (tetap) |
| Kursi | Posisi dan kode kursi per studio |
| Jadwal | Film, studio, waktu mulai, waktu selesai (dihitung dari durasi film) |
| Pesanan | Kode booking, pemilik, jadwal, status, batas waktu |
| Kursi pesanan | Kursi yang dipegang tiap pesanan |

## 11. Asumsi dan Batasan

- Platform: **Supabase** (Auth + PostgreSQL). Tidak ada tabel users sendiri.
- Satu bioskop. Studio dan layout kursi tetap, diisi di awal.
- Akun admin dibuat di awal. Reset password penonton dilakukan manual di luar aplikasi.
- Pembayaran dan konfirmasi dilakukan di loket.
- Data contoh: Studio 1 (8×10 = 80 kursi), Studio 2 (6×8 = 48 kursi), 4 film, sekitar 3 jadwal per studio per hari untuk 3 hari ke depan.
- Antarmuka mengikuti `design_system_scenekita.md` (dark-mode, mobile-first, 9 layar).
- Waktu pembangunan sekitar 4 jam.

## 12. Kriteria Penerimaan

Aplikasi dianggap selesai bila:

1. Penonton bisa daftar/login, memilih film, jadwal, dan kursi (maks 4), lalu mendapat pesanan dengan kode booking.
2. Admin bisa tambah/ubah film dan jadwal, melihat pesanan per jadwal, serta mengonfirmasi atau membatalkan pesanan.
3. Kursi yang sudah dipesan tidak bisa dipesan orang lain, termasuk saat dua orang menekan Pesan bersamaan.
4. Pesanan yang melewati batas waktu otomatis batal dan kursinya terbuka lagi.
5. Ada data contoh dan tampilan nyaman dibuka di HP maupun laptop.

> **Jika waktu mepet:** aturan kursi dan pembatalan otomatis tidak boleh dikurangi. Tampilan HP-friendly adalah yang pertama dipangkas.

## 13. Risiko yang Diterima untuk Pilot

- **Akun palsu:** karena tidak ada verifikasi email, satu orang bisa membuat banyak akun untuk menyiasati batas 4 kursi (R2). Dampaknya dibatasi karena konfirmasi tetap dilakukan di loket dengan kode booking dan email akun (R14).
- **Pembatalan otomatis tanpa cron:** pesanan yang kedaluwarsa bisa tampil Ditahan sampai ada aktivitas berikutnya di jadwal itu. Kursinya tetap diperlakukan terbuka, dan konfirmasinya ditolak (R12).

## 14. Ketergantungan

- Supabase (Auth dan database) dengan skema di `scenekita_schema.sql`.
- Akun admin dibuat dan ditandai perannya sebelum panel admin bisa dipakai.
- `pg_cron` bersifat opsional untuk pembatalan otomatis tiap menit.

## 15. Hal yang Belum Ditetapkan

- **Indikator keberhasilan bisnis pilot** (misalnya target pengurangan antrean) tidak dibahas dalam diskusi, sehingga sengaja tidak diisi di sini.
- **Selisih Design System dengan Brief:** satu hal perlu keputusan pemilik proyek, yaitu kartu metrik di layar admin. Rinciannya ada di `PLAN.md`, Bagian 7.
