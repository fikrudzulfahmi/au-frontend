import { describe, expect, it } from 'vitest'

import type { BarisMonitoring } from '@/features/presensi/types'
import { labelStatusSisi, labelValidasi, ringkasanSisi } from './sisiPresensi'

/** Baris monitoring lengkap dengan data datang dan pulang yang BERBEDA. */
function barisUji(ubah: Partial<BarisMonitoring> = {}): BarisMonitoring {
  return {
    presensi_id: 11,
    pegawai_id: 7,
    nama: 'Guru Uji',
    nip: '198001012005011001',
    unit: 'SMP',
    tanggal: '2026-10-26',
    masuk_jam: '06:55:00',
    masuk_lat: -7.8654,
    masuk_lng: 111.465,
    masuk_jarak_m: 18,
    masuk_akurasi_m: 9,
    lokasi_lat: -7.8655,
    lokasi_lng: 111.4651,
    lokasi_radius_m: 150,
    lokasi_poligon: null,
    lokasi_pulang_lat: -7.9001,
    lokasi_pulang_lng: 111.4751,
    lokasi_pulang_radius_m: 120,
    lokasi_pulang_poligon: null,
    pulang_jam: '15:10:00',
    pulang_lat: -7.8998,
    pulang_lng: 111.4749,
    pulang_jarak_m: 26,
    pulang_akurasi_m: 12,
    lokasi_pulang: 'Rumah Uji',
    pulang_alasan_luar_radius: 'Mengantar dokumen ke dinas',
    masuk_status: 'hadir',
    pulang_status: 'normal',
    masuk_validasi: 'valid',
    pulang_validasi: 'menunggu',
    menit_terlambat: 0,
    jarak_m: 18,
    lokasi: 'Sekolah Uji',
    pengajuan_jenis: null,
    pengajuan_label: null,
    alasan_luar_radius: null,
    ada_foto: true,
    ada_foto_masuk: true,
    ada_foto_pulang: true,
    ...ubah,
  } as BarisMonitoring
}

describe('ringkasanSisi', () => {
  it('memakai kolom masuk_* untuk sisi datang', () => {
    const masuk = ringkasanSisi(barisUji(), 'masuk')

    expect(masuk.judul).toBe('Presensi datang')
    expect(masuk.ada).toBe(true)
    expect([masuk.lat, masuk.lng]).toEqual([-7.8654, 111.465])
    expect(masuk.jarakM).toBe(18)
    expect(masuk.akurasiM).toBe(9)
    expect(masuk.lokasiNama).toBe('Sekolah Uji')
    expect(masuk.lokasiLat).toBe(-7.8655)
    expect(masuk.radiusM).toBe(150)
    expect(masuk.validasi).toBe('valid')
    expect(masuk.alasan).toBeNull()
  })

  it('memakai kolom pulang_* untuk sisi pulang — bukan salinan sisi datang', () => {
    const pulang = ringkasanSisi(barisUji(), 'pulang')

    expect(pulang.judul).toBe('Presensi pulang')
    expect([pulang.lat, pulang.lng]).toEqual([-7.8998, 111.4749])
    expect(pulang.jarakM).toBe(26)
    expect(pulang.akurasiM).toBe(12)
    expect(pulang.lokasiNama).toBe('Rumah Uji')
    expect(pulang.lokasiLat).toBe(-7.9001)
    expect(pulang.lokasiLng).toBe(111.4751)
    expect(pulang.radiusM).toBe(120)
    expect(pulang.alasan).toBe('Mengantar dokumen ke dinas')
    expect(pulang.validasi).toBe('menunggu')
    expect(pulang.status).toBe('normal')
  })

  it('menandai sisi yang belum dipresensi dan tidak meminjam foto sisi lain', () => {
    const belumPulang = ringkasanSisi(
      barisUji({ pulang_jam: null, pulang_lat: null, pulang_lng: null, ada_foto_pulang: false }),
      'pulang',
    )

    expect(belumPulang.ada).toBe(false)
    expect(belumPulang.adaFoto).toBe(false)
    expect(belumPulang.jam).toBeNull()
  })

  it('jatuh ke kolom lama saat payload belum punya field sisi', () => {
    const lama = ringkasanSisi(
      barisUji({ masuk_jarak_m: null, masuk_akurasi_m: null, ada_foto_masuk: undefined }),
      'masuk',
    )

    expect(lama.jarakM).toBe(18) // dari jarak_m
    expect(lama.adaFoto).toBe(true) // dari ada_foto
  })
})

describe('labelStatusSisi', () => {
  it('menerjemahkan status kirim yang dikenal', () => {
    expect(labelStatusSisi('hadir')).toBe('Tepat waktu')
    expect(labelStatusSisi('terlambat')).toBe('Terlambat')
    expect(labelStatusSisi('normal')).toBe('Normal')
    expect(labelStatusSisi('pulang_cepat')).toBe('Pulang cepat')
    expect(labelStatusSisi(null)).toBe('—')
  })
})

describe('labelValidasi', () => {
  it('memberi lencana yang bisa dibaca pimpinan', () => {
    expect(labelValidasi('valid')).toEqual({ teks: 'Sah', varian: 'sukses' })
    expect(labelValidasi('menunggu')).toEqual({ teks: 'Menunggu keputusan', varian: 'menunggu' })
    expect(labelValidasi('disetujui').teks).toBe('Disetujui')
    expect(labelValidasi('ditolak').teks).toBe('Ditolak')
    expect(labelValidasi(null)).toEqual({ teks: '—', varian: 'netral' })
  })
})
