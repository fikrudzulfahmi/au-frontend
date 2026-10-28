import { describe, expect, it } from 'vitest'

import { keBarisLaporan } from './types'

/**
 * FR-LAP-07 — id jurnal ditempel per indeks pada baris laporan.
 *
 * Server mengirim `jurnal[]` sejajar `baris[]` supaya tabel laporan dapat
 * menautkan baris ke detail read-only tanpa menambah kolom yang akan mengubah
 * bentuk laporan (dan ikut terekspor ke PDF/Excel).
 */
describe('keBarisLaporan', () => {
  const sel = [[{ teks: '2026-10-19' }], [{ teks: 'X RPL 1' }]]

  it('menempelkan id jurnal sesuai urutan baris', () => {
    const baris = keBarisLaporan(sel as never, [{ id: 21 }, { id: 22 }])

    expect(baris.map((b) => b.id)).toEqual([21, 22])
    // Bentuk sel tidak berubah: tetap satu sel per kolom.
    expect(baris[0]?.sel).toHaveLength(1)
  })

  it('mengisi null saat laporan tidak mengirim daftar jurnal', () => {
    expect(keBarisLaporan(sel as never).map((b) => b.id)).toEqual([null, null])
  })

  it('mengisi null untuk baris yang tidak punya pasangan jurnal', () => {
    const baris = keBarisLaporan(sel as never, [{ id: 21 }])

    expect(baris.map((b) => b.id)).toEqual([21, null])
  })

  it('aman untuk laporan kosong', () => {
    expect(keBarisLaporan(undefined)).toEqual([])
  })
})
