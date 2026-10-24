import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LokasiPresensi } from '@/lib/geolokasi'

// Leaflet asli memakai `window` saat modul dimuat dan menjalankan timer tile;
// di Vitest modul itu bisa termuat setelah lingkungan uji dibongkar sehingga CI
// gagal "window is not defined". Semua API yang dipakai peta dipalsukan di sini.
const lapisan = () => {
  const l: Record<string, unknown> = {}
  l.addTo = () => l
  l.bindPopup = () => l
  return l
}

const peta = { remove: vi.fn(), fitBounds: vi.fn(), setView: vi.fn() }
const panggilan = {
  map: vi.fn(() => peta),
  tileLayer: vi.fn(() => lapisan()),
  polygon: vi.fn(() => lapisan()),
  circle: vi.fn(() => lapisan()),
  circleMarker: vi.fn(() => lapisan()),
  marker: vi.fn(() => lapisan()),
  latLngBounds: vi.fn(() => ({})),
  control: { layers: vi.fn(() => lapisan()) },
}

vi.mock('leaflet', () => panggilan)

const { PetaPresensi } = await import('./PetaPresensi')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PetaPresensi', () => {
  it('menggambar zona poligon bila lokasi punya minimal 3 titik sudut', async () => {
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

    expect(getByLabelText('Peta lokasi presensi')).toBeDefined()
    await waitFor(() => expect(panggilan.map).toHaveBeenCalledTimes(1))
    expect(panggilan.polygon).toHaveBeenCalledTimes(1)
    expect(panggilan.circle).not.toHaveBeenCalled()
    expect(panggilan.circleMarker).toHaveBeenCalledTimes(1)
  })

  it('memakai lingkaran radius saat lokasi tidak punya poligon', async () => {
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

    render(<PetaPresensi daftarLokasi={lokasi} posisi={null} />)

    await waitFor(() => expect(panggilan.map).toHaveBeenCalledTimes(1))
    expect(panggilan.circle).toHaveBeenCalledTimes(1)
    expect(panggilan.polygon).not.toHaveBeenCalled()
  })
})
