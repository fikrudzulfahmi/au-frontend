import type { BarisMonitoring } from '@/features/presensi/types'
import { labelStatus, varianStatusPresensi, type StatusVarian } from '@/components/ui/StatusBadge'

/** Sisi presensi yang bisa diperiksa pimpinan. */
export type SisiPresensi = 'masuk' | 'pulang'

/**
 * Ringkasan satu SISI presensi untuk layar detail monitoring.
 *
 * Sisi masuk dan pulang punya kolom sendiri-sendiri (`masuk_*` / `pulang_*`). Fungsi ini
 * satu-satunya tempat pemetaan itu: bila UI memilih field sisi pulang secara manual di
 * beberapa komponen, cepat atau lambat ada blok "Pulang" yang menampilkan koordinat
 * sisi masuk. Uji `sisiPresensi.test.ts` menjaga pemetaan ini.
 */
export interface RingkasanSisi {
  sisi: SisiPresensi
  judul: string
  /** Ada presensi pada sisi ini (jam kirim terisi). */
  ada: boolean
  jam: string | null
  status: string | null
  validasi: string | null
  jarakM: number | null
  lat: number | null
  lng: number | null
  akurasiM: number | null
  lokasiNama: string | null
  lokasiLat: number | null
  lokasiLng: number | null
  radiusM: number | null
  poligon: Array<[number, number]> | null
  alasan: string | null
  adaFoto: boolean
}

export function ringkasanSisi(baris: BarisMonitoring, sisi: SisiPresensi): RingkasanSisi {
  const pulang = sisi === 'pulang'
  const jam = pulang ? baris.pulang_jam : baris.masuk_jam

  return {
    sisi,
    judul: pulang ? 'Presensi pulang' : 'Presensi datang',
    ada: jam !== null && jam !== undefined,
    jam: jam ?? null,
    status: (pulang ? baris.pulang_status : baris.masuk_status) ?? null,
    validasi: (pulang ? baris.pulang_validasi : baris.masuk_validasi) ?? null,
    // `jarak_m` adalah jarak sisi masuk (payload lama); sisi pulang memakai `pulang_jarak_m`.
    jarakM: pulang ? (baris.pulang_jarak_m ?? null) : (baris.masuk_jarak_m ?? baris.jarak_m ?? null),
    lat: pulang ? (baris.pulang_lat ?? null) : baris.masuk_lat,
    lng: pulang ? (baris.pulang_lng ?? null) : baris.masuk_lng,
    akurasiM: pulang ? (baris.pulang_akurasi_m ?? null) : (baris.masuk_akurasi_m ?? null),
    lokasiNama: (pulang ? baris.lokasi_pulang : baris.lokasi) ?? null,
    lokasiLat: pulang ? (baris.lokasi_pulang_lat ?? null) : baris.lokasi_lat,
    lokasiLng: pulang ? (baris.lokasi_pulang_lng ?? null) : baris.lokasi_lng,
    radiusM: pulang ? (baris.lokasi_pulang_radius_m ?? null) : baris.lokasi_radius_m,
    poligon: (pulang ? baris.lokasi_pulang_poligon : baris.lokasi_poligon) ?? null,
    alasan: (pulang ? baris.pulang_alasan_luar_radius : baris.alasan_luar_radius) ?? null,
    adaFoto: pulang ? baris.ada_foto_pulang === true : (baris.ada_foto_masuk ?? baris.ada_foto) === true,
  }
}

/** Label status kirim presensi (bukan kategori harian). */
const LABEL_STATUS_SISI: Record<string, string> = {
  hadir: 'Tepat waktu',
  terlambat: 'Terlambat',
  normal: 'Normal',
  pulang_cepat: 'Pulang cepat',
}

export function labelStatusSisi(status: string | null): string {
  if (status === null) return '—'
  return LABEL_STATUS_SISI[status] ?? status
}

export interface LabelValidasi {
  teks: string
  varian: StatusVarian
}

/**
 * Lencana keadaan keputusan satu sisi presensi (BR-17). Varian diambil dari
 * `varianStatusPresensi` supaya warna keputusan sama dengan tempat lain; hanya
 * `valid` yang diberi hijau karena artinya "sah, tidak perlu diputuskan".
 */
export function labelValidasi(validasi: string | null): LabelValidasi {
  if (validasi === null) return { teks: '—', varian: 'netral' }
  if (validasi === 'valid') return { teks: 'Sah', varian: 'sukses' }
  if (validasi === 'menunggu') return { teks: 'Menunggu keputusan', varian: 'menunggu' }

  return { teks: labelStatus[validasi] ?? validasi, varian: varianStatusPresensi(validasi) }
}
