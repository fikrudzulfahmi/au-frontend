import type { SesiKelasHarian } from './types'

/**
 * Nama guru untuk satu sesi jurnal: pengampu ditambah keterangan bila sesi
 * diisi guru piket ("Ahmad (diisi guru piket: Budi)") dalam satu kolom.
 * Server mengirim `guru_keterangan`; `guru` tetap dipakai bila field itu absen
 * (mis. cache respons lama di peramban).
 */
export function keteranganGuru(sesi: Pick<SesiKelasHarian, 'guru' | 'guru_keterangan'>): string {
  const teks = sesi.guru_keterangan?.trim()

  return teks !== undefined && teks !== '' ? teks : sesi.guru
}
