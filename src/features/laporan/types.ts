/**
 * 5.14 / 7.1 — bentuk respons laporan.
 *
 * Seluruh laporan (FR-LAP-01..09) memakai bentuk yang sama:
 *
 *   { data: { kode, judul, periode, kolom[], baris[][], ringkasan[] } }
 *
 * `kolom` + `baris` adalah matriks siap-tampil, sehingga satu tabel generik
 * dapat menyajikan semua laporan tanpa satu halaman per laporan. Laporan
 * tertentu menambahkan bidang rinciannya sendiri (`pegawai`, `guru`, `detail`,
 * `siswa`, `jurnal`) untuk keperluan ekspor dan penyaringan lanjutan.
 */
export interface RingkasanLaporan {
  label: string
  nilai: string | number
}

/** Satu sel matriks laporan; `null` berarti data tidak ada (mis. belum presensi). */
export type SelLaporan = string | number | null

/**
 * Rincian satu sesi jadwal mengajar di kelas pada laporan harian jurnal (FR-LAP-13).
 */
export interface SesiKelasHarian {
  label_jam: string
  jam_ke_mulai: number
  jam_ke_selesai: number
  mapel: string
  kode_mapel: string
  guru_id: number
  nip: string | null
  guru: string
  jurnal_id: number | null
  materi: string | null
  status: 'sudah' | 'belum' | 'berhalangan'
  alasan: string | null
}

/**
 * Ringkasan status keterisian jurnal per kelas pada laporan harian (FR-LAP-13).
 * Menampung seluruh kelas sekolah (termasuk yang tidak memiliki jadwal pada hari itu)
 * agar pimpinan sekolah dapat melihat kelas mana saja yang belum terisi.
 */
export interface RingkasanKelasHarianItem {
  kelas_id: number
  nama: string
  sesi: number
  sudah: number
  belum: number
  berhalangan: number
  tanpa_jadwal: boolean
  persen_terisi: number | null
  daftar: SesiKelasHarian[]
}

export interface HasilLaporan {
  kode: string
  judul: string
  periode: string
  kolom: string[]
  baris: SelLaporan[][]
  ringkasan?: RingkasanLaporan[]
  /** Ringkasan keterisian per kelas untuk FR-LAP-13 (Jurnal Harian per Kelas). */
  kelas?: RingkasanKelasHarianItem[]
  /** Bidang tambahan per laporan; tidak dipakai tabel generik. */
  pegawai?: unknown
  guru?: unknown
  siswa?: unknown
  jurnal?: unknown
  detail?: unknown
}

/** Satu baris tabel generik beserta kuncinya. */
export interface BarisLaporan {
  kunci: number
  sel: SelLaporan[]
}

/**
 * Mengubah matriks `baris` menjadi baris berkunci. `DataTable` hanya menerima
 * `kunciBaris(baris)`, sehingga kunci baris harus menempel pada barisnya.
 */
export function keBarisLaporan(baris: SelLaporan[][] | undefined): BarisLaporan[] {
  return (baris ?? []).map((sel, kunci) => ({ kunci, sel }))
}

/**
 * Menampilkan satu sel laporan.
 *
 * `null`, string kosong, dan `undefined` ditampilkan sebagai "—" agar tabel
 * terbaca rapi; angka `0` TETAP ditampilkan sebagai 0 (bukan dianggap kosong).
 */
export function teksSel(nilai: SelLaporan | undefined): string {
  if (nilai === null || nilai === undefined || nilai === '') return '—'

  return String(nilai)
}
