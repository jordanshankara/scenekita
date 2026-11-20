-- =====================================================================
-- SceneKita v1 - Skema database (Supabase / PostgreSQL)
-- Jalankan seluruh file ini sekali di Supabase SQL Editor.
-- Pengguna memakai Supabase Auth (auth.users), tidak ada tabel users sendiri.
--   * Nama penonton   : disimpan di user_metadata ("nama") saat signUp
--   * Peran admin     : disimpan di app_metadata ("role": "admin")
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

create type public.status_pesanan as enum ('ditahan', 'terkonfirmasi', 'batal');

-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

create table public.film (
  id           uuid primary key default gen_random_uuid(),
  judul        text not null,
  durasi_menit int  not null check (durasi_menit > 0),
  sinopsis     text,
  dibuat_at    timestamptz not null default now()
);

-- Studio dan layout kursi bersifat tetap (R7), diisi lewat seed.
create table public.studio (
  id           uuid primary key default gen_random_uuid(),
  nama         text not null unique,
  jumlah_baris int  not null check (jumlah_baris between 1 and 26),
  jumlah_kolom int  not null check (jumlah_kolom > 0)
);

-- Tiap kursi fisik disimpan sebagai satu baris, mis. studio 1 -> A1..H10.
create table public.kursi (
  id        uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studio (id) on delete restrict,
  baris     text not null,
  kolom     int  not null check (kolom > 0),
  kode      text not null,
  unique (studio_id, baris, kolom),
  unique (id, studio_id)
);

-- Tidak ada hapus jadwal di v1 (rekomendasi 4).
-- Jadwal di studio yang sama tidak boleh tumpang tindih (rekomendasi 7).
create table public.jadwal (
  id        uuid primary key default gen_random_uuid(),
  film_id   uuid not null references public.film (id)   on delete restrict,
  studio_id uuid not null references public.studio (id) on delete restrict,
  mulai     timestamptz not null,
  selesai   timestamptz not null,  -- diisi otomatis: mulai + durasi film
  constraint jadwal_waktu_valid check (selesai > mulai),
  constraint jadwal_id_studio_uk unique (id, studio_id),
  constraint jadwal_tidak_bentrok
    exclude using gist (studio_id with =, tstzrange(mulai, selesai) with &&)
);

create table public.pesanan (
  id             uuid primary key default gen_random_uuid(),
  kode_booking   text not null unique,
  user_id        uuid not null references auth.users (id) on delete restrict,
  jadwal_id      uuid not null references public.jadwal (id) on delete restrict,
  status         public.status_pesanan not null default 'ditahan',
  batas_waktu    timestamptz not null,
  dibuat_at      timestamptz not null default now(),
  dikonfirmasi_at timestamptz,
  dibatalkan_at  timestamptz,
  alasan_batal   text check (alasan_batal in ('kedaluwarsa', 'admin')),
  constraint pesanan_batal_konsisten
    check ((status = 'batal') = (alasan_batal is not null and dibatalkan_at is not null)),
  unique (id, jadwal_id)
);

-- Satu baris per kursi per pesanan.
-- Indeks unik parsial di bawah menjamin satu kursi di satu jadwal
-- tidak pernah dipegang dua pesanan aktif (R1), walau dua orang menekan
-- Pesan bersamaan (rekomendasi 2).
create table public.pesanan_kursi (
  id         uuid primary key default gen_random_uuid(),
  pesanan_id uuid not null,
  jadwal_id  uuid not null,
  studio_id  uuid not null,
  kursi_id   uuid not null,
  aktif      boolean not null default true,
  unique (pesanan_id, kursi_id),
  foreign key (pesanan_id, jadwal_id) references public.pesanan (id, jadwal_id),
  foreign key (jadwal_id, studio_id)  references public.jadwal (id, studio_id),
  foreign key (kursi_id, studio_id)   references public.kursi (id, studio_id)
);

create unique index pesanan_kursi_aktif_uk
  on public.pesanan_kursi (jadwal_id, kursi_id) where aktif;

create index pesanan_user_idx        on public.pesanan (user_id);
create index pesanan_jadwal_idx      on public.pesanan (jadwal_id, status);
create index pesanan_kedaluwarsa_idx on public.pesanan (batas_waktu) where status = 'ditahan';
create index jadwal_mulai_idx        on public.jadwal (mulai);
create index pesanan_kursi_pesanan_idx on public.pesanan_kursi (pesanan_id);

