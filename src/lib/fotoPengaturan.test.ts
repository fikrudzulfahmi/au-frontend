import { describe, expect, it } from 'vitest'

import { FOTO_BAWAAN, normalkanFoto } from './fotoPengaturan'

describe('normalkanFoto', () => {
  it('memakai nilai server saat tersedia', () => {
    expect(normalkanFoto({ max_sisi_px: 1280, kualitas_jpeg: 80, target_maks_kb: 400 })).toEqual({
      sisiMaks: 1280,
      kualitas: 80,
      targetKb: 400,
    })
  })

  it('memakai nilai bawaan saat jawaban kosong', () => {
    expect(normalkanFoto(undefined)).toEqual(FOTO_BAWAAN)
  })

  it('menjepit nilai di luar rentang agar kompresor tetap waras', () => {
    expect(normalkanFoto({ max_sisi_px: 10, kualitas_jpeg: 1, target_maks_kb: 99_999 })).toEqual({
      sisiMaks: 200,
      kualitas: 20,
      targetKb: 1000,
    })
  })

  it('mengabaikan nilai bukan angka', () => {
    expect(normalkanFoto({ max_sisi_px: Number.NaN, kualitas_jpeg: 70, target_maks_kb: 200 })).toEqual({
      sisiMaks: 200,
      kualitas: 70,
      targetKb: 200,
    })
  })
})
