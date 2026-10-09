import { describe, expect, it } from 'vitest'

import { MENU_SIDEBAR, layananPeran, menuBawah } from './menu'
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

const admin = pengguna({ peran: ['admin'] })
const guru = pengguna({ peran: ['guru'], pegawai_id: 1, jenis_pegawai: 'guru' })
const struktural = pengguna({ peran: ['pegawai_struktural'], pegawai_id: 2, jenis_pegawai: 'struktural' })

describe('bottom menu mobile (8.2)', () => {
  it('selalu memiliki lima slot', () => {
    expect(menuBawah(guru)).toHaveLength(5)
    expect(menuBawah(admin)).toHaveLength(5)
  })

  it('memakai tombol tengah Presensi untuk pegawai', () => {
    expect(menuBawah(guru)[2]?.label).toBe('Presensi')
    expect(menuBawah(guru)[2]?.tengah).toBe(true)
    expect(menuBawah(struktural)[2]?.label).toBe('Presensi')
  })

  it('mengubah tombol tengah menjadi Persetujuan bagi admin non-pegawai (A-19)', () => {
    expect(menuBawah(admin)[2]?.label).toBe('Persetujuan')
    expect(menuBawah(admin)[2]?.lencanaPersetujuan).toBe(true)
  })

  it('menaruh Beranda di slot pertama dan Profil di slot terakhir', () => {
    for (const u of [admin, guru, struktural]) {
      expect(menuBawah(u)[0]?.to).toBe('/dashboard')
      expect(menuBawah(u)[4]?.to).toBe('/profil')
    }
  })
})

describe('sidebar desktop (8.3)', () => {
  it('hanya memuat grup yang sesuai peran', () => {
    const judulAdmin = MENU_SIDEBAR.filter((g) =>
      g.items.some((i) => (i.akses ? i.akses(admin) : true)),
    ).map((g) => g.judul)

    expect(judulAdmin).toContain('Master Data')
    expect(judulAdmin).toContain('Pengaturan')
    expect(judulAdmin).not.toContain('Mengajar')

    const judulGuru = MENU_SIDEBAR.filter((g) =>
      g.items.some((i) => (i.akses ? i.akses(guru) : true)),
    ).map((g) => g.judul)

    expect(judulGuru).toContain('Mengajar')
    expect(judulGuru).not.toContain('Master Data')
    expect(judulGuru).not.toContain('Pengaturan')
  })
})

describe('grid layanan (FR-UI-07)', () => {
  it('menyusun layanan sesuai peran', () => {
    const labelGuru = layananPeran(guru).map((l) => l.label)
    expect(labelGuru).toEqual(expect.arrayContaining(['Jadwal', 'Jurnal', 'Izin', 'Riwayat']))

    const labelAdmin = layananPeran(admin).map((l) => l.label)
    expect(labelAdmin).toEqual(expect.arrayContaining(['Persetujuan', 'Monitoring', 'Master Data']))

    const labelStruktural = layananPeran(struktural).map((l) => l.label)
    expect(labelStruktural).not.toContain('Jurnal')
  })

  it('menampilkan layanan "Ajukan Luar Radius" untuk guru', () => {
    const luarRadius = layananPeran(guru).find((l) => l.label === 'Ajukan Luar Radius')
    expect(luarRadius).toBeDefined()
    expect(luarRadius?.segera).toBeFalsy()
  })
})