-- ---------------------------------------------------------------------
-- 2. FUNGSI BANTU
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- Kode booking acak, tidak berurutan (rekomendasi 6).
create or replace function public.buat_kode_booking()
returns text
language sql
volatile
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
$$;

-- Batalkan otomatis pesanan Ditahan yang batas waktunya habis (R4).
create or replace function public.lepas_pesanan_kedaluwarsa(p_jadwal_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jumlah int;
begin
  with x as (
    update public.pesanan
       set status = 'batal',
           alasan_batal = 'kedaluwarsa',
           dibatalkan_at = now()
     where status = 'ditahan'
       and batas_waktu <= now()
       and (p_jadwal_id is null or jadwal_id = p_jadwal_id)
    returning 1
  )
  select count(*) into v_jumlah from x;
  return v_jumlah;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. TRIGGER
-- ---------------------------------------------------------------------

-- jadwal.selesai = mulai + durasi film
create or replace function public.trg_jadwal_set_selesai()
returns trigger
language plpgsql
as $$
declare
  v_durasi int;
begin
  select durasi_menit into v_durasi from public.film where id = new.film_id;
  new.selesai := new.mulai + make_interval(mins => v_durasi);
  return new;
end;
$$;

create trigger jadwal_set_selesai
  before insert or update of film_id, mulai on public.jadwal
  for each row execute function public.trg_jadwal_set_selesai();

-- R10: jadwal dengan pesanan aktif tidak boleh diubah. Jadwal tidak boleh dihapus.
create or replace function public.trg_jadwal_cegah_ubah()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Jadwal tidak dapat dihapus';
  end if;

  if (new.film_id, new.studio_id, new.mulai) is not distinct from (old.film_id, old.studio_id, old.mulai) then
    return new;
  end if;

  perform public.lepas_pesanan_kedaluwarsa(old.id);

  if exists (
    select 1 from public.pesanan
     where jadwal_id = old.id and status in ('ditahan', 'terkonfirmasi')
  ) then
    raise exception 'Jadwal masih punya pesanan aktif, batalkan pesanannya dulu';
  end if;

  return new;
end;
$$;

create trigger jadwal_cegah_ubah
  before update or delete on public.jadwal
  for each row execute function public.trg_jadwal_cegah_ubah();

-- Mesin status pesanan + lepas kursi saat batal.
--   ditahan -> terkonfirmasi | batal
--   terkonfirmasi -> batal
--   batal -> (final)
create or replace function public.trg_pesanan_transisi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if not (
    (old.status = 'ditahan'       and new.status in ('terkonfirmasi', 'batal')) or
    (old.status = 'terkonfirmasi' and new.status = 'batal')
  ) then
    raise exception 'Perubahan status % ke % tidak diizinkan', old.status, new.status;
  end if;

  if new.status = 'batal' then
    update public.pesanan_kursi set aktif = false where pesanan_id = new.id;
  end if;

  return new;
end;
$$;

create trigger pesanan_transisi
  before update of status on public.pesanan
  for each row execute function public.trg_pesanan_transisi();

-- ---------------------------------------------------------------------
-- 4. FUNGSI RPC (dipanggil dari aplikasi)
-- ---------------------------------------------------------------------

-- Penonton: buat pesanan (F4). Satu langkah atomik.
create or replace function public.buat_pesanan(p_jadwal_id uuid, p_kursi_ids uuid[])
returns public.pesanan
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_jadwal  public.jadwal;
  v_kursi   uuid[];
  v_jumlah  int;
  v_sedang  int;
  v_kode    text;
  v_pesanan public.pesanan;
begin
  if v_uid is null then
    raise exception 'Harus login untuk memesan';                       -- R3
  end if;

  select array_agg(distinct k) into v_kursi from unnest(p_kursi_ids) k;
  v_jumlah := coalesce(array_length(v_kursi, 1), 0);
  if v_jumlah < 1 or v_jumlah > 4 then
    raise exception 'Pilih 1 sampai 4 kursi';                          -- R2
  end if;

  select * into v_jadwal from public.jadwal where id = p_jadwal_id;
  if not found then
    raise exception 'Jadwal tidak ditemukan';
  end if;
  if v_jadwal.mulai <= now() then
    raise exception 'Jadwal sudah lewat, tidak bisa dipesan';          -- R8
  end if;

  -- Cegah dua permintaan bersamaan dari akun yang sama melewati batas.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || p_jadwal_id::text, 0));

  -- Lepas kursi dari pesanan yang sudah kedaluwarsa sebelum mengecek.
  perform public.lepas_pesanan_kedaluwarsa(p_jadwal_id);

  -- Rekomendasi 3: total kursi berstatus Ditahan per akun per jadwal maksimal 4.
  select count(*) into v_sedang
    from public.pesanan_kursi pk
    join public.pesanan p on p.id = pk.pesanan_id
   where p.user_id = v_uid
     and p.jadwal_id = p_jadwal_id
     and p.status = 'ditahan'
     and pk.aktif;
  if v_sedang + v_jumlah > 4 then
    raise exception 'Total kursi berstatus Ditahan untuk jadwal ini maksimal 4';
  end if;

  loop
    v_kode := public.buat_kode_booking();
    exit when not exists (select 1 from public.pesanan where kode_booking = v_kode);
  end loop;

  insert into public.pesanan (kode_booking, user_id, jadwal_id, batas_waktu)
  values (v_kode, v_uid, p_jadwal_id,
          least(now() + interval '60 minutes', v_jadwal.mulai))        -- R4
  returning * into v_pesanan;

  begin
    insert into public.pesanan_kursi (pesanan_id, jadwal_id, studio_id, kursi_id)
    select v_pesanan.id, p_jadwal_id, v_jadwal.studio_id, k from unnest(v_kursi) k;
  exception
    when unique_violation then
      raise exception 'Pesanan gagal: ada kursi yang baru saja dipesan orang lain';   -- R1
    when foreign_key_violation then
      raise exception 'Pesanan gagal: kursi tidak valid untuk jadwal ini';
  end;

  return v_pesanan;
