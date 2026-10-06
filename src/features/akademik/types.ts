/** Tipe bersama Fase 2 — plotting, jam pelajaran, dan jadwal (7.2/7.3). */

export interface Semester {
  id: number
  tahun_pelajaran_id: number
  jenis: 'ganjil' | 'genap'
  label: string
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  is_active: boolean
}

export interface PlottingKelas {
  id: number
  tahun_pelajaran_id: number
  kelas_id: number
  kelas: string | null
  tingkat: string | null
  siswa_id: number
  siswa: {
    id: number
    nis: string
    nisn: string | null
    nama: string
    jenis_kelamin: 'L' | 'P'
    status: string
  } | null
  status_akhir: StatusAkhir
  sudah_diproses: boolean
  catatan: string | null
  plotting_sebelumnya_id: number | null
}

export type StatusAkhir = 'berjalan' | 'naik_kelas' | 'tinggal_kelas' | 'lulus' | 'pindah' | 'keluar'

export const LABEL_STATUS_AKHIR: Record<StatusAkhir, string> = {
  berjalan: 'Berjalan',
  naik_kelas: 'Naik Kelas',
  tinggal_kelas: 'Tinggal Kelas',
  lulus: 'Lulus',
  pindah: 'Pindah',
  keluar: 'Keluar',
}

export interface RingkasanKelas {
  kelas_id: number
  nama: string
  tingkat: string
  jurusan: string | null
  wali_kelas: string | null
  jumlah: number
  jumlah_l: number
  jumlah_p: number
}

/** Satu baris keputusan pada wizard naik kelas. */
export interface KeputusanWizard {
  siswa_id: number
  status_akhir: StatusAkhir
  kelas_tujuan_id: number | null
  catatan?: string | null
}

export interface SiswaWizard {
  plotting_id: number
  siswa_id: number
  nis: string | null
  nisn: string | null
  nama: string | null
  jenis_kelamin: 'L' | 'P' | null
  status_siswa: string | null
  status_akhir: StatusAkhir
  status_akhir_bawaan: StatusAkhir
  sudah_diproses: boolean
  kelas_tujuan_saran: number | null
}

export interface KelasWizard {
  kelas_id: number
  nama: string
  tingkat: string
  jurusan: string | null
  jumlah: number
  jumlah_l: number
  jumlah_p: number
  selesai: boolean
  siswa: SiswaWizard[]
}

export interface PratinjauWizard {
  tahun_pelajaran_asal: number
  tahun_pelajaran_tujuan: { id: number; nama: string }
  kelas: KelasWizard[]
  ringkasan: Record<string, number>
}

export interface PlottingMapel {
  id: number
  semester_id: number
  pegawai_id: number
  guru: string | null
  mapel_id: number
  mapel: { id: number; kode: string; nama: string; kelompok: string } | null
  kelas_id: number
  kelas: string | null
  tingkat: string | null
  jp_per_minggu: number
  jumlah_jadwal: number | null
}

export interface SlotJam {
  id: number
  pola_jam_id: number
  urutan: number
  tipe: 'pelajaran' | 'istirahat' | 'kegiatan'
  label: string
  jam_mulai: string
  jam_selesai: string
  jam_ke: number | null
  boleh_dijadwalkan: boolean
  jumlah_jadwal?: number | null
}

export interface PolaJam {
  id: number
  semester_id: number
  nama: string
  hari: Array<{ id: number; hari: number; nama_hari: string }> | undefined
  slot: SlotJam[] | undefined
  jumlah_jp: number | undefined
}

export interface IsiJadwal {
  id: number
  plotting_mapel_id: number
  mapel: string | null
  kode_mapel: string | null
  kelas: string | null
  kelas_id: number
  guru: string | null
  pegawai_id: number
}

export interface SlotGrid {
  slot_jam_id: number
  urutan: number
  tipe: string
  label: string
  jam_mulai: string
  jam_selesai: string
  jam_ke: number | null
  dapat_dijadwalkan: boolean
  isi: IsiJadwal[]
}

export interface HariGrid {
  hari: number
  nama_hari: string
  pola_jam: string | null
  slot: SlotGrid[]
}

export interface PeringatanJp {
  plotting_mapel_id: number
  mapel: string | null
  kelas: string | null
  guru: string | null
  jp_per_minggu: number
  terjadwal: number
}

export interface GridJadwal {
  semester: { id: number; label: string }
  hari: HariGrid[]
  peringatan: PeringatanJp[]
}

export interface JadwalGuru {
  id: number
  jam_mulai: string | null
  jam_selesai: string | null
  jam_ke: number | null
  mapel: string | null
  kode_mapel: string | null
  kelas: string | null
}

export interface HariJadwalGuru {
  hari: number
  nama_hari: string
  jadwal: JadwalGuru[]
  jumlah_jp: number
}

export const NAMA_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const

export const OPSI_TIPE_SLOT = [
  { nilai: 'pelajaran', label: 'Pelajaran' },
  { nilai: 'istirahat', label: 'Istirahat' },
  { nilai: 'kegiatan', label: 'Kegiatan' },
]

export const OPSI_HARI = NAMA_HARI.map((nama, indeks) => ({ nilai: indeks + 1, label: nama }))
