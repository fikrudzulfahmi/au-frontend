import type { KelasJurnalTv, RekapTv, RingkasanItem, SesiKelasTv } from './types'

/**
 * BR-33 / FR-TV-17 — layar TV tidak boleh memuat data pribadi.
 *
 * Daftar ini dipakai sebagai penjaga di sisi klien: bila suatu saat backend
 * keliru mengirim bidang terlarang, `pindaiKunciTerlarang` menandainya
 * (dipakai pada uji, bukan untuk merender apa pun).
 */
export const KUNCI_TERLARANG_TV = [
  'foto',
  'foto_selfie',
  'selfie',
  'foto_url',
  'koordinat',
  'latitude',
  'longitude',
  'jarak_m',
  'nip',
  'no_hp',
  'nomor_hp',
  'alasan_sakit',
  'ada_foto',
] as const

/** Menelusuri seluruh kunci JSON secara rekursif dan mengembalikan yang terlarang. */
export function pindaiKunciTerlarang(nilai: unknown, terlarang: readonly string[] = KUNCI_TERLARANG_TV): string[] {
  const temuan = new Set<string>()

  const telusuri = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(telusuri)
      return
    }

    if (node !== null && typeof node === 'object') {
      for (const [kunci, isi] of Object.entries(node as Record<string, unknown>)) {
        if (terlarang.includes(kunci.toLowerCase())) temuan.add(kunci.toLowerCase())
        telusuri(isi)
      }
    }
  }

  telusuri(nilai)
  return [...temuan].sort()
}

/** Jumlah baris per kolom pada layar TV — dibatasi agar tidak perlu gulir (KP-6.9). */
export const MAKS_BARIS_KOLOM = 6

export interface KolomTv {
  kunci: 'presensi' | 'jurnal' | 'perizinan'
  judul: string
  ringkasan: RingkasanItem[]
  jumlahBaris: number
}

/** KP-6.3 — pembentukan tiga kolom TV dari rekap server (bukan hitung ulang). */
export function bagiKolomTv(rekap: RekapTv): KolomTv[] {
  return [
    {
      kunci: 'presensi',
      judul: 'Presensi Pegawai',
      ringkasan: rekap.presensi.ringkasan,
      jumlahBaris: Math.min(rekap.presensi.belum_presensi.length, MAKS_BARIS_KOLOM),
    },
    {
      kunci: 'jurnal',
      judul: 'Jurnal Mengajar',
      ringkasan: ringkasanJurnal(rekap),
      jumlahBaris: Math.min(rekap.jurnal.guru_belum.length, MAKS_BARIS_KOLOM),
    },
    {
      kunci: 'perizinan',
      judul: 'Perizinan',
      ringkasan: rekap.perizinan.ringkasan,
      jumlahBaris: Math.min(rekap.perizinan.daftar.length, MAKS_BARIS_KOLOM),
    },
  ]
}

function ringkasanJurnal(rekap: RekapTv): RingkasanItem[] {
  const j = rekap.jurnal

  return [
    { label: 'Terjadwal', nilai: j.terjadwal },
    { label: 'Terisi', nilai: j.terisi },
    { label: 'Belum Terisi', nilai: j.belum_terisi },
    { label: 'Persen', nilai: j.persen },
  ]
}

/** Satu baris kartu per halaman (4 kolom) agar tiap kartu tinggi dan terbaca dari jauh. */
export const KELAS_PER_HALAMAN = 4
/** Sesi maksimal per kartu; kelas yang sesinya lebih banyak dilanjutkan di kartu berikutnya. */
export const MAKS_SESI_KARTU = 4

/**
 * Urutan baca kartu kelas TV — sama dengan dasbor admin: kelas yang paling
 * banyak belum diisi di depan. Kelas tanpa jadwal tidak dibuat kartu; jumlahnya
 * dilaporkan terpisah.
 */
export function kelasUntukTv(data: KelasJurnalTv[]): { tampil: KelasJurnalTv[]; tanpaJadwal: number } {
  const berjadwal = data.filter((k) => !k.tanpa_jadwal && k.sesi > 0)
  const urut = [...berjadwal].sort((a, b) => {
    if (a.belum !== b.belum) return b.belum - a.belum
    return a.nama.localeCompare(b.nama, 'id', { numeric: true })
  })

  return { tampil: urut, tanpaJadwal: data.length - berjadwal.length }
}

/** Membagi kartu menjadi halaman yang diputar otomatis (tanpa gulir, KP-6.9). */
export function bagiHalamanKelas<T>(kartu: T[], perHalaman: number = KELAS_PER_HALAMAN): T[][] {
  const hasil: T[][] = []
  for (let i = 0; i < kartu.length; i += perHalaman) hasil.push(kartu.slice(i, i + perHalaman))
  return hasil
}

export interface KartuTv {
  kelas: KelasJurnalTv
  sesi: SesiKelasTv[]
  /** Bagian ke-n (mulai 1) dari `total` kartu untuk kelas yang sama. */
  bagian: number
  total: number
}

/**
 * Memecah kelas menjadi kartu: semua sesi ditampilkan (urut jam). Kelas dengan
 * sesi melebihi `maks` dilanjutkan pada kartu berikutnya, urutan kelas tetap.
 */
export function pecahKartu(kelas: KelasJurnalTv[], maks: number = MAKS_SESI_KARTU): KartuTv[] {
  return kelas.flatMap((k) => {
    const urut = [...k.daftar].sort((a, b) => a.jam_ke_mulai - b.jam_ke_mulai)
    const total = Math.max(1, Math.ceil(urut.length / maks))

    return Array.from({ length: total }, (_, i) => ({
      kelas: k,
      sesi: urut.slice(i * maks, (i + 1) * maks),
      bagian: i + 1,
      total,
    }))
  })
}

/** Empat angka utama strip jurnal TV — dari rekap server, bukan hitung ulang (BR-37). */
export function angkaJurnal(rekap: RekapTv): RingkasanItem[] {
  const j = rekap.jurnal

  return [
    { label: 'Sesi Terjadwal', nilai: j.terjadwal },
    { label: 'Sudah Diisi', nilai: j.terisi },
    { label: 'Belum Diisi', nilai: j.belum_terisi },
    { label: 'Berhalangan', nilai: j.berhalangan },
  ]
}

/** FR-TV-13 — kecepatan teks berjalan (detik per putaran). */
export function durasiMarqueeDetik(kecepatan: string): number {
  if (kecepatan === 'lambat') return 45
  if (kecepatan === 'cepat') return 20
  return 30
}

/** FR-TV-16 — skala font tampilan TV sebagai pengali ukuran dasar. */
export function faktorSkalaFont(skala: string): number {
  if (skala === 'normal') return 0.9
  if (skala === 'ekstra_besar') return 1.1
  return 1
}

/** Memotong teks panjang agar kartu tetap utuh tanpa gulir. */
export function potongTeks(teks: string, maks: number): string {
  const bersih = teks.replace(/\s+/g, ' ').trim()
  return bersih.length <= maks ? bersih : `${bersih.slice(0, Math.max(0, maks - 1)).trimEnd()}…`
}