end;
$$;

-- Penonton: peta kursi per jadwal (F3). Tidak membuka identitas pemesan.
create or replace function public.peta_kursi(p_jadwal_id uuid)
returns table (kursi_id uuid, baris text, kolom int, kode text, terisi boolean)
language sql
stable
security definer
set search_path = public
as $$
  select k.id, k.baris, k.kolom, k.kode,
         exists (
           select 1
             from public.pesanan_kursi pk
             join public.pesanan p on p.id = pk.pesanan_id
            where pk.jadwal_id = j.id
              and pk.kursi_id = k.id
              and pk.aktif
              and (p.status = 'terkonfirmasi'
                   or (p.status = 'ditahan' and p.batas_waktu > now()))
         ) as terisi
    from public.jadwal j
    join public.kursi k on k.studio_id = j.studio_id
   where j.id = p_jadwal_id
   order by k.baris, k.kolom
$$;

-- Admin: konfirmasi pesanan (hanya status Ditahan dan belum lewat batas waktu).
create or replace function public.konfirmasi_pesanan(p_pesanan_id uuid)
returns public.pesanan
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.pesanan;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengonfirmasi pesanan';    -- R6
  end if;

  select * into v_p from public.pesanan where id = p_pesanan_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;
  if v_p.status = 'batal' then
    raise exception 'Pesanan sudah batal';
  end if;
  if v_p.status = 'terkonfirmasi' then
    raise exception 'Pesanan sudah terkonfirmasi';
  end if;
  if v_p.batas_waktu <= now() then
    raise exception 'Pesanan sudah batal karena batas waktu habis';
  end if;

  update public.pesanan
     set status = 'terkonfirmasi', dikonfirmasi_at = now()
   where id = p_pesanan_id
  returning * into v_p;

  return v_p;
end;
$$;

