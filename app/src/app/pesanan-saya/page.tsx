export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PesananSayaList, PesananSayaItem } from "@/components/PesananSayaList";
import { StateMessage } from "@/components/StateMessage";

export default async function PesananSayaPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/pesanan-saya");
  }

  const supabase = await createClient();

  // 1. Ambil seluruh pesanan milik akun yang sedang login (R9: penonton hanya melihat miliknya)
  const { data: rawPesanan, error: errPesanan } = await supabase
    .from("pesanan")
    .select("id, kode_booking, status, batas_waktu, dibuat_at, jadwal_id")
    .eq("user_id", user.id)
    .order("dibuat_at", { ascending: false });

  if (errPesanan) {
    console.error("[Pesanan Saya Error]:", errPesanan);
    return (
      <div
        style={{
          maxWidth: "960px",
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
            title="Gagal Memuat Pesanan"
            description="Terjadi kendala saat memuat riwayat pesanan Anda. Silakan coba kembali."
            action={{
              label: "Muat Ulang",
              href: "/pesanan-saya",
              variant: "primary",
            }}
          />
        </div>
      </div>
    );
  }

  const pesananList = rawPesanan || [];
  const jadwalIds = Array.from(new Set(pesananList.map((p) => p.jadwal_id).filter(Boolean)));
  const pesananIds = pesananList.map((p) => p.id);

  // 2. Ambil data jadwal, film, dan studio
  const jadwalMap: Record<string, { filmJudul: string; studioNama: string; mulai: string; selesai: string }> = {};
  if (jadwalIds.length > 0) {
    const { data: jadwalRows } = await supabase
      .from("jadwal")
      .select(`
        id,
        mulai,
        selesai,
        film:film_id (judul),
        studio:studio_id (nama)
      `)
      .in("id", jadwalIds);

    if (jadwalRows) {
      jadwalRows.forEach((j: any) => {
        const filmData = Array.isArray(j.film) ? j.film[0] : j.film;
        const studioData = Array.isArray(j.studio) ? j.studio[0] : j.studio;
        jadwalMap[j.id] = {
          filmJudul: filmData?.judul || "Film",
          studioNama: studioData?.nama || "Studio",
          mulai: j.mulai,
          selesai: j.selesai,
        };
      });
    }
  }

  // 3. Ambil data kursi untuk setiap pesanan (query terpisah untuk relasi foreign key komposit)
  const pesananKursiMap: Record<string, string[]> = {};
  if (pesananIds.length > 0) {
    const { data: pkRows } = await supabase
      .from("pesanan_kursi")
      .select("pesanan_id, kursi_id")
      .in("pesanan_id", pesananIds);

    const kursiIds = Array.from(new Set((pkRows || []).map((pk) => pk.kursi_id)));

    const kursiKodeMap: Record<string, { kode: string; baris: string; kolom: number }> = {};
    if (kursiIds.length > 0) {
      const { data: kursiRows } = await supabase
        .from("kursi")
        .select("id, kode, baris, kolom")
        .in("id", kursiIds);

      if (kursiRows) {
        kursiRows.forEach((k: any) => {
          kursiKodeMap[k.id] = {
            kode: k.kode,
            baris: k.baris,
            kolom: k.kolom,
          };
        });
      }
    }

    if (pkRows) {
      pkRows.forEach((pk) => {
        if (!pesananKursiMap[pk.pesanan_id]) {
          pesananKursiMap[pk.pesanan_id] = [];
        }
        const kData = kursiKodeMap[pk.kursi_id];
        if (kData) {
          pesananKursiMap[pk.pesanan_id].push(kData.kode);
        }
      });
    }
  }

  // 4. Gabungkan seluruh data menjadi daftar terstruktur
  const orders: PesananSayaItem[] = pesananList.map((p) => {
    const jInfo = jadwalMap[p.jadwal_id] || {
      filmJudul: "Film",
      studioNama: "Studio",
      mulai: "",
      selesai: "",
    };

    const kursiSorted = (pesananKursiMap[p.id] || []).sort();

    return {
      id: p.id,
      kodeBooking: p.kode_booking,
      status: p.status,
      batasWaktu: p.batas_waktu,
      dibuatAt: p.dibuat_at,
      filmJudul: jInfo.filmJudul,
      studioNama: jInfo.studioNama,
      jamMulai: jInfo.mulai,
      jamSelesai: jInfo.selesai,
      kursiList: kursiSorted,
    };
  });

  return (
    <div
      style={{
        maxWidth: "960px", // Sesuai Design System Layar 6
        margin: "0 auto",
        padding: "var(--space-8) var(--gutter-mobile) var(--space-16)",
      }}
    >
      <header style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontSize: "var(--text-h1-mobile)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-2)",
          }}
        >
          Riwayat Booking Saya
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-body)",
            margin: 0,
          }}
        >
          Daftar pesanan tiket bioskop Anda. Tunjukkan kode booking saat pembayaran di loket.
        </p>
      </header>

      <PesananSayaList initialOrders={orders} userEmail={user.email || ""} />
    </div>
  );
}
