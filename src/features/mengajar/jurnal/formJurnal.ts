import type { JurnalLengkap, StatusSiswa } from './types'

/** Isi formulir jurnal yang sudah tersimpan (BR-20 — edit tanpa mengetik ulang). */
export interface IsiFormJurnal {
  materi: string
  kegiatan: string
  catatan: string
  baris: Record<number, { status: StatusSiswa; keterangan: string }>
}

/**
 * Mengubah jurnal tersimpan menjadi nilai awal formulir ubah jurnal.
 *
 * Dipisah dari komponen supaya aturannya bisa diuji tanpa merender halaman:
 * nilai kosong menjadi string kosong (bukan `null`, agar `<textarea>` tetap
 * terkendali) dan presensi siswa dibawa apa adanya — termasuk keterangannya.
 */
export function isiFormDariJurnal(jurnal: JurnalLengkap): IsiFormJurnal {
  const baris: IsiFormJurnal['baris'] = {}

  for (const p of jurnal.presensi_siswa) {
    baris[p.siswa_id] = { status: p.status, keterangan: p.keterangan ?? '' }
  }

  return {
    materi: jurnal.materi ?? '',
    kegiatan: jurnal.kegiatan ?? '',
    catatan: jurnal.catatan ?? '',
    baris,
  }
}
