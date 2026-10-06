import { describe, expect, it } from 'vitest'

import type { RekapTv } from './types'
import {
  MAKS_BARIS_KOLOM,
  bagiKolomTv,
  durasiMarqueeDetik,
  faktorSkalaFont,
  pindaiKunciTerlarang,
  potongTeks,
} from './logika'

function rekapContoh(): RekapTv {
  const pegawai = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ inisial: `P${i}`, nama: `Pegawai ${i}` }))

  return {
    server: { waktu: '07:01:02', tanggal: '2026-10-06', nama_hari: 'Selasa', zona: 'Asia/Jakarta' },
    presensi: {
      tanggal: '2026-10-06',
      nama_hari: 'Selasa',
      hari_libur: null,
      ringkasan: [
        { label: 'Hadir', nilai: 3 },
        { label: 'Belum Presensi', nilai: 9 },
      ],
      sudah_presensi: pegawai(3),
      belum_presensi: pegawai(9),
    },
    jurnal: {
      tersedia: true,
      terjadwal: 24,
      terisi: 6,
      belum_terisi: 18,
      berhalangan: 0,
      persen: 25,
      guru_belum: Array.from({ length: 18 }, (_, i) => ({
        inisial: `G${i}`,
        nama: `Guru ${i}`,
        kelas: 'X RPL 1',
        mapel: 'Matematika',
        label_jam: 'Jam ke-1',
      })),
      presensi_siswa: { hadir: 10, sakit: 0, izin: 0, alpa: 0, total: 10, persen_hadir: 100 },
    },
    perizinan: {
      ringkasan: [{ label: 'Pengajuan', nilai: 2 }],
      daftar: Array.from({ length: 8 }, (_, i) => ({
        inisial: `Z${i}`,
        nama: `Pegawai Izin ${i}`,
        jenis: 'izin',
        label_jenis: 'Izin',
        sampai: '2026-10-06',
      })),
      tampilkan_alasan: false,
    },
    pengumuman: {
      kartu: [{ judul: 'Rapat', isi: 'Rapat guru jam 13.00', tipe: 'pengumuman', prioritas: 'normal', penting: false }],
      teks_berjalan: ['Selamat datang di sekolah'],
    },
    ulang_tahun: { aktif: true, daftar: [] },
    pengaturan: {
      interval_detik: 30,
      tema: 'gelap',
      skala_font: 'besar',
      rotasi_panel_detik: 10,
      kecepatan_scroll: 'normal',
      tampilkan_alasan_izin: false,
      tampilkan_ulang_tahun: true,
    },
  }
}

describe('logika layar TV', () => {
  it('membentuk tiga kolom dengan urutan presensi, jurnal, perizinan', () => {
    const kolom = bagiKolomTv(rekapContoh())

    expect(kolom).toHaveLength(3)
    expect(kolom.map((k) => k.kunci)).toEqual(['presensi', 'jurnal', 'perizinan'])
    expect(kolom[0]?.judul).toBe('Presensi Pegawai')
    expect(kolom[1]?.ringkasan).toEqual([
      { label: 'Terjadwal', nilai: 24 },
      { label: 'Terisi', nilai: 6 },
      { label: 'Belum Terisi', nilai: 18 },
      { label: 'Persen', nilai: 25 },
    ])
  })

  it('membatasi jumlah baris agar tidak perlu gulir (KP-6.9)', () => {
    const kolom = bagiKolomTv(rekapContoh())

    for (const k of kolom) {
      expect(k.jumlahBaris).toBeLessThanOrEqual(MAKS_BARIS_KOLOM)
    }
    expect(kolom[0]?.jumlahBaris).toBe(6)
    expect(kolom[1]?.jumlahBaris).toBe(6)
    expect(kolom[2]?.jumlahBaris).toBe(6)
  })

  it('menandai kunci terlarang pada data bersarang (BR-33)', () => {
    const kotor = {
      presensi: { sudah_presensi: [{ nama: 'A', foto_selfie: 'x.jpg', jarak_m: 12 }] },
      pegawai: { NIP: '123' },
    }

    expect(pindaiKunciTerlarang(kotor)).toEqual(['foto_selfie', 'jarak_m', 'nip'])
  })

  it('tidak menandai apa pun pada rekap bersih', () => {
    expect(pindaiKunciTerlarang(rekapContoh())).toEqual([])
    expect(pindaiKunciTerlarang(rekapContoh()).length).toBe(0)
  })

  it('memetakan kecepatan teks berjalan dan skala font', () => {
    expect(durasiMarqueeDetik('lambat')).toBeGreaterThan(durasiMarqueeDetik('normal'))
    expect(durasiMarqueeDetik('cepat')).toBeLessThan(durasiMarqueeDetik('normal'))
    expect(faktorSkalaFont('normal')).toBeLessThan(faktorSkalaFont('besar'))
    expect(faktorSkalaFont('ekstra_besar')).toBeGreaterThan(faktorSkalaFont('besar'))
  })

  it('memotong teks panjang tanpa menghilangkan isi pendek', () => {
    expect(potongTeks('  Selamat   datang ', 40)).toBe('Selamat datang')
    expect(potongTeks('x'.repeat(50), 10)).toHaveLength(10)
    expect(potongTeks('x'.repeat(50), 10).endsWith('…')).toBe(true)
  })
})
