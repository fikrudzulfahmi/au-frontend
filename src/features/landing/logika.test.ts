import { describe, expect, it } from 'vitest'

import type { PengaturanLanding } from './logika'
import {
  landingAktif,
  tampilkanPetaLanding,
  tampilkanPengumumanLanding,
  tautanGoogleMaps,
} from './logika'

function cfg(ubah: Partial<PengaturanLanding> = {}): PengaturanLanding {
  return { aktif: true, judul_hero: null, tampilkan_peta: true, tampilkan_pengumuman: true, ...ubah }
}

describe('landing — aturan tampil bagian (FR-LND-05/07)', () => {
  it('menyembunyikan pengumuman bila kosong', () => {
    expect(tampilkanPengumumanLanding(cfg(), 0)).toBe(false)
    expect(tampilkanPengumumanLanding(cfg(), 3)).toBe(true)
  })

  it('menyembunyikan pengumuman bila dinonaktifkan admin', () => {
    expect(tampilkanPengumumanLanding(cfg({ tampilkan_pengumuman: false }), 5)).toBe(false)
    expect(tampilkanPengumumanLanding(cfg({ aktif: false }), 5)).toBe(false)
  })

  it('peta hanya tampil bila koordinat tersedia dan diizinkan', () => {
    expect(tampilkanPetaLanding(cfg(), true)).toBe(true)
    expect(tampilkanPetaLanding(cfg(), false)).toBe(false)
    expect(tampilkanPetaLanding(cfg({ tampilkan_peta: false }), true)).toBe(false)
  })

  it('memperlakukan pengaturan yang belum dimuat sebagai landing aktif', () => {
    expect(landingAktif(undefined)).toBe(true)
    expect(landingAktif(null)).toBe(true)
  })
})

describe('tautanGoogleMaps', () => {
  it('membentuk link universal Google Maps pada titik yang diberikan', () => {
    expect(tautanGoogleMaps(-7.1536, 112.6562)).toBe(
      'https://www.google.com/maps/search/?api=1&query=-7.1536,112.6562',
    )
  })

  it('tidak membulatkan koordinat', () => {
    expect(tautanGoogleMaps(-7.123456789, 112.987654321)).toContain('-7.123456789,112.987654321')
  })
})
