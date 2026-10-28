import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DetailJurnalDialog } from './DetailJurnalDialog'
import type { DetailJurnal } from './types'

/**
 * FR-LAP-07 — pratinjau read-only isi jurnal untuk admin/kepala sekolah/wakasek.
 *
 * Yang dijaga di sini adalah janji datanya: materi, kegiatan, rekap H/S/I/A/B/T,
 * daftar siswa beserta statusnya, dan foto kegiatan tampil; serta bukti bahwa
 * akses baca memakai rute laporan (bukan rute jurnal Fase 4 yang tidak terbuka
 * untuk kepala sekolah).
 */

const ambilDetailJurnal = vi.fn()
const urlFotoBerpelindung = vi.fn()

vi.mock('./api', () => ({
  ambilDetailJurnal: (...args: unknown[]) => ambilDetailJurnal(...args),
}))

vi.mock('@/lib/api', async (asal) => {
  const asli = await asal<typeof import('@/lib/api')>()

  return {
    ...asli,
    urlFotoBerpelindung: (...args: unknown[]) => urlFotoBerpelindung(...args),
  }
})

function detail(sebagian: Partial<DetailJurnal> = {}): DetailJurnal {
  return {
    id: 21,
    tanggal: '2026-10-19',
    label_jam: '1–3',
    jam_ke_mulai: 1,
    jam_ke_selesai: 3,
    kelas: 'X RPL 1',
    mapel: 'Informatika',
    kode_mapel: 'INF',
    nip: '198501012010011003',
    guru: 'Ahmad Fauzi, S.Pd.',
    guru_keterangan: 'Ahmad Fauzi, S.Pd. (diisi guru piket: Budi Santoso, S.Kom.)',
    diisi_oleh: 'Budi Santoso, S.Kom.',
    materi: 'Struktur algoritma',
    kegiatan: 'Latihan pseudocode',
    catatan: 'Kelas kondusif',
    ringkasan: { H: 2, S: 1, I: 0, A: 0, B: 0, T: 0 },
    presensi_siswa: [
      {
        siswa_id: 1,
        nis: '24001',
        nama: 'Ani Lestari',
        jenis_kelamin: 'P',
        status: 'H',
        label_status: 'Hadir',
        keterangan: null,
      },
      {
        siswa_id: 2,
        nis: '24002',
        nama: 'Bayu Pratama',
        jenis_kelamin: 'L',
        status: 'S',
        label_status: 'Sakit',
        keterangan: 'Demam',
      },
    ],
    foto: [{ id: 5, urutan: 1, url: '/api/v1/laporan/jurnal/21/foto/5' }],
    ...sebagian,
  }
}

function renderDialog(id: number | null = 21) {
  const klien = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={klien}>
      <DetailJurnalDialog id={id} onTutup={() => {}} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  ambilDetailJurnal.mockReset()
  urlFotoBerpelindung.mockReset()
  ambilDetailJurnal.mockResolvedValue(detail())
  urlFotoBerpelindung.mockResolvedValue('blob:foto-uji')
  // jsdom tidak menyediakan penampil gambar; object URL cukup dipalsukan.
  URL.createObjectURL = vi.fn(() => 'blob:uji')
  URL.revokeObjectURL = vi.fn()
})

describe('DetailJurnalDialog', () => {
  it('menampilkan materi, kegiatan, siswa, dan rekap status jurnal', async () => {
    const { container } = renderDialog()

    await waitFor(() => expect(container.textContent).toContain('Struktur algoritma'))

    const teks = container.textContent ?? ''
    expect(teks).toContain('Latihan pseudocode')
    expect(teks).toContain('Kelas kondusif')
    expect(teks).toContain('X RPL 1')
    expect(teks).toContain('Informatika')
    // Guru piket tetap terbaca sebagai pengisi sesi.
    expect(teks).toContain('diisi guru piket: Budi Santoso')
    // Daftar siswa lengkap dengan status dan keterangannya.
    expect(teks).toContain('Ani Lestari')
    expect(teks).toContain('Hadir')
    expect(teks).toContain('Bayu Pratama')
    expect(teks).toContain('Sakit')
    expect(teks).toContain('Demam')
    // Rekap H/S/I/A/B/T.
    expect(teks).toContain('H: 2')
    expect(teks).toContain('S: 1')
  })

  it('mengambil detail lewat rute laporan dan memuat foto dengan token', async () => {
    renderDialog()

    await waitFor(() => expect(ambilDetailJurnal).toHaveBeenCalledWith(21))
    await waitFor(() =>
      expect(urlFotoBerpelindung).toHaveBeenCalledWith('/laporan/jurnal/21/foto/5'),
    )
  })

  it('tidak meminta data saat dialog tertutup', async () => {
    renderDialog(null)

    expect(ambilDetailJurnal).not.toHaveBeenCalled()
  })

  it('menjelaskan jurnal tanpa daftar presensi siswa tanpa menampilkan tabel kosong', async () => {
    ambilDetailJurnal.mockResolvedValue(detail({ presensi_siswa: [], foto: [] }))
    const { container } = renderDialog()

    await waitFor(() =>
      expect(container.textContent).toContain('tidak memuat daftar presensi siswa'),
    )

    expect(container.querySelector('table')).toBeNull()
    expect(screen.queryByText(/Foto kegiatan/)).toBeNull()
  })

  it('menampilkan pesan galat bila detail gagal dimuat', async () => {
    ambilDetailJurnal.mockRejectedValue(new Error('Anda tidak berhak atas jurnal ini.'))
    const { container } = renderDialog()

    await waitFor(() => expect(container.textContent).toContain('tidak berhak'))
  })
})
