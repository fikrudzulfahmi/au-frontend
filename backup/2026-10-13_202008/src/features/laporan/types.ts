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

export interface HasilLaporan {
  kode: string
  judul: string
  periode: string
  kolom: string[]
  baris: SelLaporan[][]
  ringkasan?: RingkasanLaporan[]
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
