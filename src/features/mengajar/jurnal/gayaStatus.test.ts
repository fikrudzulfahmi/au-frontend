import { describe, expect, it } from 'vitest'

import { GAYA_STATUS } from './gayaStatus'
import { LABEL_STATUS_SISWA, STATUS_SISWA } from './types'

/**
 * BR-23 — daftar status presensi siswa.
 *
 * Uji ini menjaga kesepakatan sekolah (HSIABT) tetap utuh: satu huruf boleh
 * berubah letak hanya bila disengaja, dan setiap status tidak boleh kehilangan
 * label atau warnanya.
 */
describe('status presensi siswa (HSIABT)', () => {
  it('memakai urutan H, S, I, A, B, T', () => {
    expect(STATUS_SISWA).toEqual(['H', 'S', 'I', 'A', 'B', 'T'])
  })

  it('memberi label bahasa Indonesia untuk setiap status', () => {
    expect(LABEL_STATUS_SISWA).toEqual({
      H: 'Hadir',
      S: 'Sakit',
      I: 'Izin',
      A: 'Alpa',
      B: 'Bolos',
      T: 'Terlambat',
    })
  })

  it('memberi warna tombol untuk setiap status pada daftar', () => {
    STATUS_SISWA.forEach((status) => {
      expect(GAYA_STATUS[status], `status ${status} belum punya warna`).toBeTruthy()
      expect(GAYA_STATUS[status]).toMatch(/bg-\S+/)
    })
  })

  it('membedakan warna terlambat dari hadir, sakit, izin, alpa, dan bolos', () => {
    const warna = STATUS_SISWA.map((s) => GAYA_STATUS[s])
    expect(new Set(warna).size).toBe(STATUS_SISWA.length)
  })
})
