import { describe, expect, it } from 'vitest'

import { adminTanpaPegawai, adalahPegawai, lencanaPeran, punyaPeran } from './roles'
import type { Pengguna } from './roles'

function pengguna(sebagian: Partial<Pengguna>): Pengguna {
  return {
    id: 1,
    username: 'uji',
    nama: 'Uji Coba',
    peran: [],
    pegawai_id: null,
    jenis_pegawai: null,
    jabatan: null,
    label_jabatan: null,
    status_kepegawaian: null,
    nip: null,
    foto_url: null,
    wajib_ganti_password: false,
    ...sebagian,
  }
}

const admin = pengguna({ peran: ['admin'], pegawai_id: null })
const guru = pengguna({ peran: ['guru'], pegawai_id: 1, jenis_pegawai: 'guru' })
const kepsek = pengguna({
  peran: ['kepala_sekolah'],
  pegawai_id: 9,
  jenis_pegawai: 'struktural',
  jabatan: 'Kepala Sekolah',
})

describe('pemeriksaan peran', () => {
  it('mengenali peran yang dimiliki', () => {
    expect(punyaPeran(guru, 'guru')).toBe(true)
    expect(punyaPeran(guru, 'admin')).toBe(false)
    expect(punyaPeran(guru, 'admin', 'guru')).toBe(true)
    expect(punyaPeran(null, 'guru')).toBe(false)
  })

  it('menandai admin tanpa data pegawai (A-19)', () => {
    expect(adminTanpaPegawai(admin)).toBe(true)
    expect(adminTanpaPegawai(guru)).toBe(false)
    expect(adminTanpaPegawai(null)).toBe(false)
  })

  it('mengenali pegawai dari pegawai_id', () => {
    expect(adalahPegawai(guru)).toBe(true)
    expect(adalahPegawai(kepsek)).toBe(true)
    expect(adalahPegawai(admin)).toBe(false)
  })

  it('menentukan lencana kartu Presensi & Kinerja (FR-UI-06)', () => {
    expect(lencanaPeran(guru)).toBe('GURU')
    expect(lencanaPeran(kepsek)).toBe('STRUKTURAL')
    expect(lencanaPeran(admin)).toBe('ADMIN')
    expect(lencanaPeran(null)).toBe('')
  })
})
