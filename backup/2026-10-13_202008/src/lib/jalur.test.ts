import { describe, expect, it } from 'vitest'

import { JALUR_BAWAAN, jalurAman } from './jalur'

/** Satu backslash, dinyatakan lewat kode agar tidak salah baca. */
const BS = String.fromCharCode(92)

describe('jalurAman', () => {
  it('meneruskan jalur internal yang wajar', () => {
    expect(jalurAman('/master/siswa')).toBe('/master/siswa')
    expect(jalurAman('/pengaturan/info-sekolah')).toBe('/pengaturan/info-sekolah')
    expect(jalurAman('/')).toBe('/')
    expect(jalurAman('/dashboard?tab=1')).toBe('/dashboard?tab=1')
    expect(jalurAman('  /master/kelas  ')).toBe('/master/kelas')
  })

  it('menolak jalur relatif dan nilai bukan teks', () => {
    expect(jalurAman('dashboard')).toBe(JALUR_BAWAAN)
    expect(jalurAman('')).toBe(JALUR_BAWAAN)
    expect(jalurAman('   ')).toBe(JALUR_BAWAAN)
    expect(jalurAman(null)).toBe(JALUR_BAWAAN)
    expect(jalurAman(undefined)).toBe(JALUR_BAWAAN)
    expect(jalurAman(42)).toBe(JALUR_BAWAAN)
  })

  it('menolak URL lengkap dan skema berbahaya', () => {
    expect(jalurAman('https://situs-jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman('javascript:alert(1)')).toBe(JALUR_BAWAAN)
  })

  /** Inti advisory react-router: backslash dipakai untuk melewati pemeriksaan pustaka. */
  it('menolak backslash dalam segala posisi', () => {
    expect(jalurAman('/' + BS + 'situs-jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman(BS + BS + 'situs-jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman('/master' + BS + '..' + BS + '..' + BS + 'jahat')).toBe(JALUR_BAWAAN)
  })

  it('menolak bentuk ter-encode dari backslash dan slash', () => {
    expect(jalurAman('/%5Csitus-jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman('/%5csitus-jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman('/%2F%2Fsitus-jahat.example')).toBe(JALUR_BAWAAN)
  })

  it('menolak URL tanpa protokol (protocol-relative)', () => {
    expect(jalurAman('//situs-jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman('///situs-jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman('//situs-jahat.example/master')).toBe(JALUR_BAWAAN)
  })

  it('menolak karakter kendali hasil dekode', () => {
    expect(jalurAman('/master' + String.fromCharCode(13) + String.fromCharCode(10) + 'Location: https://jahat.example')).toBe(JALUR_BAWAAN)
    expect(jalurAman('/master' + String.fromCharCode(0))).toBe(JALUR_BAWAAN)
    expect(jalurAman('/%0d%0aLocation:%20https://jahat.example')).toBe(JALUR_BAWAAN)
  })
})
