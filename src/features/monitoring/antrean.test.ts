import { describe, expect, it } from 'vitest'
import { barisAntrean, labelSisi, sisiMenunggu } from './antrean'
import type { AntreanPresensi } from '@/features/presensi/types'

function antrean(p: Partial<AntreanPresensi>): AntreanPresensi {
  return {
    id: 1,
    presensi_id: 41,
    pegawai_id: 7,
    pegawai: 'Siti Aminah',
    nip: '198701022010012003',
    tanggal: '2026-10-27',
    masuk_jam: '07:12',
    masuk_lat: -7.8654,
    masuk_lng: 111.465,
    masuk_jarak_m: 320,
    masuk_validasi: 'menunggu',
    masuk_alasan_luar_radius: 'Jalan ditutup banjir',
    pulang_jam: null,
    pulang_lat: null,
    pulang_lng: null,
    pulang_jarak_m: null,
    pulang_validasi: null,
    pulang_alasan_luar_radius: null,
    ...p,
  } as AntreanPresensi
}

describe('barisAntrean', () => {
  it('membuat satu baris untuk presensi yang hanya menunggu sisi masuk', () => {
    const baris = barisAntrean([antrean({})])

    expect(baris).toHaveLength(1)
    expect(baris[0].sisi).toBe('masuk')
    expect(baris[0].jam).toBe('07:12')
    expect(baris[0].kunci).toBe('41:masuk')
    expect(baris[0].sisi_lain).toEqual([])
  })

  it('memecah presensi yang menunggu masuk dan pulang menjadi dua baris terpisah', () => {
    const baris = barisAntrean([
      antrean({
        pulang_jam: '15:04',
        pulang_lat: -7.8655,
        pulang_lng: 111.4651,
        pulang_jarak_m: 410,
        pulang_validasi: 'menunggu',
        pulang_alasan_luar_radius: 'Menunggu jemputan',
      }),
    ])

    expect(baris.map((b) => b.sisi)).toEqual(['masuk', 'pulang'])
    expect(baris.map((b) => b.kunci)).toEqual(['41:masuk', '41:pulang'])

    const pulang = baris[1]
    expect(pulang.jam).toBe('15:04')
    expect(pulang.jarak_m).toBe(410)
    expect(pulang.alasan).toBe('Menunggu jemputan')
    expect(pulang.sisi_lain).toEqual(['masuk'])
  })

  it('tetap menampilkan sisi pulang saja saat sisi masuk sudah diputuskan', () => {
    const baris = barisAntrean([
      antrean({
        masuk_validasi: 'disetujui',
        pulang_jam: '15:00',
        pulang_validasi: 'menunggu',
      }),
    ])

    expect(baris).toHaveLength(1)
    expect(baris[0].sisi).toBe('pulang')
  })

  it('menganggap sisi masuk menunggu bila payload lama tidak mengirim status validasi', () => {
    const lama = antrean({ masuk_validasi: null as never })

    expect(sisiMenunggu(lama)).toEqual(['masuk'])
    expect(barisAntrean([lama])[0].sisi).toBe('masuk')
  })

  it('memberi label sisi berbahasa Indonesia', () => {
    expect(labelSisi('masuk')).toBe('Masuk')
    expect(labelSisi('pulang')).toBe('Pulang')
  })
})
