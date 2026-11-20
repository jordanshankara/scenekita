# SceneKita Design System (MVP v1)

Dokumen ini adalah acuan implementasi UI/UX untuk aplikasi web responsif (*mobile-first*) **SceneKita**. Semua komponen, token, dan tata letak wajib mengikuti spesifikasi ini tanpa menambah warna, efek, atau fitur di luar cakupan MVP v1.

---

## 1. Prinsip Desain

SceneKita mengusung antarmuka *dark-mode first* yang menerjemahkan ketenangan ruang teater modern ke dalam pengalaman pemesanan kursi yang fokus dan imersif. Hierarki visual dibangun melalui kontras permukaan gelap berlapis dan garis batas tipis, bukan dekorasi berlebihan atau bayangan berat. Pendar cahaya biru lembut dipakai secara selektif hanya pada titik fokus utama seperti layar bioskop dan sorotan aksi primer agar perhatian pengguna selalu terarah. Kepadatan antarmuka divariasikan secara sadar sesuai konteks tugas: katalog film tampil lega dan visual, peta kursi tampil fokus dan sederhana, sementara panel admin tampil padat data dan efisien. Seluruh sembilan layar berbagi satu fondasi kanvas, ritme jarak kelipatan 4/8 px, dan pola navigasi yang konsisten sehingga aplikasi terasa utuh sebagai satu sistem.

---

## 2. Design Tokens (CSS Variables)

Pemetaan seluruh CSS variables di bawah ini ke konfigurasi Tailwind (baik melalui blok `@theme` pada Tailwind v4 maupun `theme.extend` di `tailwind.config` pada Tailwind v3) wajib dilakukan sesuai versi Tailwind yang terpasang di proyek.

