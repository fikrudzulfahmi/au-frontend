import { tanggalLokal } from './format'

/**
 * 5.14 — pilihan periode laporan.
 *
 * Nilai `periode` harus sama persis dengan yang diterima server
 * (`PeriodeLaporan::buat()`): `hari_ini`, `minggu_ini`, `bulan_ini`, `rentang`.
 * Perhitungan tanggalnya sengaja TIDAK diulang di frontend — server sudah
 * menyelesaikan minggu (Senin–Minggu) dan bulan penuh dengan zona Asia/Jakarta,
 * sedangkan peramban pengguna bisa berada di zona waktu lain. Frontend hanya
 * mengirim pilihannya, dan menampilkan label "periode" yang dikembalikan server.
 */
export type ModePeriode = 'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'rentang'

export interface OpsiPeriode {
  nilai: ModePeriode
  label: string
}

/** Urutan dari yang paling sering dipakai (bulan berjalan) ke paling sempit. */
export const OPSI_PERIODE: OpsiPeriode[] = [
  { nilai: 'bulan_ini', label: 'Bulan Ini' },
  { nilai: 'minggu_ini', label: 'Minggu Ini' },
  { nilai: 'hari_ini', label: 'Hari Ini' },
  { nilai: 'rentang', label: 'Rentang Tanggal' },
]

export interface PilihanPeriode {
  periode: ModePeriode
  dari: string
  sampai: string
}

export function periodeAwal(periode: ModePeriode = 'bulan_ini'): PilihanPeriode {
  return { periode, dari: '', sampai: '' }
}

/**
 * Membentuk query parameter periode untuk API.
 *
 * `dari`/`sampai` hanya dikirim pada mode rentang: pada mode lain server
 * menghitungnya sendiri, dan mengirim tanggal tambahan hanya akan membuat
 * dua sumber kebenaran yang bisa berselisih.
 */
export function paramsPeriode(p: PilihanPeriode): Record<string, string> {
  const hasil: Record<string, string> = { periode: p.periode }

  if (p.periode === 'rentang') {
    if (p.dari) hasil.dari = p.dari
    if (p.sampai) hasil.sampai = p.sampai
  }

  return hasil
}

/**
 * Rentang dianggap siap dikirim bila kedua tanggalnya terisi. Tanpa salah
 * satunya, server akan memakai bawaannya (awal bulan s.d. hari ini) sehingga
 * yang dilihat pengguna tidak sesuai pilihannya.
 */
export function rentangSiap(p: PilihanPeriode): boolean {
  if (p.periode !== 'rentang') return true

  return p.dari !== '' && p.sampai !== ''
}

/**
 * Keterangan periode untuk ditampilkan sebelum hasil server tiba — setelah
 * itu, label dari server (`hasil.periode`) yang dipakai karena lebih tepat.
 */
export function labelPeriode(p: PilihanPeriode): string {
  const label = OPSI_PERIODE.find((o) => o.nilai === p.periode)?.label ?? 'Periode'

  if (p.periode !== 'rentang') return label
  if (!rentangSiap(p)) return 'Rentang Tanggal (belum lengkap)'

  return `${p.dari} s.d. ${p.sampai}`
}

/** Tanggal hari ini menurut zona waktu peramban (YYYY-MM-DD). */
export function tanggalHariIni(): string {
  return tanggalLokal(new Date())
}
