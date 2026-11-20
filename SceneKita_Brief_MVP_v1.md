# SceneKita: Brief MVP v1

| | |
|---|---|
| **Produk** | Aplikasi web pemesanan kursi bioskop |
| **Tahap** | Project pilot (MVP v1) |
| **Waktu build** | Sekitar 4 jam |
| **Status** | Scope terkunci, semua pertanyaan terbuka sudah terjawab |
| **Tanggal** | 20 November 2026 |
| **File pendamping** | `scenekita_schema.sql` (skema database Supabase) |

---

## 1. Ringkasan

**Masalah utama:** antrean dan pemesanan manual. Penonton harus datang ke loket atau chat dulu untuk memesan kursi.

**Solusi v1:** web app untuk **satu bioskop**. Penonton login, memilih film, jadwal, dan kursi (maks 4), lalu pesanan ditahan **60 menit**. Pembayaran dan konfirmasi dilakukan di loket oleh admin. Tidak ada pembayaran online.

**Status pesanan:** `Ditahan`, `Terkonfirmasi`, `Batal`.

**Teknologi yang sudah diputuskan:** Supabase (Auth + PostgreSQL). Tidak ada tabel users sendiri. Nama penonton disimpan di metadata Auth, peran admin di `app_metadata`.

### Struktur halaman

| Area | Halaman |
|---|---|
| **Penonton** | Daftar/login, daftar film + jadwal, peta kursi, Pesanan Saya |
| **Admin** | Login, kelola film, kelola jadwal, daftar pesanan per jadwal (konfirmasi dan batalkan) |

### Dianggap selesai bila

- Penonton bisa daftar/login, memilih film, jadwal, dan kursi (maks 4), lalu mendapat pesanan dengan kode booking.
- Admin bisa tambah/ubah film dan jadwal, melihat pesanan per jadwal, serta mengonfirmasi atau membatalkan pesanan.
- Kursi yang sudah dipesan tidak bisa dipesan orang lain, termasuk saat dua orang menekan Pesan bersamaan.
- Pesanan yang melewati batas waktu otomatis batal dan kursinya terbuka lagi.
- Ada data contoh dan tampilan nyaman dibuka di HP maupun laptop.

> **Jika waktu mepet:** poin aturan kursi dan pembatalan otomatis tidak boleh dikurangi. Tampilan HP-friendly adalah yang pertama dipangkas.

---

## 2. Pengguna dan Peran

| Peran | Akun | Bisa apa |
|---|---|---|
| **Penonton** | Daftar sendiri dengan email. Langsung aktif, tanpa verifikasi email. | Lihat film dan jadwal, pilih kursi, buat pesanan, lihat pesanan sendiri |
| **Admin bioskop** | Dibuat di awal oleh pemilik sistem | Tambah/ubah film dan jadwal, lihat pesanan per jadwal, konfirmasi dan batalkan pesanan |

---

## 3. Fitur Wajib

| Kode | Fitur | Keterangan |
|---|---|---|
| **F1** | Akun dan login | Penonton daftar dan login memakai email. Admin login. Tanpa verifikasi email dan tanpa lupa password. |
| **F2** | Daftar film dan jadwal | Penonton melihat film dan jam tayangnya. |
| **F3** | Peta kursi per jadwal | Status tiap kursi terlihat (kosong atau terisi). |
| **F4** | Buat pesanan | Pilih 1-4 kursi. Status Ditahan, kode booking dibuat, batas waktu tampil jelas. |
| **F5** | Pesanan Saya | Penonton melihat kode, kursi, status, dan batas waktu pesanannya. |
| **F6** | Admin | Tambah/ubah film dan jadwal, lihat pesanan per jadwal, konfirmasi dan batalkan pesanan. |

---

## 4. Aturan Bisnis

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

---

## 5. Status Pesanan

| Dari | Ke | Pemicu |
|---|---|---|
| Ditahan | Terkonfirmasi | Admin menekan Konfirmasi sebelum batas waktu (R12) |
| Ditahan | Batal | Otomatis saat batas waktu habis (R4), atau admin membatalkan |
| Terkonfirmasi | Batal | Admin membatalkan atas permintaan penonton, sebelum jam tayang (R13) |
| Batal | (final) | Tidak ada perubahan lagi |