```css
:root {
  /* Warna Latar & Permukaan */
  --color-bg-page: #0B0D12;
  --color-bg-sidebar: #10131C;
  --color-bg-input: #0F1219;
  --color-surface-card: #141720;
  --color-surface-elevated: #1B1F2B;
  --color-surface-shimmer: #252A3A;

  /* Warna Border */
  --color-border-subtle: #1F2433;
  --color-border-default: #242938;
  --color-border-strong: #2E3548;
  --color-border-secondary: #2F364B;

  /* Warna Merek & Aksen */
  --color-primary: #3F5CE0;
  --color-primary-light: #6C84FF;
  --color-secondary: #6E56CF;
  --color-accent: #F5B73B;

  /* Warna Teks */
  --color-text-primary: #F4F6FB;
  --color-text-muted: #9CA3B8;

  /* Warna Status */
  --color-status-success: #2ED47A;
  --color-status-warning: #F5B73B;
  --color-status-error: #F05252;
  --color-status-info: #38BDF8;

  /* Warna Kursi (SeatMap) */
  --color-seat-available-bg: #1D274D;
  --color-seat-available-border: #4A63C9;
  --color-seat-selected-bg: #3F5CE0;
  --color-seat-occupied-bg: #222634;

  /* Tipografi */
  --font-sans: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;

  /* Skala Ukuran Font (minimum 14px untuk seluruh teks terbaca) */
  --text-h1-desktop: 2rem;      /* 32px | weight 700 | line-height 1.2 */
  --text-h1-mobile: 1.5rem;     /* 24px | weight 700 | line-height 1.2 */
  --text-h2-desktop: 1.5rem;    /* 24px | weight 600 | line-height 1.25 */
  --text-h2-mobile: 1.25rem;    /* 20px | weight 600 | line-height 1.25 */
  --text-h3: 1.125rem;          /* 18px | weight 600 | line-height 1.35 */
  --text-body: 1rem;            /* 16px | weight 400/500 | line-height 1.55 */
  --text-body-sm: 0.9375rem;    /* 15px | weight 400/500 | line-height 1.55 */
  --text-caption: 0.875rem;     /* 14px | weight 500 | line-height 1.4 */

  /* Spacing (kelipatan 4px dan 8px) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Grid & Kontainer */
  --container-max: 1280px;
  --gutter-mobile: 12px;
  --gutter-tablet: 16px;
  --gutter-desktop: 24px;
  --touch-min: 44px;

  /* Border Radius */
  --radius-seat: 6px;
  --radius-control: 10px;
  --radius-poster: 12px;
  --radius-card: 16px;
  --radius-pill: 9999px;

  /* Elevasi, Bayangan & Pendar */
  --shadow-floating: 0 12px 32px rgba(0, 0, 0, 0.45);
  --glow-screen: 0 0 40px rgba(63, 92, 224, 0.28);
  --backdrop-modal: rgba(5, 7, 11, 0.75);
  --overlay-poster: linear-gradient(to top, rgba(11, 13, 18, 0.92) 0%, rgba(11, 13, 18, 0) 55%);

  /* Gerak (hormati prefers-reduced-motion: reduce) */
  --duration-fast: 150ms;
  --duration-base: 240ms;
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

**Breakpoint acuan:** Mobile `< 640px` (4 kolom), Tablet `640px – 1023px` (8 kolom), Desktop `≥ 1024px` (12 kolom, kontainer maks `1280px`). Gunakan `font-variant-numeric: tabular-nums` pada jam tayang, durasi, kode booking, dan sisa waktu.

---

## 3. Spesifikasi Komponen

### Button
* **Anatomi:** Wadah tombol beradius `10px`, label teks (`500`–`600`), ikon SVG garis opsional (`stroke-width: 1.75px`) di kiri/kanan.
* **Varian:** `primary` (latar `--color-primary`, teks `--color-text-primary`), `secondary` (latar `--color-surface-elevated`, border `1px solid --color-border-secondary`, teks `--color-text-primary`), `ghost` (transparan, teks `--color-text-muted`), `danger-secondary` (khusus aksi batal admin: latar `--color-surface-elevated`, border & teks `--color-status-error`).
* **State:** `default`, `hover` (naikkan kecerahan latar satu tingkat atau pertegas border), `focus-visible` (`outline: 2px solid --color-primary-light; outline-offset: 2px`), `disabled` (opasitas `45%`, `cursor: not-allowed`, tanpa efek hover), `loading` (indikator putar SVG + teks nonaktif).
* **WAJIB:** Tinggi minimal `44px`, area sentuh minimal `44 × 44px`, jarak antartombol minimal `8px`.
* **DILARANG:** Membuat tombol di bawah `44px`, memakai emoji sebagai ikon tombol, atau memakai warna latar di luar token.

### Input
* **Anatomi:** Label teks di atas (`--text-caption` / `14px`), bidang input (`input`, `select`, atau `textarea`) berlatar `--color-bg-input` dengan border `1px solid --color-border-default` dan radius `10px`, ikon pengarah opsional di kiri, serta teks bantu atau pesan error di bawah.
* **Varian:** `text`, `email`, `password` (dengan tombol ikon tampil/sembunyi), `number`, `date`, `time`, `select`, `textarea`, `search`, dan `read-only` (untuk perkiraan jam selesai jadwal).
* **State:** `default`, `hover` (border `--color-border-strong`), `focus` (`outline: 2px solid --color-primary-light; outline-offset: 2px`), `error` (border `--color-status-error` + ikon peringatan + pesan spesifik), `disabled` (opasitas `45%`).
* **WAJIB:** Tinggi minimal `44px`, label eksplisit terhubung lewat `htmlFor`/`id`, warna placeholder memakai `--color-text-muted` agar kontras terjaga.
* **DILARANG:** Mengandalkan placeholder sebagai pengganti label atau menyembunyikan pesan error hanya dengan perubahan warna border.

### Card
* **Anatomi:** Wadah berlatar `--color-surface-card`, border `1px solid --color-border-default`, radius `16px`, *padding* `16px` (mobile) atau `24px` (desktop), dengan struktur opsional header, body, dan footer.
* **Varian:** `default` (statis), `interactive` (berubah latar ke `--color-surface-elevated` dan border lebih terang saat hover), `highlight` (khusus blok Kode Booking dengan aksen gradasi tipis `--color-primary` ke `--color-secondary` atau kotak peringatan batas waktu dengan tinta `--color-status-warning` 12% opacity).
* **State:** `default`, `hover` (hanya varian interaktif), `focus-within` (saat berisi kontrol aktif), `loading` (*skeleton shimmer* `--color-surface-elevated` ke `--color-surface-shimmer`).
* **WAJIB:** Membedakan elevasi lewat kecerahan permukaan dan border `1px`, bukan bayangan pekat.
* **DILARANG:** Menambahkan drop shadow tebal pada kartu statis atau mencampur radius sudut yang tidak sesuai token.

### MovieCard
* **Anatomi:** Berbasis `Card` dengan area sampul rasio `2:3` beradius `12px` di atas (*overlay* `--overlay-poster` dari bawah 0% hingga transparan di 55% + `Badge` durasi di sudut kanan atas), diikuti judul film (`H3`), potongan sinopsis maksimal 2 baris (`--color-text-muted`), deretan maksimal 3 chip jam tayang hari terpilih, dan tombol `secondary` lebar penuh `Lihat Jadwal`.
* **Varian:** `catalog` (vertikal untuk halaman beranda) dan `detail-summary` (ringkas horizontal di mobile, panel *sticky* 4 kolom di desktop untuk halaman detail).
* **State:** `default`, `hover`, `loading` (skeleton rasio 2:3 + garis teks), dan jadwal lewat pada chip (`disabled`).
* **WAJIB:** Menggunakan gradasi gelap `--overlay-poster` setiap kali teks atau badge berada di atas area sampul; memakai sampul statis/tipografi gelap bergradasi `--color-seat-available-bg` ke `--color-surface-card` karena skema MVP tidak menyimpan URL poster.
* **DILARANG:** Menampilkan harga tiket, rating palsu, atau teks langsung di atas gambar tanpa overlay gelap.

### Navbar
* **Anatomi:** Bar navigasi atas lengket (*sticky top*) berlatar `--color-bg-page` semi-transparan dengan *backdrop blur* dan border bawah `1px solid --color-border-default`; sisi kiri menampilkan identitas teks **SceneKita**, sisi kanan memuat tautan/aksi sesuai peran (`Pesanan Saya`, `Masuk` / nama akun + `Keluar`, serta `Panel Admin` khusus admin). Untuk area admin di desktop, didampingi *sidebar* kiri tetap selebar `240px` berlatar `--color-bg-sidebar` (berubah menjadi bilah tab gulir horizontal di mobile).
* **Varian:** `viewer` (publik & penonton login) dan `admin-shell` (sidebar desktop + top bar tab mobile).
* **State:** `default`, `active-link` (teks `--color-primary-light` atau indikator aktif jelas), `scrolled`.
* **WAJIB:** Menjaga area sentuh setiap tautan/tombol minimal `44 × 44px` dan tetap dapat digunakan nyaman di lebar `390px`.
* **DILARANG:** Menyembunyikan menu utama admin pada tampilan mobile tanpa navigasi pengganti, atau menaruh kolom pencarian global yang tidak diperlukan di luar konteks layar.

### Badge
* **Anatomi:** Wadah kapsul (`--radius-pill`) ringkas berisi teks pendek (`--text-caption` / `14px`, `weight: 500`) dengan *padding* vertikal `4px` dan horizontal `10px`–`12px`, berlatar tinta warna terkait dengan opasitas `12%` dan teks kontras tinggi.
* **Varian:** `neutral` (durasi, kode kursi, label studio), `warning` (status `Ditahan` memakai `--color-status-warning`), `success` (status `Terkonfirmasi` memakai `--color-status-success`), `error` (status `Batal` memakai `--color-status-error`), `info` (keterangan aturan memakai `--color-status-info`), dan `filter-pill` (interaktif untuk tab tanggal dan filter status).
* **State:** `static` (informasi), serta `default` / `selected` (`--color-primary` solid + teks `--color-text-primary`) / `focus-visible` untuk varian `filter-pill`.
* **WAJIB:** Mempertahankan rasio kontras teks minimal `4.5:1` terhadap warna latar kapsulnya.
* **DILARANG:** Menggunakan ukuran font di bawah `14px` atau warna status yang tertukar maknanya.

### Table
* **Anatomi:** Wadah dalam `Card` (khusus panel admin), header baris redup dengan teks `--color-text-muted`, garis pemisah horizontal tipis `1px solid --color-border-subtle` antarbaris, sel data dengan *padding* rapat (`12px 16px`), dan kolom aksi di ujung kanan.
* **Varian:** `admin-orders` (pesanan per jadwal), `admin-movies` (daftar film), `admin-schedules` (daftar jadwal).
* **State:** `default`, `row-hover` (latar tipis `--color-surface-elevated`), `loading` (skeleton baris), `empty` (memanggil `StateMessage`), `locked-action` (tombol nonaktif dengan teks alasan, mis. `Terkunci`).
* **WAJIB:** Menghilangkan garis vertikal antarkolom, menggunakan `tabular-nums` pada kode booking/waktu, dan beradaptasi pada mobile `390px` menjadi tumpukan kartu baris padat atau kontainer gulir yang rapi tanpa merusak halaman.
* **DILARANG:** Memaksakan tampilan *desktop-only* yang terpotong di mobile atau menambahkan kolom laporan/harga di luar cakupan MVP.

### Toast
* **Anatomi:** Notifikasi melayang ringkas berlatar `--color-surface-elevated`, border `1px solid --color-border-strong`, garis indikator vertikal `4px` di sisi kiri sesuai warna status, ikon SVG garis, teks singkat 1–2 baris, dan tombol tutup opsional.
* **Varian:** `success`, `error`, `warning`, `info`.
* **State:** `entering` (`240ms`, `--ease-standard`), `visible`, `dismissing`.
* **WAJIB:** Muncul di sudut kanan atas pada desktop dan di bagian bawah (di atas area aman) pada mobile dengan `--shadow-floating` serta atribut `role="status"` atau `aria-live="polite"`; menghormati `prefers-reduced-motion: reduce`.
* **DILARANG:** Menghalangi tombol aksi utama (seperti tombol `Pesan Kursi`) atau menggantikan pesan error validasi form yang seharusnya tampil *inline*.

### SeatMap
* **Anatomi:** Wadah `Card` terpusat berisi lengkungan visual **LAYAR BIOSKOP** dengan pendar `--glow-screen`, legenda 3 status (non-warna), grid kursi berbasis dimensi studio dari database (acuan Studio 2: baris `A–F` × nomor `1–8` dengan lorong tengah antara nomor 4 dan 5; juga mendukung Studio 1: baris `A–H` × nomor `1–10`), label huruf baris di kiri, dan label nomor kolom di atas.
* **Varian:** Menyesuaikan otomatis berdasarkan `jumlah_baris` dan `jumlah_kolom` studio tetap pada jadwal terpilih.
* **State:** `available`, `selected`, `occupied`, `quota-locked` (kursi tersedia yang terkunci otomatis saat total pilihan + kursi `Ditahan` milik akun pada jadwal ini mencapai 4), `loading`, `error`.
* **WAJIB:** Lihat spesifikasi rinci pada **Bagian 4 (SeatMap)** di bawah.
* **DILARANG:** Membedakan status kursi hanya lewat warna, memperbolehkan lebih dari 4 kursi per akun per jadwal, atau menampilkan harga/total bayar.

### StateMessage
* **Anatomi:** Blok terpusat (lebar maks `480px`) di dalam `Card` atau area kosong kontainer, berisi ikon SVG garis `48px` (`stroke-width: 1.75px`), judul (`H2`), deskripsi singkat 1–2 kalimat (`--color-text-muted`), dan maksimal 2 tombol aksi pemulihan (`primary` + opsional `secondary`).
* **Varian:** `loading` (skeleton menyerupai tata letak target + `aria-live="polite"`), `empty`, `error`, `forbidden` (akses non-admin ke rute admin), dan `not-found` (404).
* **State:** `default` dan `retrying` (saat tombol `Coba Lagi` / `Muat Ulang` sedang memproses).
* **WAJIB:** Selalu menyediakan teks Bahasa Indonesia yang jelas serta minimal satu tombol aksi pemulihan agar pengguna tidak menemui jalan buntu.
* **DILARANG:** Menampilkan kode error mentah dari server/database atau membiarkan halaman kosong tanpa penjelasan.

---

## 4. Spesifikasi Khusus SeatMap

* **Rupa Status Kursi (Multimodal / Tidak Hanya Warna):**
  * **Tersedia:** Bentuk siluet kubah atas membulat (`border-radius: 6px 6px 4px 4px`), latar `--color-seat-available-bg` (`#1D274D`), border solid `1.5px solid --color-seat-available-border` (`#4A63C9`), menampilkan teks kode kursi (misal `C4`) tanpa ikon.
  * **Dipilih:** Latar solid `--color-seat-selected-bg` (`#3F5CE0`) dengan pendar tipis, teks `--color-text-primary` (`#F4F6FB`) tebal, wajib menampilkan **ikon SVG centang (`✓`)** bersanding dengan atau di atas kode kursi.
  * **Terisi:** Latar `--color-seat-occupied-bg` (`#222634`) dengan opasitas `45%`, pola **arsir garis miring halus (*diagonal hatch* via CSS `repeating-linear-gradient`)**, serta **ikon SVG silang (`×`)** di tengah kursi (`disabled`).
  * **Terkunci Kuota (Maksimal 4):** Saat total kursi terpilih + kursi berstatus `Ditahan` milik akun yang sama pada jadwal ini mencapai 4, kursi tersedia lainnya berubah menjadi `disabled` (opasitas `40%`, `cursor: not-allowed`) disertai keterangan kuota penuh.
