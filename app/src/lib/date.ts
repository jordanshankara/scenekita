/**
 * Helper manipulasi tanggal dan waktu untuk SceneKita
 * Acuan zona waktu: Asia/Jakarta (WIB)
 */

export interface HariOpsi {
  key: string;       // YYYY-MM-DD
  label: string;     // e.g., "Hari Ini", "Besok", "Lusa"
  sublabel: string;  // e.g., "20 Nov", "21 Nov"
  fullLabel: string; // e.g., "Hari Ini, 20 Nov"
  date: Date;
}

/**
 * Mengambil 3 hari ke depan (Hari Ini, Besok, Lusa) dalam zona waktu Asia/Jakarta.
 */
export function getTigaHariKedepan(): HariOpsi[] {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options); // Format: YYYY-MM-DD
  const now = new Date();

  const labels = ["Hari Ini", "Besok", "Lusa"];

  const list: HariOpsi[] = [];

  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const key = formatter.format(d);

    const dayFormatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
    });
    const sublabel = dayFormatter.format(d);

    list.push({
      key,
      label: labels[i] || `H+${i}`,
      sublabel,
      fullLabel: `${labels[i]}, ${sublabel}`,
      date: d,
    });
  }

  return list;
}

/**
 * Format string ISO / timestamptz ke jam lokal Asia/Jakarta (HH:mm)
 */
export function formatJam(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d).replace(".", ":");
  } catch {
    return "--:--";
  }
}

/**
 * Cek apakah jadwal sudah lewat dari waktu sekarang (R8).
 */
export function isJadwalLewat(isoMulai: string): boolean {
  try {
    const mulai = new Date(isoMulai);
    return mulai.getTime() <= Date.now();
  } catch {
    return true;
  }
}

/**
 * Format tanggal lengkap Indonesia (e.g., "Kamis, 20 November 2026")
 */
export function formatTanggalLengkap(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "-";
  }
}

/**
 * Dapatkan key YYYY-MM-DD dalam zona waktu Asia/Jakarta dari tanggal ISO
 */
export function getTanggalKey(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}
