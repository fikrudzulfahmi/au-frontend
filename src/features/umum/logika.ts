import { formatJamSingkat, tanggalLokal } from '@/lib/format'

export type StatusTayang =
  | 'tayang'
  | 'belum_mulai'
  | 'kedaluwarsa'
  | 'nonaktif'
  | 'target_tidak_sesuai'

export type TargetTayang = 'app' | 'tv' | 'landing'

export const LABEL_STATUS_TAYANG: Record<StatusTayang, string> = {
  tayang: 'Tayang',
  belum_mulai: 'Belum mulai',
  kedaluwarsa: 'Kedaluwarsa',
  nonaktif: 'Nonaktif',
  target_tidak_sesuai: 'Target tidak cocok',
}

/** Bentuk minimal yang dibutuhkan aturan BR-36. */
export interface RentangPengumuman {
  is_active: boolean
  tanggal_mulai: string
  tanggal_selesai: string | null
  jam_mulai: string | null
  jam_selesai: string | null
  tampil_app: boolean
  tampil_tv: boolean
  tampil_landing: boolean
}

export function targetAktif(p: RentangPengumuman, target: TargetTayang): boolean {
  if (target === 'app') return p.tampil_app
  if (target === 'tv') return p.tampil_tv
  return p.tampil_landing
}

/**
 * BR-36 / KP-6.7 — pengumuman tayang hanya bila aktif DAN sekarang berada dalam
 * rentang tanggal (dan jam bila diisi) DAN targetnya cocok.
 *
 * Perbandingan memakai string ISO `YYYY-MM-DD` dan `HH:mm` dari jam LOKAL,
 * bukan `new Date('YYYY-MM-DD')` (yang dianggap UTC dan menggeser hari).
 */
export function statusTayang(
  p: RentangPengumuman,
  sekarang: Date,
  target: TargetTayang,
): StatusTayang {
  if (!p.is_active) return 'nonaktif'
  if (!targetAktif(p, target)) return 'target_tidak_sesuai'

  const hari = tanggalLokal(sekarang)
  if (hari < p.tanggal_mulai) return 'belum_mulai'
  if (p.tanggal_selesai !== null && hari > p.tanggal_selesai) return 'kedaluwarsa'

  const jam = formatJamSingkat(sekarang)
  if (p.jam_mulai !== null && jam < p.jam_mulai) return 'belum_mulai'
  if (p.jam_selesai !== null && jam > p.jam_selesai) return 'kedaluwarsa'

  return 'tayang'
}

/** BR-36 — baris yang kedaluwarsa tidak ditampilkan lagi, tetapi tidak dihapus. */
export function berhakTayang(
  p: RentangPengumuman,
  sekarang: Date,
  target: TargetTayang,
): boolean {
  return statusTayang(p, sekarang, target) === 'tayang'
}

/** Menyaring daftar yang berhak tayang untuk satu target (dipakai uji & tampilan). */
export function saringTayang<T extends RentangPengumuman>(
  daftar: readonly T[],
  sekarang: Date,
  target: TargetTayang,
): T[] {
  return daftar.filter((p) => berhakTayang(p, sekarang, target))
}