* **Ukuran Area Sentuh & Tata Letak:**
  * Area sentuh tombol kursi wajib **`44 × 44px`** di desktop; pada layar mobile `390px`, ukuran tombol minimal `40–44px` dengan jarak antarkursi `6px–8px` dan kontainer denah mendukung gulir horizontal halus bila jumlah kolom melebihi lebar layar agar target sentuh tidak mengecil di bawah batas aman.
  * Lorong pemisah tengah wajib diberi jarak minimal `16px–24px` (di antara kolom 4 dan 5 untuk Studio 2).
* **Label & Aksesibilitas:**
  * Gunakan elemen `<button type="button">` untuk setiap kursi di dalam wadah `role="region"` berlabel `aria-label="Denah kursi Studio [Nama]"`.
  * Setiap kursi wajib memiliki `aria-label` deskriptif lengkap, misalnya: `"Kursi C4, tersedia"`, `"Kursi C4, dipilih"`, atau `"Kursi C4, sudah terisi"`.
  * Gunakan `aria-pressed="true"` / `"false"` untuk kursi interaktif dan `disabled` + `aria-disabled="true"` untuk kursi terisi atau terkunci kuota.
  * Pastikan urutan tab papan ketik logis per baris (`A1` ke `F8`) dengan cincin fokus jelas (`outline: 2px solid #6C84FF; outline-offset: 2px`).
  * Sediakan `aria-live="polite"` pada ringkasan pilihan agar pembaca layar mengumumkan perubahan jumlah kursi dan batas waktu penahanan.

