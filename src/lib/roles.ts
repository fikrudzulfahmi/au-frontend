/** Kode peran (Bagian 2). */
export const ROLE = {
  admin: 'admin',
  kepalaSekolah: 'kepala_sekolah',
  wakasekKurikulum: 'wakasek_kurikulum',
  guru: 'guru',
  pegawaiStruktural: 'pegawai_struktural',
} as const

export type KodePeran = (typeof ROLE)[keyof typeof ROLE]

export const LABEL_PERAN: Record<KodePeran, string> = {
  admin: 'Administrator',
  kepala_sekolah: 'Kepala Sekolah',
  wakasek_kurikulum: 'Wakasek Kurikulum',
  guru: 'Guru',
  pegawai_struktural: 'Pegawai Struktural',
}

export interface Pengguna {
  id: number
  username: string
  nama: string
  peran: KodePeran[]
  pegawai_id: number | null
  jenis_pegawai: 'guru' | 'struktural' | null
  jabatan: string | null
  /** Gabungan jabatan dan status kepegawaian, mis. "Guru · GTY" (FR-UI-05). */
  label_jabatan: string | null
  status_kepegawaian: string | null
  nip: string | null
  foto_url: string | null
  wajib_ganti_password: boolean
}

export function punyaPeran(user: Pengguna | null, ...peran: KodePeran[]): boolean {
  if (!user) return false
  return peran.some((p) => user.peran.includes(p))
}

/** Admin non-pegawai: tombol tengah bottom menu menjadi Persetujuan (A-19). */
export function adminTanpaPegawai(user: Pengguna | null): boolean {
  return punyaPeran(user, ROLE.admin) && !user?.pegawai_id
}

/** Pegawai = guru / struktural (termasuk kepsek & wakasek yang terdaftar pegawai). */
export function adalahPegawai(user: Pengguna | null): boolean {
  return Boolean(user?.pegawai_id)
}

/** Peran utama untuk lencana pada kartu Presensi & Kinerja (FR-UI-06). */
export function lencanaPeran(user: Pengguna | null): string {
  if (!user) return ''
  if (user.jenis_pegawai === 'guru') return 'GURU'
  if (user.jenis_pegawai === 'struktural') return 'STRUKTURAL'
  if (punyaPeran(user, ROLE.admin)) return 'ADMIN'
  if (punyaPeran(user, ROLE.kepalaSekolah)) return 'KEPALA SEKOLAH'
  if (punyaPeran(user, ROLE.wakasekKurikulum)) return 'WAKASEK'
  return ''
}
