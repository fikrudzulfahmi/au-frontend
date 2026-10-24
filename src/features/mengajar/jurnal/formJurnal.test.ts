import { describe, expect, it } from 'vitest'

import { isiFormDariJurnal } from './formJurnal'
import type { JurnalLengkap } from './types'

function jurnal(ubah: Partial<JurnalLengkap> = {}): JurnalLengkap {
  return {
    id: 9,
    tanggal: '2026-10-05',
    label_jam: 'Jam 1–2',
    jam_ke_mulai: 1,
    jam_ke_selesai: 2,
    plotting_mapel_id: 4,
    kelas_id: 3,
    materi: 'Jaringan dasar',
    kegiatan: 'Praktik kabel UTP',
    catatan: null,
    jumlah_foto: 1,
    ringkasan: { H: 2, S: 1, I: 0, A: 0, B: 0, T: 0 },
    diubah_pada: null,
    diisi_oleh_pegawai_id: null,
    presensi_siswa: [
      { siswa_id: 11, nis: '001', nama: 'Ani', jenis_kelamin: 'P', status: 'H', label_status: 'Hadir', keterangan: null },
      { siswa_id: 12, nis: '002', nama: 'Budi', jenis_kelamin: 'L', status: 'S', label_status: 'Sakit', keterangan: 'Demam' },
    ],
    foto: [{ id: 3, urutan: 1 }],
    ...ubah,
  } as JurnalLengkap
}

describe('isiFormDariJurnal', () => {
  it('membawa kembali materi, kegiatan, dan presensi siswa saat jurnal diubah', () => {
    const isi = isiFormDariJurnal(jurnal())

    expect(isi.materi).toBe('Jaringan dasar')
    expect(isi.kegiatan).toBe('Praktik kabel UTP')
    expect(isi.baris[11]).toEqual({ status: 'H', keterangan: '' })
    expect(isi.baris[12]).toEqual({ status: 'S', keterangan: 'Demam' })
  })

  it('mengubah catatan dan keterangan kosong menjadi string kosong', () => {
    const isi = isiFormDariJurnal(jurnal({ catatan: null }))

    expect(isi.catatan).toBe('')
    expect(Object.values(isi.baris).every((b) => typeof b.keterangan === 'string')).toBe(true)
  })
})