---

## 5. Layout 9 Layar

1. **Katalog Film (Halaman Utama):** Menampilkan *navbar* lengket, header ringkas dengan tab filter tanggal 3 hari ke depan, dan grid kartu `MovieCard` yang visual dan lega (1 kolom di mobile `390px`, 4 kolom pada grid 12 kolom di desktop `1280px`) lengkap dengan potongan sinopsis, 3 chip jam tayang aktif, dan tombol `Lihat Jadwal`.
2. **Detail Film dan Jadwal:** Menggunakan tata letak 1 kolom di mobile dan 2 kolom asimetris di desktop (4 kolom kiri *sticky* untuk sampul 2:3, judul, durasi, serta sinopsis penuh; 8 kolom kanan untuk tab tanggal, daftar kartu per studio tetap dengan tombol jam tayang aktif/lewat, dan kotak info pembayaran di loket).
3. **Pilih Kursi:** Menyajikan tata letak fokus dan minim distraksi dengan 1 kolom + *sticky bottom summary* di mobile, serta 8 kolom kiri untuk `SeatMap` berpusat di bawah lengkungan layar dan 4 kolom kanan *sticky* di desktop untuk ringkasan pilihan, penghitung kuota maksimal 4 kursi, keterangan tidak ada harga di aplikasi, kotak peringatan batas waktu penahanan, dan tombol `Pesan Kursi`.
4. **Konfirmasi Booking:** Menggunakan satu kartu terpusat (`max-width: 600px` di desktop) yang menyorot badge status `Ditahan`, blok kode booking acak besar dengan tombol `Salin Kode`, kotak batas waktu penahanan 60 menit/jam tayang, rincian jadwal serta email akun, instruksi pembayaran dan pembatalan di loket, serta tombol navigasi ke `Pesanan Saya` atau beranda.
5. **Login dan Daftar:** Menampilkan kartu autentikasi terpusat (`max-width: 440px`) dengan *tab switch* `Masuk` dan `Daftar`, formulir email + kata sandi (ditambah nama lengkap saat daftar yang langsung aktif tanpa verifikasi email dan tanpa tautan lupa kata sandi), serta pengalihan otomatis sesuai peran penonton atau admin.
6. **Riwayat Booking Saya (Pesanan Saya):** Menyajikan header dengan info email akun aktif, *pill* filter status (`Semua`, `Ditahan`, `Terkonfirmasi`, `Batal`), banner aturan konfirmasi/pembatalan loket, serta daftar kartu pesanan kronologis (1 kolom di mobile, 2 kolom di desktop `max-width: 960px`) berisi kode booking + tombol salin, status, kursi, dan strip sisa waktu khusus pesanan `Ditahan` tanpa tombol batal mandiri maupun QR code.
7. **Admin: Ringkasan dan Daftar Booking:** Menerapkan tata letak padat data dengan *sidebar* kiri `240px` di desktop (tab gulir atas di mobile) untuk berpindah antar menu `Daftar Pesanan`, `Kelola Film`, dan `Kelola Jadwal`; tampilan utama memuat dropdown wajib pilih jadwal, pencarian kode booking, 4 kartu metrik operasional kursi, tabel pesanan berkolom kode/email/kursi/status/sisa waktu/aksi, serta modal verifikasi pencocokan kode booking dan email sebelum konfirmasi atau pembatalan.
8. **Admin: Form Tambah Film (dan Jadwal):** Mempertahankan *shell* navigasi admin dengan kartu formulir terpusat (`max-width: 720px`) untuk mode tambah maupun ubah data; form film menampung judul, durasi menit, dan sinopsis, sedangkan form jadwal menampung pilihan film, studio tetap, tanggal, jam mulai, perkiraan jam selesai otomatis, serta blok validasi tegas untuk bentrok studio dan kunci pesanan aktif tanpa tombol hapus jadwal.
9. **State Khusus (Loading, Kosong, Error, Halaman Tidak Ditemukan):** Menampilkan *skeleton shimmer* sesuai bentuk layar saat memuat data, atau kartu `StateMessage` terpusat (`max-width: 480px`) dengan ikon garis, judul, deskripsi Bahasa Indonesia, dan tombol pemulihan untuk kondisi kosong, gangguan jaringan, akses ditolak (non-admin), serta rute 404.

