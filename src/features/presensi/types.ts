/** Tipe Fase 3 — presensi, pengajuan, monitoring (5.10–5.12). */

export interface PresensiSisi {
  waktu: string | null
  jam: string | null
  lat: number | null
  lng: number | null
  akurasi_m: number | null
  jarak_m: number | null
  lokasi_id: number | null
  lokasi: string | null
  status: 'hadir' | 'terlambat' | 'normal' | 'pulang_cepat' | null
  menit_terlambat: number
  menit_cepat: number
  validasi: 'valid' | 'menunggu' | 'disetujui' | 'ditolak' | null
  alasan_luar_radius: string | null
  foto: boolean
  foto_url: string | null
}

export interface Presensi {
  id: number
  tanggal: string
  pegawai_id: number
  pegawai?: { id: number; nip: string; nama: string; jenis_pegawai: string }
  masuk: PresensiSisi
  pulang: PresensiSisi
  belum_pulang: boolean
  dihitung_hadir: boolean
  dikoreksi_admin: boolean
  catatan_penyetuju: string | null
  diputuskan_pada: string | null
}

export interface StatusHariIni {
  tanggal: string
  nama_hari: string
  is_hari_kerja: boolean
  hari_libur: string | null
  buka_presensi: string | null
  jam_masuk: string | null
  jam_pulang: string | null
  boleh_masuk: boolean
  alasan_tidak_boleh_masuk: string | null
  boleh_pulang: boolean
  pengajuan: { jenis: string; label_jenis: string } | null
  presensi: Presensi | null
  lokasi: Array<{
    id: number
    nama: string
    radius_m: number
    latitude: number
    longitude: number
    is_default: boolean
  }>
}

export interface PengajuanIzin {
  id: number
  pegawai_id: number
  pegawai?: { id: number; nip: string; nama: string; jenis_pegawai: string }
  jenis: 'izin' | 'sakit' | 'dinas' | 'cuti'
  label_jenis: string
  tanggal_mulai: string
  tanggal_selesai: string
  jumlah_hari: number | null
  alasan: string
  ada_lampiran: boolean
  presensi_luar_radius: boolean
  status: 'menunggu' | 'disetujui' | 'ditolak' | 'dibatalkan'
  label_status: string
  membebaskan_presensi: boolean
  catatan_penyetuju: string | null
  dibuat_oleh_admin: boolean
  diputuskan_pada: string | null
  diputuskan_oleh: string | null
  dibuat_pada: string | null
}

export interface PengajuanLuarRadius {
  id: number
  pegawai_id: number
  pegawai?: { id: number; nip: string; nama: string; jenis_pegawai: string }
  tanggal: string
  alasan: string
  ada_lampiran: boolean
  dari_dinas: boolean
  pengajuan_izin_id: number | null
  status: 'menunggu' | 'disetujui' | 'ditolak' | 'dibatalkan'
  label_status: string
  catatan_penyetuju: string | null
  diputuskan_pada: string | null
  diputuskan_oleh: string | null
}

export type KategoriMonitoring =
  | 'belum_presensi'
  | 'hadir'
  | 'terlambat'
  | 'berhalangan'
  | 'menunggu'
  | 'luar_radius'
  | 'tidak_presensi_pulang'

export interface BarisMonitoring {
  pegawai_id: number
  nip: string
  nama: string
  jenis_pegawai: string
  jabatan: string | null
  status: KategoriMonitoring
  label_status: string
  hari_kerja: boolean
  jam_masuk: string | null
  jam_pulang: string | null
  presensi_id: number | null
  masuk_jam: string | null
  pulang_jam: string | null
  masuk_lat: number | null
  masuk_lng: number | null
  lokasi_lat: number | null
  lokasi_lng: number | null
  lokasi_radius_m: number | null
  masuk_status: string | null
  pulang_status: string | null
  masuk_validasi: string | null
  pulang_validasi: string | null
  menit_terlambat: number
  jarak_m: number | null
  lokasi: string | null
  pengajuan_jenis: string | null
  pengajuan_label: string | null
  alasan_luar_radius: string | null
  ada_foto: boolean
}

export interface MonitoringHarian {
  tanggal: string
  nama_hari: string | null
  hari_libur: string | null
  ringkasan: Record<KategoriMonitoring, number>
  baris: BarisMonitoring[]
}

export interface AntreanPresensi {
  presensi_id: number
  pegawai_id: number
  pegawai: string | null
  nip: string | null
  tanggal: string
  masuk_jam: string | null
  masuk_lat: number | null
  masuk_lng: number | null
  masuk_jarak_m: number | null
  masuk_validasi: string | null
  masuk_alasan_luar_radius: string | null
  pulang_validasi: string | null
  pulang_alasan_luar_radius: string | null
}

export const VARIAN_KATEGORI: Record<KategoriMonitoring, 'hadir' | 'izin' | 'menunggu' | 'cuti' | 'alpa'> = {
  hadir: 'hadir',
  terlambat: 'menunggu',
  belum_presensi: 'alpa',
  berhalangan: 'cuti',
  menunggu: 'izin',
  luar_radius: 'izin',
  tidak_presensi_pulang: 'menunggu',
}

export const OPSI_JENIS_IZIN = [
  { nilai: 'izin', label: 'Izin' },
  { nilai: 'sakit', label: 'Sakit' },
  { nilai: 'dinas', label: 'Dinas' },
  { nilai: 'cuti', label: 'Cuti' },
]
