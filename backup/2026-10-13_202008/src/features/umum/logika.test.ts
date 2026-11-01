import { describe, expect, it } from 'vitest'

import type { RentangPengumuman } from './logika'
import { LABEL_STATUS_TAYANG, berhakTayang, saringTayang, statusTayang, targetAktif } from './logika'

function buat(ubah: Partial<RentangPengumuman> = {}): RentangPengumuman {
  return {
    is_active: true,
    tanggal_mulai: '2026-10-06',
    tanggal_selesai: null,
    jam_mulai: null,
    jam_selesai: null,
    tampil_app: true,
    tampil_tv: true,
    tampil_landing: false,
    ...ubah,
  }
}

describe('BR-36 — kelayakan tayang pengumuman', () => {
  // 6 Oktober 2026, jam 23.30 WIB (jam lokal) — jangan bergeser ke tanggal lain.
  const malam = new Date(2026, 9, 6, 23, 30, 0)
  const pagi = new Date(2026, 9, 6, 8, 0, 0)

  it('tayang bila aktif dan dalam rentang tanggal', () => {
    expect(statusTayang(buat(), pagi, 'app')).toBe('tayang')
    expect(berhakTayang(buat(), pagi, 'app')).toBe(true)
  })

  it('tetap membaca tanggal LOKAL di malam hari (tanpa pergeseran UTC)', () => {
    expect(statusTayang(buat({ tanggal_mulai: '2026-10-06' }), malam, 'app')).toBe('tayang')
    expect(statusTayang(buat({ tanggal_selesai: '2026-10-06' }), malam, 'app')).toBe('tayang')
  })

  it('menandai kedaluwarsa tanpa menghapus (tidak berhak tayang)', () => {
    const lewat = buat({ tanggal_mulai: '2026-09-01', tanggal_selesai: '2026-09-30' })
    expect(statusTayang(lewat, pagi, 'app')).toBe('kedaluwarsa')
    expect(berhakTayang(lewat, pagi, 'app')).toBe(false)
  })

  it('menandai belum mulai untuk tanggal dan jam yang belum tiba', () => {
    expect(statusTayang(buat({ tanggal_mulai: '2026-10-07' }), pagi, 'app')).toBe('belum_mulai')
    expect(statusTayang(buat({ jam_mulai: '13:00' }), pagi, 'app')).toBe('belum_mulai')
    expect(statusTayang(buat({ jam_mulai: '06:00', jam_selesai: '07:00' }), pagi, 'app')).toBe(
      'kedaluwarsa',
    )
  })

  it('menghormati target tayang (app/TV/landing)', () => {
    const hanyaTv = buat({ tampil_app: false, tampil_tv: true, tampil_landing: false })
    expect(statusTayang(hanyaTv, pagi, 'app')).toBe('target_tidak_sesuai')
    expect(statusTayang(hanyaTv, pagi, 'tv')).toBe('tayang')
    expect(targetAktif(hanyaTv, 'landing')).toBe(false)
    expect(statusTayang(buat({ is_active: false }), pagi, 'app')).toBe('nonaktif')
    expect(LABEL_STATUS_TAYANG.nonaktif).toBe('Nonaktif')
  })

  it('menyaring daftar hanya untuk yang berhak tayang', () => {
    const daftar = [
      buat({ tanggal_mulai: '2026-10-06' }),
      buat({ tanggal_selesai: '2026-10-05' }),
      buat({ is_active: false }),
      buat({ tampil_landing: true, tampil_tv: true, tanggal_mulai: '2026-10-06' }),
    ]

    expect(saringTayang(daftar, pagi, 'landing')).toHaveLength(1)
    expect(saringTayang(daftar, pagi, 'tv')).toHaveLength(2)
  })
})