---

## 6. Daftar DILARANG

* **DILARANG** memakai warna HEX/RGB/Tailwind di luar daftar token `:root` pada Bagian 2.
* **DILARANG** menambahkan gradien, efek neon, *glassmorphism* berat, atau animasi berlebih yang tidak tercantum di DNA (pendar hanya untuk layar bioskop/fokus kartu login, gradien hanya `--overlay-poster` dan aksen halus kotak kode booking).
* **DILARANG** menggunakan emoji sebagai pengganti ikon UI; seluruh ikon wajib menggunakan SVG garis seragam (`stroke-width: 1.75px`, ujung membulat).
* **DILARANG** menetapkan ukuran font di bawah `14px` (`0.875rem`) pada teks, label, badge, maupun sel tabel.
* **DILARANG** memakai kombinasi warna teks dan latar dengan rasio kontras di bawah `4.5:1` (standar WCAG AA).
* **DILARANG** menumpuk bayangan (*drop shadow*) berlebihan pada kartu, tombol, atau tabel; gunakan `--shadow-floating` hanya untuk modal, *dropdown*, dan *toast*.
* **DILARANG** menambahkan elemen dekoratif tanpa fungsi (seperti ilustrasi kompleks, pola latar ramai, *divider* ornamental, atau widget statistik/harga/QR code di luar cakupan MVP).

