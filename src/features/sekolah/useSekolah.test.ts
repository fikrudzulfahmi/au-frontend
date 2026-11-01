import { describe, expect, it } from 'vitest'

import { pastikanProfilSekolah } from './useSekolah'

/**
 * Regresi: dulu `useSekolah` menelan semua kegagalan menjadi `null`, sehingga gangguan
 * sesaat tampil sebagai "data kosong" dan bagian peta landing menulis "Peta belum
 * tersedia" padahal koordinat sekolah sudah diisi. Yang paling menipu adalah respons
 * berstatus 200 berisi HTML (halaman tantangan anti-bot hosting): axios tidak melempar
 * galat, jadi tidak ada percobaan ulang sama sekali.
 */
describe('pastikanProfilSekolah', () => {
  it('meneruskan profil yang sah', () => {
    const profil = {
      nama_sekolah: 'SMK Contoh',
      koordinat: { latitude: -7.1, longitude: 112.7 },
    }

    expect(pastikanProfilSekolah(profil)).toBe(profil)
  })

  it('menolak respons kosong', () => {
    expect(() => pastikanProfilSekolah(null)).toThrow('tidak dikenali')
    expect(() => pastikanProfilSekolah(undefined)).toThrow('tidak dikenali')
  })

  it('menolak HTML tantangan yang tetap berstatus 200', () => {
    expect(() => pastikanProfilSekolah('<!DOCTYPE html><html>One moment, please...</html>')).toThrow(
      'tidak dikenali',
    )
  })

  it('menolak objek tanpa nama sekolah', () => {
    expect(() => pastikanProfilSekolah({ data: {} })).toThrow('tidak dikenali')
    expect(() => pastikanProfilSekolah({ nama_sekolah: null })).toThrow('tidak dikenali')
  })
})
