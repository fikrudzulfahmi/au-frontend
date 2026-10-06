/** Hari Indonesia, 1 = Senin (9 — konvensi tanggal). */
export const HARI_INDO = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const

export const BULAN_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

/** 1 = Senin … 7 = Minggu dari objek Date (JS: 0 = Minggu). */
export function hariKe(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

export function namaHari(date: Date): string {
  return HARI_INDO[hariKe(date) - 1]
}

/** dd-mm-yyyy (9 — format tanggal). */
export function formatTanggal(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${date.getFullYear()}`
}

/**
 * dd-mm-yyyy dari string ISO/tanggal (aman untuk null).
 *
 * Tanggal tanpa jam ("2026-07-06", hasil kolom `date`) dibaca apa adanya tanpa
 * konversi zona, agar hari tidak bergeser pada peramban dengan zona waktu
 * negatif. Nilai bertimestamp penuh dikonversi ke tanggal lokal peramban.
 */
/**
 * Tanggal lokal (YYYY-MM-DD) dari sebuah Date.
 *
 * JANGAN memakai `toISOString().slice(0, 10)` — itu mengonversi ke UTC sehingga di
 * zona waktu positif (Asia/Jakarta) tanggalnya bergeser sehari pada jam-jam awal.
 * Komponen lokal diambil langsung agar hasilnya sama dengan tanggal di server.
 */
export function tanggalLokal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function formatTanggalDari(value?: string | null): string {
  if (!value) return '-'

  const tanggalSaja = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (tanggalSaja) {
    const [, tahun, bulan, hari] = tanggalSaja
    return `${hari}-${bulan}-${tahun}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return formatTanggal(date)
}

/** "Senin, 6 Juli 2026" */
export function formatTanggalPanjang(date: Date): string {
  return `${namaHari(date)}, ${date.getDate()} ${BULAN_INDO[date.getMonth()]} ${date.getFullYear()}`
}

/** HH:mm */
export function formatJamSingkat(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** HH:mm:ss */
export function formatJamLengkap(date: Date): string {
  return `${formatJamSingkat(date)}:${pad(date.getSeconds())}`
}

/** Jam dari string time "07:01:12" -> "07:01:12" atau fallback 00:00:00 */
export function jamAtauNol(value?: string | null): string {
  if (!value) return '00:00:00'
  return value.length === 5 ? `${value}:00` : value
}

/** Konversi "HH:mm[:ss]" ke jumlah menit sejak tengah malam. */
export function menitDariJam(value?: string | null): number {
  if (!value) return 0
  const [h, m] = value.split(':')
  return Number(h) * 60 + Number(m)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