---

## 7. Checklist QA Desain (Verifikasi Visual)

1. **Konsistensi Tema Gelap:** Seluruh layar berdiri di atas latar `#0B0D12` dengan kartu `#141720` dan garis batas tipis `#242938`, tanpa ada latar putih terang atau bayangan hitam pekat yang mengganggu.
2. **Keterbacaan & Ukuran Font:** Tidak ada teks, badge, jam tayang, atau header tabel yang berukuran di bawah `14px` dan semua teks redup (`#9CA3B8`) tetap terbaca jelas terhadap latar gelapnya.
3. **Diferensiasi Kursi Tanpa Warna:** Pada layar `Pilih Kursi`, kursi tersedia (border terang kosong), dipilih (ikon centang `✓` + latar solid), dan terisi (arsir diagonal + ikon silang `×`) langsung bisa dibedakan bahkan jika layar dilihat dalam mode hitam-putih.
4. **Kenyamanan Sentuh Mobile (`390px`):** Tidak ada gulir horizontal liar pada halaman utama, tombol dan input terasa lega disentuh (`≥ 44px`), dan *bottom summary* di layar kursi tidak menutupi tombol aksi utama.
5. **Kepatuhan Konten MVP:** Tidak ada harga tiket, total bayar, tombol pembayaran online, QR code, tombol batal mandiri milik penonton, tombol hapus jadwal admin, atau tautan lupa kata sandi yang muncul di layar mana pun.
6. **Kejelasan Batas Waktu Penahanan:** Sebelum menekan `Pesan Kursi` dan setelah booking dibuat, kotak peringatan kuning lembut (`#F5B73B`) yang menyatakan batas waktu 60 menit/jam tayang terlihat menonjol pada pandangan pertama.
7. **Kepadatan Sesuai Peran Layar:** Katalog film terlihat lapang (maksimal 4 kartu sejajar di `1280px`), peta kursi terpusat dan tenang, sementara tabel pesanan admin menampilkan kode booking, email akun, kursi, sisa waktu, dan tombol aksi secara ringkas dalam satu baris.
8. **Kualitas Ikon & Fokus Papan Ketik:** Semua ikon memakai gaya garis tipis yang seragam (nol emoji), dan menekan tombol `Tab` selalu memunculkan cincin fokus biru terang (`#6C84FF`) yang jelas di tiap elemen interaktif.
9. **Kejelasan Overlay Poster:** Judul atau badge durasi di atas area sampul film rasio `2:3` selalu memiliki gradasi gelap di belakangnya sehingga tidak pernah bertabrakan secara visual.
10. **Kelengkapan State Non-Ideal:** Kondisi loading menampilkan *skeleton* tanpa lompatan layout, sementara kondisi kosong, error, akses terlarang, dan 404 menampilkan pesan Bahasa Indonesia yang rapi dengan tombol kembali/coba lagi yang berfungsi.