Kursi otomatis terbuka lagi begitu pesanan berstatus Batal.

```mermaid
flowchart TD
    A(["Pesanan dibuat"]) --> B["Ditahan"]
    B -->|"Admin konfirmasi sebelum batas waktu"| C["Terkonfirmasi"]
    B -->|"Batas waktu habis (otomatis)"| D["Batal"]
    B -->|"Admin membatalkan"| D
    C -->|"Admin membatalkan sebelum jam tayang"| D
    D --> E["Kursi terbuka lagi"]
```

---

## 6. Diagram Alur Penonton

```mermaid
flowchart TD
    A([Mulai]) --> B{"Sudah punya akun?"}
    B -->|Belum| C["Daftar (nama, email, password)"]
    C --> D["Akun langsung aktif"]
    D --> E["Login (email, password)"]
    B -->|Sudah| E
    E --> F["Pilih film"]
    F --> G["Pilih jadwal"]
    G --> H{"Jadwal sudah lewat?"}
    H -->|"Ya, tidak bisa dipesan"| G
    H -->|Tidak| I["Lihat peta kursi"]
    I --> J["Pilih kursi (1-4)"]
    J --> K["Lihat batas waktu penahanan"]
    K --> L["Tekan Pesan"]
    L --> M{"Total kursi Ditahan akun di jadwal ini maksimal 4?"}
    M -->|Tidak| J
    M -->|Ya| N{"Semua kursi masih kosong?"}
    N -->|Tidak| O["Pesanan gagal, pilih ulang"]
    O --> I
    N -->|Ya| P["Pesanan dibuat: status Ditahan + kode booking"]
    P --> Q["Pesanan Saya: kode, kursi, status, batas waktu"]
    Q --> R["Datang ke loket, sebut kode + email akun"]
    R --> S{"Dikonfirmasi admin sebelum batas?"}
    S -->|Tidak| T["Batal otomatis (60 menit atau jam tayang)"]
    S -->|Ya| U["Status Terkonfirmasi"]
    U --> V{"Mau batal?"}
    V -->|Tidak| W([Selesai])
    V -->|Ya| X["Minta batal lewat loket atau telepon"]
    X --> Y["Admin membatalkan pesanan"]
    T --> Z["Status Batal, kursi terbuka lagi"]
    Y --> Z
    Z --> W
```

---

## 7. Diagram Alur Admin

```mermaid
flowchart TD
    A([Mulai]) --> B["Login admin (akun dibuat di awal)"]
    B --> C{"Pilih menu"}

    C -->|Film| D{"Aksi film"}
    D -->|Tambah| D1["Isi data film, simpan"]
    D -->|Ubah| D2["Ubah data film, simpan"]

    C -->|Jadwal| E{"Aksi jadwal"}
    E -->|Tambah| E1["Pilih film, studio, tanggal, jam"]
    E -->|Ubah| E3{"Ada pesanan aktif?"}
    E3 -->|Ya| E4["Ditolak: batalkan pesanan dulu"]
    E3 -->|Tidak| E5["Ubah film, studio, tanggal, atau jam"]
    E1 --> E6{"Bentrok dengan jadwal lain di studio?"}
    E5 --> E6
    E6 -->|Ya| E7["Ditolak: jam bentrok"]
    E6 -->|Tidak| E2["Jadwal tersimpan"]

    C -->|Pesanan| F["Pilih jadwal"]
    E4 --> F
    F --> G["Cari pesanan lewat kode booking"]
    G --> G1["Cocokkan kode dan email akun"]
    G1 --> H{"Status pesanan"}
    H -->|Ditahan| I{"Batas waktu belum habis?"}
    I -->|Ya| J{"Aksi admin"}
    I -->|Tidak| K0["Pesanan sudah batal otomatis"]
    J -->|Konfirmasi| J1["Status Terkonfirmasi"]
    J -->|Batalkan| K["Status Batal"]
    H -->|Terkonfirmasi| L{"Jam tayang sudah lewat?"}
    L -->|Tidak| L1["Batalkan atas permintaan penonton"]
    L1 --> K
    L -->|Ya| L2["Tidak bisa dibatalkan"]
    H -->|Batal| M["Tidak ada aksi"]
    K --> N["Kursi terbuka lagi"]
    K0 --> N

    D1 --> O([Selesai])
    D2 --> O
    E2 --> O
    E7 --> O
    J1 --> O
    L2 --> O
    M --> O
    N --> O
```

