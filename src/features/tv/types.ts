/** 5.19 — bentuk data endpoint TV (baca saja). */

export interface TampilanTv {
  interval_detik: number
  tema: string
  skala_font: string
  rotasi_panel_detik: number
  kecepatan_scroll: string
  tampilkan_alasan_izin: boolean
  tampilkan_ulang_tahun: boolean
}

export interface SekolahRingkas {
  nama_sekolah: string
  alamat_lengkap: string | null
  tagline: string | null
  nama_kepala_sekolah: string | null
}

export interface ServerTv {
  waktu: string
  tanggal: string
  nama_hari: string
  zona: string
}

export interface RingkasanItem {
  label: string
  nilai: number
}

export interface PegawaiRingkas {
  inisial: string
  nama: string
  jenis_pegawai?: string
}

export interface PresensiTv {
  tanggal: string
  nama_hari: string
  hari_libur: string | null
  ringkasan: RingkasanItem[]
  sudah_presensi: PegawaiRingkas[]
  belum_presensi: PegawaiRingkas[]
}

export interface JurnalBarisTv {
  inisial: string
  nama: string
  kelas: string
  mapel: string
  label_jam: string
}

export interface PresensiSiswaTv {
  hadir: number
  sakit: number
  izin: number
  alpa: number
  total: number
  persen_hadir: number | null
}

export interface JurnalTv {
  tersedia: boolean
  terjadwal: number
  terisi: number
  belum_terisi: number
  berhalangan: number
  persen: number
  guru_belum: JurnalBarisTv[]
  presensi_siswa: PresensiSiswaTv
}

export interface PerizinanBarisTv {
  inisial: string
  nama: string
  jenis: string
  label_jenis: string
  sampai: string | null
  /** BR-33 — hanya ada bila `tampilkan_alasan_izin` aktif. */
  alasan?: string | null
}

export interface PerizinanTv {
  ringkasan: RingkasanItem[]
  daftar: PerizinanBarisTv[]
  tampilkan_alasan: boolean
}

export interface KartuPengumumanTv {
  judul: string
  isi: string | null
  tipe: string
  prioritas: string
  penting: boolean
}

export interface PengumumanTv {
  kartu: KartuPengumumanTv[]
  teks_berjalan: string[]
}

export interface UlangTahunTv {
  aktif: boolean
  daftar: Array<{ inisial: string; nama: string }>
}

export interface RekapTv {
  server: ServerTv
  presensi: PresensiTv
  jurnal: JurnalTv
  perizinan: PerizinanTv
  pengumuman: PengumumanTv
  ulang_tahun: UlangTahunTv
  pengaturan: TampilanTv
}
