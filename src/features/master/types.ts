/** Tipe bersama halaman master data (7.2). */

export interface TahunPelajaran {
  id: number
  nama: string
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  status: 'draft' | 'aktif' | 'selesai'
  jumlah_kelas?: number
  semester?: Semester[]
}

export interface Semester {
  id: number
  tahun_pelajaran_id: number
  jenis: 'ganjil' | 'genap'
  label: string
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  is_active: boolean
}

export interface HariLibur {
  id: number
  tahun_pelajaran_id: number
  tanggal_mulai: string
  tanggal_selesai: string
  keterangan: string
}

export interface Jurusan {
  id: number
  kode: string
  nama: string
}

export interface Kelas {
  id: number
  tahun_pelajaran_id: number
  tahun_pelajaran?: string
  nama: string
  tingkat: 'X' | 'XI' | 'XII'
  jurusan_id: number
  jurusan?: { id: number; kode: string; nama: string }
  wali_kelas_id: number | null
  wali_kelas?: string | null
  is_active: boolean
}

export interface Siswa {
  id: number
  nis: string
  nisn: string | null
  nama: string
  jenis_kelamin: 'L' | 'P'
  tempat_lahir: string | null
  tanggal_lahir: string | null
  tahun_masuk: number | null
  status: 'aktif' | 'lulus' | 'pindah' | 'keluar'
  tanggal_status: string | null
  tahun_lulus: number | null
}

export interface AkunPegawai {
  id: number
  username: string
  peran: string[]
  is_active: boolean
  wajib_ganti_password: boolean
  punya_perangkat: boolean | null
}

export interface Pegawai {
  id: number
  nip: string
  nama: string
  jenis_kelamin: 'L' | 'P'
  jenis_pegawai: 'guru' | 'struktural'
  jabatan: string | null
  label_jabatan: string
  status_kepegawaian: string
  email: string | null
  no_hp: string | null
  tanggal_lahir: string | null
  is_active: boolean
  akun?: AkunPegawai | null
}

export interface Mapel {
  id: number
  kode: string
  nama: string
  kelompok: 'umum' | 'kejuruan' | 'muatan_lokal'
  jurusan_id: number | null
  jurusan?: string | null
  is_active: boolean
}

export interface AuditLog {
  id: number
  aksi: string
  user: string | null
  objek_tipe: string | null
  objek_id: number | null
  data_lama: Record<string, unknown> | null
  data_baru: Record<string, unknown> | null
  ip: string | null
  waktu: string | null
}

export interface PenggunaAdmin {
  id: number
  username: string
  nama: string
  peran: string[]
  pegawai_id: number | null
  nip: string | null
  wajib_ganti_password: boolean
}

export const OPSI_TINGKAT = [
  { nilai: 'X', label: 'X' },
  { nilai: 'XI', label: 'XI' },
  { nilai: 'XII', label: 'XII' },
]

export const OPSI_KELOMPOK_MAPEL = [
  { nilai: 'umum', label: 'Umum' },
  { nilai: 'kejuruan', label: 'Kejuruan' },
  { nilai: 'muatan_lokal', label: 'Muatan Lokal' },
]

export const OPSI_JENIS_KELAMIN = [
  { nilai: 'L', label: 'Laki-laki' },
  { nilai: 'P', label: 'Perempuan' },
]

export const OPSI_JENIS_PEGAWAI = [
  { nilai: 'guru', label: 'Guru' },
  { nilai: 'struktural', label: 'Pegawai Struktural' },
]

export const OPSI_STATUS_KEPEGAWAIAN = ['PNS', 'PPPK', 'GTY', 'GTT', 'Honorer', 'Lainnya'].map(
  (s) => ({ nilai: s, label: s }),
)

export const OPSI_STATUS_SISWA = [
  { nilai: 'aktif', label: 'Aktif' },
  { nilai: 'lulus', label: 'Lulus' },
  { nilai: 'pindah', label: 'Pindah' },
  { nilai: 'keluar', label: 'Keluar' },
]

export const LABEL_KELOMPOK: Record<string, string> = {
  umum: 'Umum',
  kejuruan: 'Kejuruan',
  muatan_lokal: 'Muatan Lokal',
}
