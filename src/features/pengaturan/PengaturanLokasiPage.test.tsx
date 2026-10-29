import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
|--------------------------------------------------------------------------
| Form ubah lokasi presensi WAJIB memuat kembali zona poligon tersimpan
|--------------------------------------------------------------------------
| Keluhan lapangan: area poligon yang sudah digambar tidak tampil lagi saat
| lokasi dibuka untuk diubah. Uji ini mengunci jalur datanya: daftar lokasi
| (GET /pengaturan/lokasi) membawa `poligon`, dan modal ubah harus membuka
| mode Poligon dengan seluruh titik sudutnya.
*/

const POLIGON: Array<[number, number]> = [
  [-7.8654, 111.464],
  [-7.8644, 111.464],
  [-7.8644, 111.466],
  [-7.8654, 111.466],
]

const lokasiTersimpan = {
  id: 7,
  nama: 'SMK Anharul Ulum',
  latitude: -7.8654,
  longitude: 111.465,
  radius_m: 100,
  poligon: POLIGON,
  is_default: true,
  is_active: true,
  jumlah_pegawai: 12,
}

const getPalsu = vi.fn(async (jalur: string) => {
  if (jalur === '/pengaturan/lokasi') return { data: [lokasiTersimpan] }
  return { data: [] }
})

vi.mock('@/lib/api', () => ({
  get: (jalur: string) => getPalsu(jalur),
  pesanError: () => 'galat',
}))

vi.mock('@/lib/crud', () => ({
  master: { buat: vi.fn(), ubah: vi.fn(), hapus: vi.fn() },
  aksi: vi.fn(),
  pesanPerBidang: () => ({}),
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', nama: 'Admin', peran: ['admin'], pegawai_id: null },
  }),
}))

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ sukses: vi.fn(), gagal: vi.fn() }),
}))

// Peta dipalsukan: yang diuji adalah state poligon editor, bukan Leaflet.
vi.mock('leaflet', () => ({ default: {} }))

vi.mock('react-leaflet', () => {
  const Anak = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  const BaseLayer = () => null
  const Kosong = () => null
  return {
    MapContainer: Anak,
    TileLayer: Kosong,
    Circle: Kosong,
    CircleMarker: Kosong,
    Polyline: Kosong,
    LayersControl: Object.assign(Anak, { BaseLayer }),
    Polygon: ({ positions }: { positions: Array<[number, number]> }) => (
      <div data-testid="poligon" data-titik={positions.length} />
    ),
    useMap: () => ({ invalidateSize: () => {} }),
    useMapEvents: () => ({}),
  }
})

const { PengaturanLokasiPage } = await import('./PengaturanLokasiPage')

function renderHalaman() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <PengaturanLokasiPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  getPalsu.mockClear()
})

describe('PengaturanLokasiPage — memuat ulang zona poligon', () => {
  it('membuka modal ubah dalam mode Poligon dengan seluruh titik tersimpan', async () => {
    renderHalaman()

    const tombolUbah = await screen.findByLabelText('Ubah SMK Anharul Ulum')
    fireEvent.click(tombolUbah)

    await screen.findByRole('heading', { name: /Ubah Lokasi/i })
    await waitFor(() => expect(screen.getByTestId('poligon').dataset.titik).toBe('4'))
    expect(screen.getByRole('button', { name: /Poligon \(4 titik\)/ })).toBeDefined()
  })

  it('menampilkan label zona poligon pada kartu lokasi, bukan radius', async () => {
    renderHalaman()

    await screen.findByLabelText('Ubah SMK Anharul Ulum')
    expect(screen.getByText(/Zona/).textContent).toContain('poligon')
  })
})
