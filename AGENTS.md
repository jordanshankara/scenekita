# SceneKita: Instruksi untuk Asisten Kode

> File ini memandu asisten kode (GitHub Copilot, Claude Code, atau sejenisnya). Bisa ditempatkan sebagai `.github/copilot-instructions.md`, `CLAUDE.md`, atau `AGENTS.md`. Isinya sama untuk semua.

## 1. Konteks Proyek

**SceneKita** adalah aplikasi web pemesanan kursi bioskop untuk **satu bioskop**, dibangun sebagai project pilot (MVP v1) dalam waktu sekitar 4 jam. Masalah yang diselesaikan: antrean dan pemesanan manual.

- **Penonton:** daftar dengan email, memilih film, jadwal, dan 1-4 kursi, lalu pesanan ditahan 60 menit. Pembayaran dan konfirmasi di loket.
- **Admin bioskop:** mengelola film dan jadwal, melihat pesanan per jadwal, mengonfirmasi dan membatalkan pesanan.
- **Platform:** Supabase (Auth + PostgreSQL). Tidak ada tabel users sendiri.

## 2. Baca Dulu, Urutan Acuan

Sebelum menulis kode, baca dokumen berikut. Jika berbeda, urutan yang lebih atas menang.

1. `SceneKita_Brief_MVP_v1.md` dan `BRD.md`: fitur F1-F6, aturan R1-R16, alur, di luar cakupan
2. `scenekita_schema.sql`: struktur data, fungsi database, RLS
3. `GUARDRAILS.md`: batasan dan keamanan
4. `design_system_scenekita.md`: tampilan, token, komponen, 9 layar
5. `PLAN.md` dan `DATABASE-SUPABASE.md`: urutan kerja dan cara memakai database

Jika dua dokumen bertentangan dan selisihnya belum tercatat di `PLAN.md` Bagian 7, **berhenti dan tanyakan**. Jangan memilih sendiri.

## 3. Aturan Utama

### Lingkup

- Bangun **hanya** F1-F6. Jangan menambah fitur, layar, atau aturan.
- Jangan mengubah aturan bisnis R1-R16.
- Jika diminta fitur di luar cakupan, ingatkan bahwa itu di luar cakupan MVP v1 dan tanyakan apakah masuk daftar "tidak dibuat di v1". Jangan langsung membangunnya.
- Kartu metrik di layar admin (Design System, layar 7) **belum diputuskan**. Jangan dibangun sampai ada keputusan.

### Data dan Supabase

- Jangan membuat tabel users sendiri. Pakai `auth.users`.
- Semua perubahan pesanan lewat RPC: `buat_pesanan`, `konfirmasi_pesanan`, `batalkan_pesanan`. Jangan insert/update langsung ke `pesanan` atau `pesanan_kursi`.
- Peta kursi lewat `peta_kursi`. Daftar pesanan admin lewat `pesanan_admin`.
- Peran admin hanya dibaca dari `app_metadata`. Jangan pernah dari `user_metadata`, localStorage, atau flag di klien.
- Jangan membuat aksi hapus untuk jadwal atau data lain.
- Validasi di klien hanya untuk kenyamanan pengguna. Keputusan akhir ada di database.
- Pakai hanya kunci anon/publik di klien. Jangan pernah memakai atau menulis kunci `service_role` di kode klien, repo, atau log.
- Detail ada di `DATABASE-SUPABASE.md` dan `GUARDRAILS.md`.

### Tampilan

- Ikuti `design_system_scenekita.md`: gunakan token CSS yang ada, jangan menulis warna HEX/RGB sendiri.
- Mobile-first, diuji di lebar 390px. Area sentuh minimal 44 × 44px. Ukuran font minimal 14px.
- Ikon memakai SVG garis seragam. Tidak ada emoji sebagai ikon.
- Semua teks yang tampil ke pengguna memakai **Bahasa Indonesia**.
- Jangan menampilkan error mentah dari server atau database. Petakan ke pesan ramah (lihat `DATABASE-SUPABASE.md`, Bagian 6).
- Jangan menampilkan harga, total bayar, QR code, tombol batal mandiri penonton, tombol hapus jadwal, atau tautan lupa kata sandi.
- Render teks dari pengguna (misalnya sinopsis) sebagai teks biasa, bukan HTML.
- Hormati `prefers-reduced-motion: reduce`.

## 4. Hal yang Belum Ditentukan

Kerangka kerja (framework), bahasa pemrograman, pustaka state, routing, hosting, dan struktur folder **belum ditentukan** dalam diskusi.

- Jika repositori sudah punya pilihan, ikuti yang ada.
- Jika repositori kosong, **tanyakan sekali** sebelum memulai. Jangan menentukan sendiri.
- Pemetaan token Design System ke Tailwind mengikuti versi Tailwind yang terpasang (v3 atau v4), sesuai Design System Bagian 2.

## 5. Cara Bekerja

1. Kerjakan sesuai fase di `PLAN.md`. Selesaikan pemeriksaan satu fase sebelum lanjut.
2. Jika waktu mepet: jangan kurangi aturan kursi (R1, R2) dan pembatalan otomatis (R4). Tampilan HP-friendly dipangkas lebih dulu.
3. Jika ada ambiguitas pada aturan atau alur, tanyakan satu pertanyaan yang spesifik. Jangan menebak.
4. Jika menemukan celah keamanan atau aturan yang tidak konsisten, laporkan. Jangan "memperbaiki" dengan mengubah aturan.
5. Komunikasi dalam Bahasa Indonesia, ringkas, tanpa basa-basi.
6. Jangan mengubah file SQL kecuali diminta. Perubahan skema memengaruhi aturan yang sudah disepakati.

## 6. Pemeriksaan Sebelum Menyatakan Selesai

- [ ] Hanya fitur F1-F6 yang ada, tidak ada yang di luar cakupan
- [ ] Tidak ada insert/update langsung ke `pesanan` dan `pesanan_kursi` dari klien
- [ ] Tidak ada `service_role` di klien, repo, atau log
- [ ] Peran admin hanya dari `app_metadata`, dan rute admin menampilkan state `forbidden` untuk non-admin
- [ ] Dua sesi yang memesan kursi sama: hanya satu berhasil
- [ ] Lebih dari 4 kursi (termasuk yang sedang Ditahan) ditolak
- [ ] Batas waktu penahanan tampil sebelum menekan Pesan dan setelah pesanan dibuat
- [ ] Konfirmasi admin hanya untuk pesanan Ditahan yang belum lewat batas
- [ ] Tidak ada tombol hapus jadwal, tombol batal mandiri penonton, harga, atau QR code
- [ ] Semua token warna dari Design System, font minimal 14px, area sentuh minimal 44px
- [ ] Tidak ada gulir horizontal liar di 390px
- [ ] Semua state non-ideal (loading, kosong, error, forbidden, 404) punya pesan Bahasa Indonesia dan tombol pemulihan
