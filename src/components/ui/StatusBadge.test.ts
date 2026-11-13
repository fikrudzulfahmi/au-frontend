import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { GAYA_VARIAN, varianStatusPresensi } from './StatusBadge'
import type { StatusVarian } from './StatusBadge'

/**
 * Tailwind v4 hanya menghasilkan CSS untuk token yang benar-benar ada di
 * `@theme`. Kelas seperti `text-green` atau `bg-orange-soft` yang tidak punya
 * token tidak menghasilkan apa pun, sehingga badge tampil tanpa warna dan
 * status "Lengkap" tidak bisa dibedakan dari "N belum diisi". Uji ini membaca
 * `styles/tokens.css` dan memastikan setiap kelas pada peta varian punya token.
 */
// Vitest menjalankan uji dengan cwd = akar proyek.
const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/** Nama token warna tanpa awalan `--color-`, mis. `success`, `success-soft`. */
const tokenWarna = new Set(
  [...tokens.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]),
)

/** Kumpulkan pasangan kelas -> nama token warna yang dipakai. */
function pasanganKelas(kelas: string): { utilitas: string; token: string }[] {
  const hasil: { utilitas: string; token: string }[] = []
  for (const bagian of kelas.split(/\s+/)) {
    const cocok = /^(?:text|bg|border|ring|divide|fill|stroke)-(.+)$/.exec(bagian)
    if (cocok) hasil.push({ utilitas: bagian, token: cocok[1] })
  }
  return hasil
}

describe('StatusBadge', () => {
  it('setiap varian memakai token warna yang ada di tokens.css', () => {
    const hilang: string[] = []

    for (const [varian, kelas] of Object.entries(GAYA_VARIAN)) {
      for (const { utilitas, token } of pasanganKelas(kelas)) {
        if (!tokenWarna.has(token)) hilang.push(`${varian}: ${utilitas}`)
      }
    }

    expect(hilang).toEqual([])
  })

  it('setiap varian punya warna teks dan latar, bukan hanya salah satu', () => {
    for (const [varian, kelas] of Object.entries(GAYA_VARIAN)) {
      const bagian = kelas.split(/\s+/)
      expect(bagian.some((k) => k.startsWith('text-')), `${varian} tanpa text-`).toBe(true)
      expect(bagian.some((k) => k.startsWith('bg-')), `${varian} tanpa bg-`).toBe(true)
    }
  })

  it('status lengkap dan belum diisi tidak memakai warna yang sama', () => {
    expect(GAYA_VARIAN.sukses).not.toEqual(GAYA_VARIAN.bahaya)
  })

  it('setiap varian StatusVarian terdaftar di peta gaya', () => {
    const semuaVarian: StatusVarian[] = [
      'hadir',
      'terlambat',
      'izin',
      'sakit',
      'dinas',
      'cuti',
      'alpa',
      'menunggu',
      'netral',
      'sukses',
      'bahaya',
    ]
    expect(Object.keys(GAYA_VARIAN).sort()).toEqual([...semuaVarian].sort())
  })

  it('memetakan status presensi pegawai ke varian yang sesuai', () => {
    expect(varianStatusPresensi('hadir')).toBe('hadir')
    expect(varianStatusPresensi('terlambat')).toBe('terlambat')
    expect(varianStatusPresensi('ditolak')).toBe('alpa')
    expect(varianStatusPresensi(undefined)).toBe('netral')
  })
})
