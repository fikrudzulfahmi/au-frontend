import { describe, expect, it } from 'vitest'

import {
  formatJamLengkap,
  formatJamSingkat,
  formatTanggal,
  formatTanggalDari,
  hariKe,
  jamAtauNol,
  menitDariJam,
  namaHari,
} from './format'

/**
 * 9 — format: tanggal dd-mm-yyyy, jam HH:mm, hari 1 = Senin.
 */
describe('format tanggal dan jam', () => {
  const senin = new Date(2026, 6, 6, 10, 26, 8) // 6 Juli 2026 (Senin)

  it('memakai hari 1 = Senin', () => {
    expect(hariKe(senin)).toBe(1)
    expect(namaHari(senin)).toBe('Senin')
    expect(hariKe(new Date(2026, 6, 12))).toBe(7) // Minggu
  })

  it('memformat tanggal menjadi dd-mm-yyyy', () => {
    expect(formatTanggal(senin)).toBe('06-07-2026')
  })

  it('memformat tanggal panjang dalam Bahasa Indonesia', () => {
    expect(formatJamLengkap(senin)).toBe('10:26:08')
    expect(formatJamSingkat(senin)).toBe('10:26')
  })

  it('memberi tanda hubung untuk tanggal kosong atau tidak valid', () => {
    expect(formatTanggalDari(null)).toBe('-')
    expect(formatTanggalDari('bukan-tanggal')).toBe('-')
    expect(formatTanggalDari('2026-07-06T00:00:00+07:00')).toBe('06-07-2026')
  })
})

describe('bantuan jam presensi', () => {
  it('memberi 00:00:00 bila presensi belum ada', () => {
    expect(jamAtauNol(null)).toBe('00:00:00')
    expect(jamAtauNol('07:01')).toBe('07:01:00')
    expect(jamAtauNol('07:01:12')).toBe('07:01:12')
  })

  it('mengubah jam menjadi menit sejak tengah malam', () => {
    expect(menitDariJam('07:00')).toBe(420)
    expect(menitDariJam('15:00')).toBe(900)
    expect(menitDariJam(null)).toBe(0)
  })
})
