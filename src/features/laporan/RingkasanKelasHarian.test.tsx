import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RingkasanKelasHarian } from './RingkasanKelasHarian'
import type { RingkasanKelasHarianItem } from './types'

/**
 * FR-LAP-13 — dasbor jurnal per kelas untuk admin & kepala sekolah.
 *
 * Inti yang diuji bukan tata letaknya, melainkan janji datanya: SELURUH kelas
 * tampil, dan kelas tanpa jadwal tidak pernah terbaca sebagai "belum terisi".
 * Teks dibaca lewat `container.textContent` karena satu baris tabel dirakit dari
 * beberapa simpul teks, sehingga pencocokan per elemen akan rapuh.
 */

function kelas(sebagian: Partial<RingkasanKelasHarianItem>): RingkasanKelasHarianItem {
  return {
    kelas_id: 1,
    nama: 'X RPL 1',
    sesi: 3,
    sudah: 3,
    belum: 0,
    berhalangan: 0,
    tanpa_jadwal: false,
    persen_terisi: 100,
    daftar: [],
    ...sebagian,
  }
}

describe('RingkasanKelasHarian', () => {
  it('menampilkan seluruh kelas, termasuk yang tidak punya jadwal', () => {
    const { container } = render(
      <RingkasanKelasHarian
        data={[
          kelas({ kelas_id: 1, nama: 'X RPL 1', sudah: 2, belum: 1, persen_terisi: 66.7 }),
          kelas({
            kelas_id: 2,
            nama: 'XI TKJ 2',
            sesi: 0,
            sudah: 0,
            belum: 0,
            tanpa_jadwal: true,
            persen_terisi: null,
          }),
          kelas({ kelas_id: 3, nama: 'XII AKL 1' }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    // Seluruh kelas muncul — tidak ada yang disembunyikan karena sudah aman.
    expect(teks).toContain('X RPL 1')
    expect(teks).toContain('XI TKJ 2')
    expect(teks).toContain('XII AKL 1')

    // Kelas tanpa jadwal diberi label sendiri, bukan "belum terisi".
    expect(teks).toContain('Tidak ada jadwal')
    expect(teks).toContain('Tidak ada sesi terjadwal pada hari ini')
    expect(teks).toContain('1 belum diisi')
    expect(teks).toContain('Lengkap')
    expect(teks).toContain('3 kelas terdaftar')
    // Angka diberi satuan dan pembandingnya, bukan telanjang.
    expect(teks).toContain('6 jam terjadwal')
  })

  it('menyebut nama kelas yang belum lengkap pada peringatan', () => {
    const { container } = render(
      <RingkasanKelasHarian
        data={[
          kelas({ kelas_id: 1, nama: 'X RPL 1', sudah: 1, belum: 2, persen_terisi: 33.3 }),
          kelas({ kelas_id: 2, nama: 'XI TKJ 2' }),
          kelas({ kelas_id: 3, nama: 'XII AKL 1' }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks).toContain('1 dari 3 kelas belum lengkap')
    expect(teks).toContain('2 belum diisi')
  })

  it('tidak menuduh kelas tanpa jadwal sebagai belum lengkap', () => {
    const { container } = render(
      <RingkasanKelasHarian
        data={[
          kelas({
            kelas_id: 2,
            nama: 'XI TKJ 2',
            sesi: 0,
            sudah: 0,
            belum: 0,
            tanpa_jadwal: true,
            persen_terisi: null,
          }),
        ]}
      />,
    )

    expect(container.textContent).toContain('Seluruh kelas dengan jadwal sudah mengisi jurnalnya.')
    expect(container.textContent).not.toContain('belum lengkap')
  })

  it('menyebut jam dan mapel yang masih menggantung', () => {
    const { container } = render(
      <RingkasanKelasHarian
        data={[
          kelas({
            kelas_id: 1,
            nama: 'X RPL 1',
            sesi: 3,
            sudah: 2,
            belum: 1,
            persen_terisi: 66.7,
            daftar: [
              {
                label_jam: 'Jam ke-3',
                jam_ke_mulai: 3,
                jam_ke_selesai: 3,
                mapel: 'Pemrograman Web',
                kode_mapel: 'PW',
                guru_id: 9,
                nip: '197801012006041002',
                guru: 'Ahmad Fauzi S.Pd.',
                jurnal_id: null,
                materi: null,
                status: 'belum',
                alasan: null,
              },
            ],
          }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks).toContain('Jam ke-3')
    expect(teks).toContain('Pemrograman Web')
    expect(teks).toContain('Ahmad Fauzi S.Pd.')
  })

  it('menjelaskan arti berhalangan dan cara hitung persentase', () => {
    const { container } = render(
      <RingkasanKelasHarian
        periode="16 Oktober 2026"
        data={[
          kelas({ kelas_id: 1, nama: 'X RPL 1', sesi: 4, sudah: 1, belum: 2, berhalangan: 1 }),
        ]}
      />,
    )

    const teks = container.textContent ?? ''

    // Judul menyebut periode agar blok tidak ambigu bila laporan berganti tanggal.
    expect(teks).toContain('Ringkasan per Kelas · 16 Oktober 2026')

    // Total di kepala blok diberi satuan.
    expect(teks).toContain('4 jam terjadwal')
    expect(teks).toContain('2 belum diisi')
    expect(teks).toContain('33,3% keterisian')

    // Catatan kaki menjelaskan kolom yang mudah disalahpahami.
    expect(teks).toContain('Berhalangan (izin)')
    expect(teks).toContain('tidak dihitung sebagai belum diisi')
    expect(teks).toContain('% keterisian')
  })

  it('menampilkan keadaan kosong bila tidak ada data kelas', () => {
    render(<RingkasanKelasHarian data={[]} />)

    expect(screen.getByText('Belum ada data kelas')).toBeDefined()
  })
})

describe('RingkasanKelasHarian — hari libur', () => {
  it('menerangkan hari libur dan tidak menyebut kelas belum terisi', () => {
    const { container } = render(
      <RingkasanKelasHarian
        data={[]}
        periode="17 Oktober 2026"
        libur={{ ada: true, keterangan: 'Libur sekolah' }}
      />,
    )

    const teks = container.textContent ?? ''

    expect(teks).toContain('Hari libur: Libur sekolah')
    expect(teks).toContain('tidak ada jurnal yang wajib diisi')
    expect(teks).not.toContain('Belum ada data kelas')
    expect(screen.queryByRole('table')).toBeNull()
  })
})
