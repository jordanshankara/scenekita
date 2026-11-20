export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StateMessage } from "@/components/StateMessage";
import { BookingForm } from "@/components/BookingForm";
import { KursiData } from "@/components/SeatMap";
import { isJadwalLewat, formatTanggalLengkap, formatJam } from "@/lib/date";

interface KursiPageProps {
  params: Promise<{ id: string }>;
}

export default async function PilihKursiPage({ params }: KursiPageProps) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/login?redirect=/jadwal/${id}/kursi`);
  }

  const supabase = await createClient();

  // Query jadwal penayangan beserta film dan studio
  const { data: jadwal, error: errJadwal } = await supabase
    .from("jadwal")
    .select(`
      id,
      mulai,
      selesai,
      film:film_id (
        id,
        judul,
        durasi_menit
      ),
      studio:studio_id (
        id,
        nama,
        jumlah_baris,
        jumlah_kolom
      )
    `)
    .eq("id", id)
    .single();

  if (errJadwal || !jadwal) {
    return (
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "var(--space-8) var(--gutter-mobile)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-8)",
          }}
        >
          <StateMessage
            type="not-found"
            title="Jadwal Tidak Ditemukan"
            description="Jadwal penayangan yang Anda pilih tidak ditemukan."
            action={{
              label: "Kembali ke Beranda",
              href: "/",
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  // Cek jika jadwal sudah lewat (R8)
  if (isJadwalLewat(jadwal.mulai)) {
    const filmData = Array.isArray(jadwal.film) ? jadwal.film[0] : jadwal.film;
    return (
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "var(--space-8) var(--gutter-mobile)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-8)",
          }}
        >
          <StateMessage
            type="error"
            title="Jadwal Sudah Lewat"
            description="Penayangan film pada jam ini sudah lewat dan tidak dapat dipesan lagi."
            action={{
              label: "Lihat Jadwal Lain",
              href: filmData?.id ? `/film/${filmData.id}` : "/",
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  // Panggil RPC peta_kursi (F3)
  const { data: rawKursi, error: errKursi } = await supabase.rpc("peta_kursi", {
    p_jadwal_id: id,
  });

  if (errKursi) {
    console.error("[Peta Kursi Error]:", errKursi);
    return (
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "var(--space-8) var(--gutter-mobile)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-8)",
          }}
        >
          <StateMessage
            type="error"
            title="Gagal Memuat Denah Kursi"
            description="Terjadi kendala saat memuat denah kursi. Silakan coba beberapa saat lagi."
            action={{
              label: "Muat Ulang",
              href: `/jadwal/${id}/kursi`,
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  // Hitung jumlah kursi berstatus Ditahan milik akun ini pada jadwal ini (R2) secara per-akun
  let kursiSedangDitahan = 0;
  try {
    const { data: pesananUser } = await supabase
      .from("pesanan")
      .select("id")
      .eq("user_id", user.id)
      .eq("jadwal_id", id)
      .eq("status", "ditahan")
      .gt("batas_waktu", new Date().toISOString());

    const pesananIds = (pesananUser || []).map((p: any) => p.id);
    if (pesananIds.length > 0) {
      const { count } = await supabase
        .from("pesanan_kursi")
        .select("id", { count: "exact", head: true })
        .in("pesanan_id", pesananIds)
        .eq("aktif", true);

      kursiSedangDitahan = count || 0;
    }
  } catch (err) {
    console.error("[Cek Kuota Per-Akun Error]:", err);
  }

  const filmData = Array.isArray(jadwal.film) ? jadwal.film[0] : jadwal.film;
  const studioData = Array.isArray(jadwal.studio) ? jadwal.studio[0] : jadwal.studio;

  const kursiList: KursiData[] = rawKursi || [];

  return (
    <div
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--space-6) var(--gutter-mobile) var(--space-16)",
      }}
    >
      {/* Breadcrumb / Navigasi Kembali */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link
          href={filmData?.id ? `/film/${filmData.id}` : "/"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-caption)",
            fontWeight: 500,
            textDecoration: "none",
            height: "var(--touch-min)",
            paddingRight: "var(--space-3)",
            transition: "color var(--duration-fast)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Kembali ke Jadwal {filmData?.judul || "Film"}
        </Link>
      </div>

      {/* Header Halaman */}
      <header style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontSize: "var(--text-h2-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-2)",
          }}
        >
          Pilih Kursi: {filmData?.judul}
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body-sm)",
            margin: 0,
          }}
        >
          {studioData?.nama} • {formatTanggalLengkap(jadwal.mulai)} •{" "}
          <span className="tabular-nums font-semibold text-primary-light">
            {formatJam(jadwal.mulai)} - {formatJam(jadwal.selesai)}
          </span>
        </p>
      </header>

      {/* Denah Kursi dan Ringkasan Pemesanan */}
      <BookingForm
        jadwalId={id}
        filmJudul={filmData?.judul || "Film"}
        filmDurasi={filmData?.durasi_menit || 0}
        studioNama={studioData?.nama || "Studio"}
        jumlahBaris={studioData?.jumlah_baris || 8}
        jumlahKolom={studioData?.jumlah_kolom || 10}
        jamMulai={jadwal.mulai}
        jamSelesai={jadwal.selesai}
        initialKursiList={kursiList}
        kursiSedangDitahan={kursiSedangDitahan}
      />
    </div>
  );
}
