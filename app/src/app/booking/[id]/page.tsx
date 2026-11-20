import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StateMessage } from "@/components/StateMessage";
import { BookingConfirmationCard } from "@/components/BookingConfirmationCard";

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

export default async function KonfirmasiBookingPage({ params }: BookingPageProps) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/login?redirect=/booking/${id}`);
  }

  const supabase = await createClient();

  console.log(`[Konfirmasi Booking] Mengambil pesanan id: ${id} untuk user: ${user.email}`);

  // 1. Ambil data pesanan utama (sesuai DATABASE-SUPABASE.md Bagian 7: gunakan query terpisah untuk relasi foreign key komposit)
  const { data: pesanan, error: errPesanan } = await supabase
    .from("pesanan")
    .select("id, kode_booking, status, batas_waktu, user_id, jadwal_id")
    .eq("id", id)
    .single();

  if (errPesanan || !pesanan) {
    console.error("[Konfirmasi Booking] Gagal memuat pesanan:", errPesanan);
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
            title="Pesanan Tidak Ditemukan"
            description="Pesanan tidak ditemukan atau Anda tidak memiliki akses ke pesanan ini."
            action={{
              label: "Ke Beranda",
              href: "/",
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  // 2. Ambil data jadwal, film, dan studio
  const { data: jadwal, error: errJadwal } = await supabase
    .from("jadwal")
    .select(`
      id,
      mulai,
      selesai,
      film:film_id (
        id,
        judul
      ),
      studio:studio_id (
        id,
        nama
      )
    `)
    .eq("id", pesanan.jadwal_id)
    .single();

  if (errJadwal) {
    console.error("[Konfirmasi Booking] Gagal memuat jadwal:", errJadwal);
  }

  // 3. Ambil kursi_id dari pesanan_kursi
  const { data: pesananKursiList, error: errPK } = await supabase
    .from("pesanan_kursi")
    .select("kursi_id")
    .eq("pesanan_id", id);

  if (errPK) {
    console.error("[Konfirmasi Booking] Gagal memuat pesanan_kursi:", errPK);
  }

  const kursiIds = (pesananKursiList || []).map((pk: any) => pk.kursi_id);

  // 4. Ambil kode kursi dari tabel kursi
  let kursiList: string[] = [];
  if (kursiIds.length > 0) {
    const { data: kursiRows, error: errKursi } = await supabase
      .from("kursi")
      .select("id, kode, baris, kolom")
      .in("id", kursiIds);

    if (errKursi) {
      console.error("[Konfirmasi Booking] Gagal memuat kursi:", errKursi);
    } else if (kursiRows) {
      kursiList = kursiRows
        .sort((a: any, b: any) => {
          if (a.baris === b.baris) return a.kolom - b.kolom;
          return a.baris.localeCompare(b.baris);
        })
        .map((k: any) => k.kode);
    }
  }

  const filmData = Array.isArray(jadwal?.film) ? jadwal?.film[0] : jadwal?.film;
  const studioData = Array.isArray(jadwal?.studio) ? jadwal?.studio[0] : jadwal?.studio;

  console.log(`[Konfirmasi Booking Sukses] Kode: ${pesanan.kode_booking}, Kursi: ${kursiList.join(", ")}`);

  return (
    <div
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--space-8) var(--gutter-mobile) var(--space-16)",
      }}
    >
      <BookingConfirmationCard
        kodeBooking={pesanan.kode_booking}
        status={pesanan.status}
        batasWaktu={pesanan.batas_waktu}
        filmJudul={filmData?.judul || "Film"}
        studioNama={studioData?.nama || "Studio"}
        jamMulai={jadwal?.mulai || ""}
        jamSelesai={jadwal?.selesai || ""}
        kursiList={kursiList}
        userEmail={user.email || ""}
      />
    </div>
  );
}