---

## 8. Struktur Data

Skema lengkap ada di `scenekita_schema.sql`. Tidak ada tabel users sendiri; relasi pesanan memakai `auth.users` dari Supabase Auth.

```mermaid
erDiagram
    AUTH_USERS ||--o{ PESANAN : memesan
    FILM ||--o{ JADWAL : ditayangkan
    STUDIO ||--o{ JADWAL : dipakai
    STUDIO ||--o{ KURSI : punya
    JADWAL ||--o{ PESANAN : dipesan
    PESANAN ||--|{ PESANAN_KURSI : berisi
    KURSI ||--o{ PESANAN_KURSI : dipilih

    FILM {
        uuid id
        text judul
        int durasi_menit
        text sinopsis
    }
    STUDIO {
        uuid id
        text nama
        int jumlah_baris
        int jumlah_kolom
    }
    KURSI {
        uuid id
        uuid studio_id
        text baris
        int kolom
        text kode
    }
    JADWAL {
        uuid id
        uuid film_id
        uuid studio_id
        timestamptz mulai
        timestamptz selesai
    }
    PESANAN {
        uuid id
        text kode_booking
        uuid user_id
        uuid jadwal_id
        enum status
        timestamptz batas_waktu
    }
    PESANAN_KURSI {
        uuid id
        uuid pesanan_id
        uuid jadwal_id
        uuid kursi_id
        boolean aktif
    }
```

### Fitur ke fungsi database

| Fitur | Operasi |
|---|---|
| F1 Akun dan login | Supabase Auth (email + password) |
| F2 Daftar film dan jadwal | Baca tabel `film` dan `jadwal` |
| F3 Peta kursi | Fungsi `peta_kursi(jadwal_id)` |
| F4 Buat pesanan | Fungsi `buat_pesanan(jadwal_id, kursi_ids)` |
| F5 Pesanan Saya | Baca tabel `pesanan` dan `pesanan_kursi` milik sendiri |
| F6 Admin | Insert/update `film` dan `jadwal`; fungsi `pesanan_admin`, `konfirmasi_pesanan`, `batalkan_pesanan` |
| Batal otomatis (R4) | Fungsi `lepas_pesanan_kedaluwarsa()`, opsional dijadwalkan tiap menit lewat `pg_cron` |

### Data contoh

- **Studio 1:** 8 baris (A-H) × 10 kolom = 80 kursi
- **Studio 2:** 6 baris (A-F) × 8 kolom = 48 kursi
- 4 film, sekitar 3 jadwal per studio per hari untuk 3 hari ke depan

### Langkah setelah menjalankan skema

1. Buat akun admin di Supabase Authentication, lalu tandai perannya lewat perintah `update auth.users ...` (ada di akhir file SQL). Admin perlu login ulang.
2. Reset password penonton dilakukan manual di luar aplikasi (Authentication > Users).
3. Opsional: aktifkan `pg_cron` agar pesanan kedaluwarsa dibatalkan tiap menit. Tanpa cron, aturan tetap aman karena pengecekan kedaluwarsa dilakukan saat memesan, mengonfirmasi, dan menampilkan peta kursi.

---

## 9. Di Luar Cakupan (Tidak Dibuat di v1)

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

---

## 10. Risiko yang Diterima untuk Pilot

- **Akun palsu:** karena tidak ada verifikasi email, satu orang bisa membuat banyak akun untuk menyiasati batas 4 kursi (R2). Dampaknya dibatasi karena konfirmasi tetap dilakukan di loket dengan kode booking dan email akun (R14).
- **Pembatalan otomatis tanpa cron:** pesanan yang kedaluwarsa bisa tampil Ditahan sampai ada aktivitas berikutnya di jadwal itu. Kursinya tetap diperlakukan terbuka, dan konfirmasinya ditolak (R12).

---

## 11. Pertanyaan Terbuka

Tidak ada. Semua pertanyaan dari wawancara dan tinjauan celah alur sudah terjawab dan masuk ke dokumen ini.