-- Admin: batalkan pesanan. Pesanan Terkonfirmasi hanya bisa dibatalkan
-- sebelum jam tayang (rekomendasi 5).
create or replace function public.batalkan_pesanan(p_pesanan_id uuid)
returns public.pesanan
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p     public.pesanan;
  v_mulai timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh membatalkan pesanan';      -- R6, R9
  end if;

  select * into v_p from public.pesanan where id = p_pesanan_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;
  if v_p.status = 'batal' then
    raise exception 'Pesanan sudah batal';
  end if;

  select mulai into v_mulai from public.jadwal where id = v_p.jadwal_id;
  if v_p.status = 'terkonfirmasi' and v_mulai <= now() then
    raise exception 'Pesanan terkonfirmasi tidak bisa dibatalkan setelah jam tayang';
  end if;

  update public.pesanan
     set status = 'batal', alasan_batal = 'admin', dibatalkan_at = now()
   where id = p_pesanan_id
  returning * into v_p;

  return v_p;
end;
$$;

-- Admin: daftar/cari pesanan (F6). Menampilkan nama, email, kursi, dan sisa waktu
-- supaya admin bisa memverifikasi kode booking + email di loket (rekomendasi 1 dan 6).
create or replace function public.pesanan_admin(p_jadwal_id uuid default null, p_kode text default null)
returns table (
  pesanan_id   uuid,
  kode_booking text,
  status       public.status_pesanan,
  batas_waktu  timestamptz,
  sisa_detik   int,
  jadwal_id    uuid,
  nama         text,
  email        text,
  kursi        text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin';
  end if;

  return query
  select p.id,
         p.kode_booking,
         p.status,
         p.batas_waktu,
         case when p.status = 'ditahan'
              then greatest(0, extract(epoch from (p.batas_waktu - now()))::int)
         end,
         p.jadwal_id,
         (u.raw_user_meta_data ->> 'nama')::text,
         u.email::text,
         (select string_agg(k.kode, ', ' order by k.baris, k.kolom)
            from public.pesanan_kursi pk
            join public.kursi k on k.id = pk.kursi_id
           where pk.pesanan_id = p.id)
    from public.pesanan p
    join auth.users u on u.id = p.user_id
   where (p_jadwal_id is null or p.jadwal_id = p_jadwal_id)
     and (p_kode is null or p.kode_booking = upper(p_kode))
   order by p.dibuat_at desc;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. HAK AKSES FUNGSI
-- ---------------------------------------------------------------------

revoke all on function public.buat_kode_booking()                    from public, anon, authenticated;
revoke all on function public.lepas_pesanan_kedaluwarsa(uuid)        from public, anon, authenticated;
revoke all on function public.trg_jadwal_set_selesai()               from public, anon, authenticated;
revoke all on function public.trg_jadwal_cegah_ubah()                from public, anon, authenticated;
revoke all on function public.trg_pesanan_transisi()                 from public, anon, authenticated;

revoke all on function public.is_admin()                             from public, anon, authenticated;
revoke all on function public.buat_pesanan(uuid, uuid[])             from public, anon, authenticated;
revoke all on function public.peta_kursi(uuid)                       from public, anon, authenticated;
revoke all on function public.konfirmasi_pesanan(uuid)               from public, anon, authenticated;
revoke all on function public.batalkan_pesanan(uuid)                 from public, anon, authenticated;
revoke all on function public.pesanan_admin(uuid, text)              from public, anon, authenticated;

grant execute on function public.is_admin()                          to authenticated;
grant execute on function public.buat_pesanan(uuid, uuid[])          to authenticated;
grant execute on function public.peta_kursi(uuid)                    to authenticated;
grant execute on function public.konfirmasi_pesanan(uuid)            to authenticated;
grant execute on function public.batalkan_pesanan(uuid)              to authenticated;
grant execute on function public.pesanan_admin(uuid, text)           to authenticated;

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.film          enable row level security;
alter table public.studio        enable row level security;
alter table public.kursi         enable row level security;
alter table public.jadwal        enable row level security;
alter table public.pesanan       enable row level security;
alter table public.pesanan_kursi enable row level security;

-- Baca: hanya pengguna yang sudah login.
create policy film_baca   on public.film   for select to authenticated using (true);
create policy studio_baca on public.studio for select to authenticated using (true);
create policy kursi_baca  on public.kursi  for select to authenticated using (true);
create policy jadwal_baca on public.jadwal for select to authenticated using (true);

-- Tulis film dan jadwal: hanya admin, tanpa hapus (R6, rekomendasi 4).
create policy film_tambah on public.film for insert to authenticated
  with check (public.is_admin());
create policy film_ubah on public.film for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy jadwal_tambah on public.jadwal for insert to authenticated
  with check (public.is_admin());
create policy jadwal_ubah on public.jadwal for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Pesanan: penonton hanya melihat miliknya, admin melihat semua.
-- Tidak ada policy insert/update: semua perubahan lewat fungsi RPC di atas.
create policy pesanan_baca on public.pesanan for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy pesanan_kursi_baca on public.pesanan_kursi for select to authenticated
  using (exists (
    select 1 from public.pesanan p
     where p.id = pesanan_kursi.pesanan_id
       and (p.user_id = auth.uid() or public.is_admin())
  ));

-- Cabut hak langsung yang tidak dipakai klien.
revoke all on all tables in schema public from anon;
revoke delete, truncate on all tables in schema public from authenticated;
revoke insert, update on public.pesanan, public.pesanan_kursi from authenticated;
revoke insert, update on public.studio, public.kursi from authenticated;

-- ---------------------------------------------------------------------
-- 7. DATA CONTOH (seed)
-- ---------------------------------------------------------------------

insert into public.studio (nama, jumlah_baris, jumlah_kolom) values
  ('Studio 1', 8, 10),   -- 80 kursi
  ('Studio 2', 6, 8);    -- 48 kursi

insert into public.kursi (studio_id, baris, kolom, kode)
select s.id, chr(64 + r), c, chr(64 + r) || c
  from public.studio s
 cross join lateral generate_series(1, s.jumlah_baris) r
 cross join lateral generate_series(1, s.jumlah_kolom) c;

insert into public.film (judul, durasi_menit, sinopsis) values
  ('Senja di Kota Tua',      105, 'Drama ringan tentang dua sahabat lama yang bertemu kembali.'),
  ('Misi Rahasia Nusantara', 120, 'Petualangan sekelompok penjelajah mencari peta yang hilang.'),
  ('Tawa Bersama',            95, 'Komedi keluarga menjelang hari raya.'),
  ('Bayangan Malam',         110, 'Thriller misteri di sebuah kota kecil.');

-- 3 jadwal per studio per hari, untuk 3 hari ke depan (jam Asia/Jakarta).
with hari as (
  select ((now() at time zone 'Asia/Jakarta')::date + d) as tgl
    from generate_series(1, 3) d
),
slot (studio_nama, judul, jam) as (
  values
    ('Studio 1', 'Senja di Kota Tua',      time '13:00'),
    ('Studio 1', 'Misi Rahasia Nusantara', time '16:00'),
    ('Studio 1', 'Senja di Kota Tua',      time '19:00'),
    ('Studio 2', 'Tawa Bersama',           time '13:00'),
    ('Studio 2', 'Bayangan Malam',         time '16:00'),
    ('Studio 2', 'Tawa Bersama',           time '19:00')
)
insert into public.jadwal (film_id, studio_id, mulai)
select f.id, s.id, ((h.tgl + sl.jam) at time zone 'Asia/Jakarta')
  from hari h
 cross join slot sl
  join public.studio s on s.nama = sl.studio_nama
  join public.film   f on f.judul = sl.judul;

-- ---------------------------------------------------------------------
-- 8. LANGKAH MANUAL SETELAH SKRIP INI
-- ---------------------------------------------------------------------
-- a) Buat akun admin di Supabase > Authentication > Users, lalu jadikan admin:
--
--    update auth.users
--       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--     where email = 'ADMIN@EMAIL.COM';
--
--    Admin harus login ulang agar peran terbaca. Reset password penonton
--    dilakukan manual lewat Authentication > Users.
--
-- b) Pembatalan otomatis tiap menit (aktifkan extension pg_cron di
--    Database > Extensions, lalu jalankan):
--
--    select cron.schedule(
--      'lepas-pesanan-kedaluwarsa', '* * * * *',
--      $$ select public.lepas_pesanan_kedaluwarsa() $$
--    );
--
--    Tanpa cron pun aturan tetap aman: buat_pesanan, konfirmasi_pesanan, dan
--    peta_kursi sudah memperlakukan pesanan kedaluwarsa sebagai batal.
