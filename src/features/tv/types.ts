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
  /** Hanya pada `sudah_presensi`: jam masuk (HH:mm[:ss]) dan keterlambatan. */
  jam_masuk?: string | null
  menit_terlambat?: number
  status?: string
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
  bolos: number
  terlambat: number
  total: number
  /** (hadir + terlambat) / total. */
  persen_kehadiran: number | null
}

/** Satu sesi mengajar pada kartu kelas TV (tanpa NIP/materi, BR-33). */
export interface SesiKelasTv {
  label_jam: string
  jam_ke_mulai: number
  mapel: string
  guru: string
  status: 'sudah' | 'belum' | 'berhalangan'
}

/** Keterisian jurnal satu kelas hari ini — sumber sama dengan dasbor admin. */
export interface KelasJurnalTv {
  kelas_id: number
  nama: string
  sesi: number
  sudah: number
  belum: number
  berhalangan: number
  tanpa_jadwal: boolean
  persen_terisi: number | null
  daftar: SesiKelasTv[]
}

export interface JurnalTv {
  tersedia: boolean
  terjadwal: number
  terisi: number
  belum_terisi: number
  berhalangan: number
  persen: number
  guru_belum: JurnalBarisTv[]
  kelas: KelasJurnalTv[]
  /** Terisi bila hari ini libur: jurnal tidak ditagih. */
  libur: { keterangan: string | null } | null
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
