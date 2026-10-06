/** 5.13 — tipe jurnal pembelajaran + presensi siswa (Fase 4). */

/** Status sesi pada daftar jadwal beranda (FR-JRN-01, KP-4.6). */
export type StatusSesi = 'belum' | 'sudah' | 'berhalangan'

/** BR-23 — status presensi siswa hanya empat nilai ini. */
export type StatusSiswa = 'H' | 'S' | 'I' | 'A'

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
}

export interface SemesterRingkas {
  id: number
  nama: string | null
  label: string
  is_active: boolean
}

export interface HariIniJurnal {
  tanggal: string
  semester: SemesterRingkas
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
}

export interface Jurnal {
  id: number
  tanggal: string
  label_jam: string
  jam_ke_mulai: number
  jam_ke_selesai: number
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
  total: number
  persen_hadir: number | null
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
}

export const STATUS_SISWA: StatusSiswa[] = ['H', 'S', 'I', 'A']
