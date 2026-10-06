import { bolehLaporanJurnal, bolehLaporanPresensi } from '@/lib/roles'
import type { Pengguna } from '@/lib/roles'

/** Filter yang dapat ditampilkan pada sebuah laporan, di luar periode. */
export type JenisFilter =
  | 'tanggal'
  | 'pegawai'
  | 'jenis_pegawai'
  | 'kelas'
  | 'mapel'
  | 'guru'
  | 'status'
  | 'jenis'

/** Cara memilih rentang waktu: lewat periode (5.14) atau satu tanggal. */
export type ModeWaktu = 'periode' | 'tanggal'

export interface KonfigurasiLaporan {
  /** Rute halaman di SPA — mengikuti placeholder Fase 5 yang sudah ada. */
  jalur: string
  /** Jalur API di bawah `/v1`. */
  endpoint: string
  /** Kode aturan pada spesifikasi, mis. FR-LAP-01. */
  kode: string
  judul: string
  keterangan: string
  kelompok: 'Presensi Pegawai' | 'Jurnal & Siswa'
  modeWaktu: ModeWaktu
  filter: JenisFilter[]
  /** Filter yang wajib diisi sebelum laporan diminta. */
  wajib?: JenisFilter[]
  /** Filter yang wajib diisi hanya bagi peran pemantau (admin/kepsek/wakasek). */
  wajibPemantau?: JenisFilter[]
  /** FR-LAP-11 — laporan memakai semester/tahun pelajaran yang dipilih. */
  pakaiSemester?: boolean
  /** Nama berkas cadangan bila `Content-Disposition` tidak memberi nama. */
  namaBerkas: string
  akses: (user: Pengguna | null) => boolean
}

/**
 * FR-LAP-01..09 — daftar laporan beserta endpoint, filter, dan pembatasan
 * perannya. `jalur` sengaja sama dengan placeholder Fase 5 di `router.tsx`
 * agar tautan lama tetap bekerja.
 */
