import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PetaPresensi } from './PetaPresensi'
import type { LokasiPresensi } from '@/lib/geolokasi'

describe('PetaPresensi', () => {
  it('merender wadah peta presensi dengan lokasi zona poligon', () => {
    const lokasi: LokasiPresensi[] = [
      {
        id: 1,
        nama: 'SMK Anharul Ulum',
        latitude: -7.8654,
        longitude: 111.465,
        radius_m: 100,
        is_default: true,
        poligon: [
          [-7.865, 111.464],
          [-7.866, 111.464],
          [-7.866, 111.466],
        ],
      },
    ]

    const { getByLabelText } = render(
      <PetaPresensi daftarLokasi={lokasi} posisi={{ lat: -7.8654, lng: 111.465, akurasi_m: 10 }} />,
    )

    const kontainer = getByLabelText('Peta lokasi presensi')
    expect(kontainer).toBeDefined()
  })

  it('merender wadah peta presensi dengan lokasi lingkaran radius (poligon null)', () => {
    const lokasi: LokasiPresensi[] = [
      {
        id: 2,
        nama: 'Lokasi Alternatif',
        latitude: -7.87,
        longitude: 111.47,
        radius_m: 80,
        is_default: false,
        poligon: null,
      },
    ]

    const { getByLabelText } = render(
      <PetaPresensi daftarLokasi={lokasi} posisi={null} />,
    )

    const kontainer = getByLabelText('Peta lokasi presensi')
    expect(kontainer).toBeDefined()
  })
})
