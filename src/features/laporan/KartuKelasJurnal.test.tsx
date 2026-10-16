import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KartuKelasJurnal } from './KartuKelasJurnal'
import type { RingkasanKelasHarianItem, SesiKelasHarian } from './types'

/**
 * FR-LAP-13 — tampilan kartu per kelas di beranda admin & kepala sekolah.
 *
 * Inti yang diuji adalah janji datanya, bukan tata letaknya:
 * setiap sesi (jam + mapel + guru) muncul dengan keterangan sudah/belum
 * mengisi, sesi berhalangan dibedakan dari sesi yang lalai, dan kelas tanpa
 * jadwal tetap tampil tanpa terbaca sebagai "belum mengisi".
 */

function sesi(sebagian: Partial<SesiKelasHarian>): SesiKelasHarian {
  return {
    label_jam: 'Jam ke-1',
    jam_ke_mulai: 1,
    jam_ke_selesai: 1,
    mapel: 'Matematika',
    kode_mapel: 'MTK',
    guru_id: 1,
    nip: '197801012006041002',
    guru: 'Ahmad Fauzi, S.Pd.',
    jurnal_id: null,
    materi: null,
    status: 'belum',
    alasan: null,
    ...sebagian,
  }
}

function kelas(sebagian: Partial<RingkasanKelasHarianItem>): RingkasanKelasHarianItem {
  return {
    kelas_id: 1,
    nama: 'X RPL 1',
    sesi: 1,
    sudah: 0,
    belum: 1,
    berhalangan: 0,
    tanpa_jadwal: false,
    persen_terisi: 0,
    daftar: [sesi({})],
    ...sebagian,
  }
}

describe('KartuKelasJurnal', () => {
  it('menampilkan satu kartu per kelas beserta jam, mapel, dan gurunya', () => {
    const { container } = render(
      <KartuKelasJurnal
        data={[
          kelas({
            kelas_id: 1,
            nama: 'X RPL 1',
            sesi: 2,
            sudah: 1,
            belum: 1,
            daftar: [
              sesi({ label_jam: 'Jam ke-1', mapel: 'Matematika', status: 'sudah', jurnal_id: 7 }),
              sesi({
                label_jam: 'Jam ke-2',
                jam_ke_mulai: 2,
                mapel: 'Bahasa Indonesia',
                kode_mapel: 'BIN',
                guru: 'Siti Aminah, S.Pd.',
                status: 'belum',
              }),
            ],
          }),
        ]}
        tanggal="2026-10-16"
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks).toContain('X RPL 1')
    expect(teks).toContain('Jam ke-1')
    expect(teks).toContain('Matematika')
    expect(teks).toContain('Jam ke-2')
    expect(teks).toContain('Bahasa Indonesia')
    expect(teks).toContain('Siti Aminah, S.Pd.')

    // Keterangan per sesi harus eksplisit, bukan warna saja.
    expect(teks).toContain('Sudah mengisi')
    expect(teks).toContain('Belum mengisi')
  })

  it('membedakan sesi berhalangan dari sesi yang belum diisi', () => {
    const { container } = render(
      <KartuKelasJurnal
        data={[
          kelas({
            sesi: 2,
            sudah: 1,
            belum: 1,
            berhalangan: 1,
            daftar: [
              sesi({ label_jam: 'Jam ke-3', jam_ke_mulai: 3, status: 'berhalangan', alasan: 'Izin disetujui.' }),
              sesi({
                label_jam: 'Jam ke-4',
                jam_ke_mulai: 4,
                mapel: 'Jaringan Dasar',
                kode_mapel: 'JD',
                guru: 'Dewi Kartika, S.Kom.',
                status: 'belum',
              }),
            ],
          }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks).toContain('Berhalangan')
    expect(teks).toContain('Izin disetujui.')
    expect(teks).toContain('Jam ke-4')
  })

  it('tetap menampilkan kelas tanpa jadwal tanpa menuduhnya belum mengisi', () => {
    const { container } = render(
      <KartuKelasJurnal
        data={[
          kelas({
            kelas_id: 2,
            nama: 'XI TKJ 2',
            sesi: 0,
            sudah: 0,
            belum: 0,
            tanpa_jadwal: true,
            persen_terisi: null,
            daftar: [],
          }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks).toContain('XI TKJ 2')
    expect(teks).toContain('Tidak ada jadwal')
    expect(teks).toContain('Tidak ada jadwal pada hari ini.')
    expect(teks).not.toContain('Belum mengisi')
    expect(teks).toContain('Seluruh kelas dengan jadwal sudah mengisi jurnalnya.')
  })

  it('mengurutkan sesi menurut jam pelajaran', () => {
    const { container } = render(
      <KartuKelasJurnal
        data={[
          kelas({
            sesi: 2,
            sudah: 0,
            belum: 2,
            daftar: [
              sesi({ label_jam: 'Jam ke-4', jam_ke_mulai: 4, mapel: 'Jaringan Dasar' }),
              sesi({ label_jam: 'Jam ke-1', jam_ke_mulai: 1, mapel: 'Matematika' }),
            ],
          }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks.indexOf('Matematika')).toBeLessThan(teks.indexOf('Jaringan Dasar'))
  })

  it('menulis sesi dua jam sebagai rentang jam', () => {
    const { container } = render(
      <KartuKelasJurnal
        data={[
          kelas({
            sesi: 1,
            sudah: 0,
            belum: 1,
            daftar: [
              sesi({
                label_jam: 'Jam ke-3',
                jam_ke_mulai: 3,
                jam_ke_selesai: 4,
                mapel: 'Praktik Kerja Lapangan',
                kode_mapel: 'PKL',
              }),
            ],
          }),
        ]}
      />,
    )

    expect(container.textContent).toContain('Jam ke-3–4')
  })

  it('meringkas jumlah sesi yang belum mengisi', () => {
    const { container } = render(
      <KartuKelasJurnal
        data={[
          kelas({ kelas_id: 1, nama: 'X RPL 1', sesi: 2, sudah: 1, belum: 1 }),
          kelas({
            kelas_id: 2,
            nama: 'X TKJ 1',
            sesi: 1,
            sudah: 0,
            belum: 1,
            daftar: [sesi({ label_jam: 'Jam ke-1', mapel: 'Bahasa Inggris' })],
          }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks).toContain('2 sesi belum mengisi jurnal pada 2 kelas')
  })

  it('menampilkan keadaan kosong bila tidak ada data kelas', () => {
    render(<KartuKelasJurnal data={[]} />)

    expect(screen.getByText('Belum ada data kelas')).toBeDefined()
  })
})