export const LAPORAN: KonfigurasiLaporan[] = [
  {
    jalur: '/laporan/presensi/rekap',
    endpoint: '/laporan/presensi/rekap-pegawai',
    kode: 'FR-LAP-01',
    judul: 'Rekap Presensi Pegawai',
    keterangan:
      'Hadir, terlambat, pulang cepat, izin/sakit/dinas/cuti, alpa, dan persentase kehadiran per pegawai.',
    kelompok: 'Presensi Pegawai',
    modeWaktu: 'periode',
    filter: ['pegawai', 'jenis_pegawai'],
    namaBerkas: 'rekap-presensi-pegawai.pdf',
    pakaiSemester: true,
    akses: bolehLaporanPresensi,
  },
  {
    jalur: '/laporan/presensi/detail',
    endpoint: '/laporan/presensi/detail-pegawai',
    kode: 'FR-LAP-02',
    judul: 'Detail Presensi Pegawai',
    keterangan:
      'Rincian presensi harian satu pegawai: tanggal, jam masuk/pulang, status, jarak, lokasi, dan validasi.',
    kelompok: 'Presensi Pegawai',
    modeWaktu: 'periode',
    filter: ['pegawai'],
    wajib: ['pegawai'],
    namaBerkas: 'detail-presensi-pegawai.pdf',
    pakaiSemester: true,
    akses: bolehLaporanPresensi,
  },
  {
    jalur: '/laporan/presensi/harian',
    endpoint: '/laporan/presensi/harian',
    kode: 'FR-LAP-03',
    judul: 'Presensi Harian Semua Pegawai',
    keterangan: 'Presensi seluruh pegawai pada satu tanggal tertentu.',
    kelompok: 'Presensi Pegawai',
    modeWaktu: 'tanggal',
    filter: ['jenis_pegawai'],
    namaBerkas: 'presensi-harian.pdf',
    akses: bolehLaporanPresensi,
  },
  {
    jalur: '/laporan/izin',
    endpoint: '/laporan/presensi/rekap-izin',
    kode: 'FR-LAP-04',
    judul: 'Rekap Izin, Sakit, Dinas & Cuti',
    keterangan: 'Jumlah hari izin, sakit, dinas, dan cuti per pegawai pada satu periode.',
    kelompok: 'Presensi Pegawai',
    modeWaktu: 'periode',
    filter: ['jenis', 'pegawai'],
    namaBerkas: 'rekap-izin-sakit-dinas-cuti.pdf',
    akses: bolehLaporanPresensi,
  },
  {
    jalur: '/laporan/luar-radius',
    endpoint: '/laporan/presensi/rekap-luar-radius',
    kode: 'FR-LAP-05',
    judul: 'Rekap Presensi Luar Radius',
    keterangan: 'Pengajuan presensi di luar radius beserta keputusannya (menunggu/disetujui/ditolak).',
    kelompok: 'Presensi Pegawai',
    modeWaktu: 'periode',
    filter: ['status', 'pegawai'],
    namaBerkas: 'rekap-presensi-luar-radius.pdf',
    akses: bolehLaporanPresensi,
  },
  {
    jalur: '/laporan/presensi-siswa',
    endpoint: '/laporan/jurnal/rekap-siswa',
    kode: 'FR-LAP-06',
    judul: 'Rekap Presensi Siswa',
    keterangan:
      'Presensi siswa dari jurnal: H/S/I/A dan persentase per siswa, dapat difilter per mapel. Wali kelas dibatasi kelasnya (KP-5.5).',
    kelompok: 'Jurnal & Siswa',
    modeWaktu: 'periode',
    filter: ['kelas', 'mapel'],
    wajibPemantau: ['kelas'],
    namaBerkas: 'rekap-presensi-siswa.pdf',
    pakaiSemester: true,
    akses: bolehLaporanJurnal,
  },
  {
    jalur: '/laporan/jurnal',
    endpoint: '/laporan/jurnal/daftar',
    kode: 'FR-LAP-07',
    judul: 'Daftar Jurnal',
    keterangan: 'Jurnal yang sudah diisi: tanggal, jam ke, kelas, mapel, guru, materi, dan ringkasan H/S/I/A.',
    kelompok: 'Jurnal & Siswa',
    modeWaktu: 'periode',
    filter: ['guru', 'kelas', 'mapel'],
    namaBerkas: 'daftar-jurnal.pdf',
    pakaiSemester: true,
    akses: bolehLaporanJurnal,
  },
  {
    jalur: '/laporan/jurnal/kepatuhan',
    endpoint: '/laporan/jurnal/kepatuhan',
    kode: 'FR-LAP-08',
    judul: 'Rekap Kepatuhan Jurnal',
    keterangan:
      'Sesi terjadwal, terisi, belum terisi, berhalangan, dan persentase kepatuhan per guru (BR-26).',
    kelompok: 'Jurnal & Siswa',
    modeWaktu: 'periode',
    filter: ['guru'],
    namaBerkas: 'rekap-kepatuhan-jurnal.pdf',
    pakaiSemester: true,
    akses: bolehLaporanJurnal,
  },
  {
    jalur: '/laporan/jam-mengajar',
    endpoint: '/laporan/jurnal/jam-mengajar',
    kode: 'FR-LAP-09',
    judul: 'Rekap Jam Mengajar Terlaksana',
    keterangan: 'Jumlah sesi dan jam pelajaran (JP) yang benar-benar terlaksana per guru.',
    kelompok: 'Jurnal & Siswa',
    modeWaktu: 'periode',
    filter: ['guru'],
    namaBerkas: 'rekap-jam-mengajar.pdf',
    pakaiSemester: true,
    akses: bolehLaporanJurnal,
  },
]

export function laporanUntukPeran(user: Pengguna | null): KonfigurasiLaporan[] {
  return LAPORAN.filter((l) => l.akses(user))
}

export function laporanDariJalur(jalur: string): KonfigurasiLaporan | undefined {
  return LAPORAN.find((l) => l.jalur === jalur)
}
