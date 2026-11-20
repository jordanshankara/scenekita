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

  // Query detail pesanan beserta jadwal, film, studio, dan kursi
  const { data: pesanan, error } = await supabase
    .from("pesanan")
    .select(`
      id,
      kode_booking,
      status,
      batas_waktu,
      user_id,
      jadwal:jadwal_id (
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
      ),
      pesanan_kursi (
        id,
        aktif,
        kursi:kursi_id (
          id,
          kode,
          baris,
          kolom
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !pesanan) {
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

  const jadwalData = Array.isArray(pesanan.jadwal) ? pesanan.jadwal[0] : pesanan.jadwal;
  const filmData = Array.isArray(jadwalData?.film) ? jadwalData.film[0] : jadwalData?.film;
  const studioData = Array.isArray(jadwalData?.studio) ? jadwalData.studio[0] : jadwalData?.studio;

  // Ekstrak kode kursi
  const rawKursi = (pesanan.pesanan_kursi || []).map((pk: any) => {
    return Array.isArray(pk.kursi) ? pk.kursi[0] : pk.kursi;
  });

  const kursiList: string[] = rawKursi
    .filter(Boolean)
    .sort((a: any, b: any) => {
      if (a.baris === b.baris) return a.kolom - b.kolom;
      return a.baris.localeCompare(b.baris);
    })
    .map((k: any) => k.kode);

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
        jamMulai={jadwalData?.mulai || ""}
        jamSelesai={jadwalData?.selesai || ""}
        kursiList={kursiList}
        userEmail={user.email || ""}
      />
    </div>
  );
}
