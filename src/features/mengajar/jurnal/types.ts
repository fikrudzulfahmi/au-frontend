/** 5.13 — tipe jurnal pembelajaran + presensi siswa (Fase 4). */

/** Status sesi pada daftar jadwal beranda (FR-JRN-01, KP-4.6). */
export type StatusSesi = 'belum' | 'sudah' | 'berhalangan'

/** BR-23 — status presensi siswa. */
export type StatusSiswa = 'H' | 'S' | 'I' | 'A' | 'B' | 'T'

export interface SesiJurnal {
  plotting_mapel_id: number
  kelas_id: number
  kelas: string | null
  mapel: string | null
  kode_mapel: string | null
  jam_ke_mulai: number
  jam_ke_selesai: number
  jam_mulai: string | null
  jam_selesai: string | null
  jurnal_id: number | null
  label_jam: string
  status: StatusSesi
  alasan: string | null
  /** KP-4.6 / BR-19 — server yang memutuskan, bukan klien. */
  boleh_isi: boolean
  /**
   * Khusus guru piket: `false` bila jurnal sesi ini tidak boleh ia ubah lagi —
   * mis. jurnal diisi pengampu sendiri, atau pengampu sudah presensi masuk
   * sehingga jurnal kembali ke tangan guru tersebut.
   */
  boleh_ubah?: boolean
  /** Khusus guru piket: pengampu sesi sudah presensi masuk hari ini. */
  pengampu_hadir?: boolean
  /**
   * Pengampu sesi menurut jadwal. Hanya dikirim untuk guru piket, yang daftar
   * sesinya mencakup seluruh kelas — sesi biasa selalu milik pengguna sendiri.
   */
  pegawai_id?: number
  guru?: string | null
  nip?: string | null
}

export interface SemesterRingkas {
  id: number
  nama: string | null
  label: string
  is_active: boolean
}

export interface HariIniJurnal {
  tanggal: string
  /** Tanggal hari berjalan menurut server — pengisian hanya boleh untuk tanggal ini. */
  hari_ini: string
  /** `false` bila tanggal bukan hari ini atau tanggalnya hari libur. */
  boleh_isi: boolean
  /** Hari libur tidak punya kewajiban jurnal (KP-5.4/BR-24). */
  libur: {
    ada: boolean
    keterangan: string | null
    tanggal_mulai: string | null
    tanggal_selesai: string | null
  }
  semester: SemesterRingkas
  /**
   * Penugasan piket pada tanggal ini. Bila `bertugas`, `sesi` berisi seluruh
   * kelas sekolah (bukan hanya jadwal pengguna) dan setiap sesi memuat nama
   * pengampunya — guru piket menggantikan pengampu yang berhalangan.
   */
  piket: {
    bertugas: boolean
    hari: number
    nama_hari: string | null
    catatan: string | null
  }
  sesi: SesiJurnal[]
  ringkasan: {
    total: number
    sudah: number
    belum: number
    berhalangan: number
  }
}

export interface BarisPresensiSiswa {
  siswa_id: number
  nis: string | null
  nama: string | null
  jenis_kelamin: string | null
  status: StatusSiswa
  label_status?: string
  keterangan: string | null
}

export interface RingkasanPresensi {
  H: number
  S: number
  I: number
  A: number
  B: number
  /** Terlambat — hadir tetapi datang setelah pelajaran dimulai. */
  T: number
}

export interface Jurnal {
  id: number
  tanggal: string
  label_jam: string
  jam_ke_mulai: number
  jam_ke_selesai: number
  /** Kunci sesi (FR-JRN-01) — dipakai menautkan baris riwayat ke halaman ubah. */
  plotting_mapel_id: number
  kelas_id: number
  kelas: string | null
  mapel_id: number | null
  mapel: string | null
  kode_mapel: string | null
  materi: string
  kegiatan: string
  catatan: string | null
  jumlah_foto: number
  ringkasan: RingkasanPresensi
  diubah_pada: string | null
}

export interface JurnalLengkap extends Jurnal {
  presensi_siswa: BarisPresensiSiswa[]
  foto: { id: number; urutan: number }[]
}

export interface BarisRekapSiswa {
  siswa_id: number
  nis: string | null
  nama: string | null
  hadir: number
  sakit: number
  izin: number
  alpa: number
  bolos: number
  terlambat: number
  total: number
  /** (hadir + terlambat) / total — siswa terlambat tetap dihitung hadir. */
  persen_kehadiran: number | null
}

export interface RekapSiswa {
  semester: SemesterRingkas
  kelas: string | null
  dari: string | null
  sampai: string | null
  sesi: number
  ringkasan: RingkasanPresensi
  siswa: BarisRekapSiswa[]
}

/** Label status presensi siswa untuk tampilan. */
export const LABEL_STATUS_SISWA: Record<StatusSiswa, string> = {
  H: 'Hadir',
  S: 'Sakit',
  I: 'Izin',
  A: 'Alpa',
  B: 'Bolos',
  T: 'Terlambat',
}

/** Urutan tombol status pada halaman isi jurnal (FR-JRN-03). */
export const STATUS_SISWA: StatusSiswa[] = ['H', 'S', 'I', 'A', 'B', 'T']
