import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api'
import { master } from '@/lib/crud'
import { useSemester } from '@/features/akademik/useSemester'
import type { Kelas } from '@/features/master/types'

/** Pegawai ringkas untuk pemilih filter laporan (FR-LAP-01/02/04/05/07..09). */
export interface PegawaiRingkas {
  id: number
  nip: string
  nama: string
  jenis_pegawai: 'guru' | 'struktural'
}

export interface MapelRingkas {
  id: number
  kode: string
  nama: string
}

export interface PenandatanganLaporan {
  id: number
  jabatan: string
  nama: string
  nip: string | null
  urutan: number
  is_default: boolean
  is_active: boolean
  ada_ttd: boolean
  ada_stempel: boolean
}

export interface PengaturanDokumenLaporan {
  kop: {
    baris1: string | null
    baris2: string | null
    baris3: string | null
    alamat: string | null
    tampilkan_logo_kiri: boolean
    tampilkan_logo_kanan: boolean
  }
  tanda_tangan: {
    kota_penetapan: string | null
    mode_tanggal: 'otomatis' | 'manual'
    tanggal_manual: string | null
    posisi: 'kanan' | 'kiri' | 'dua_kolom'
    tampilkan_mengetahui: boolean
  }
  maks_penandatangan: number
  penandatangan: PenandatanganLaporan[]
}

/**
 * Master data untuk filter laporan.
 *
 * Semuanya dimuat sekali per halaman dan dipakai bersama. Server membatasi
 * `per_page` pada 100; jumlah pegawai/kelas/mapel satu sekolah SMK jauh di
 * bawah batas itu, sehingga satu permintaan sudah memuat seluruh daftar.
 * Bila kelak melebihi 100, pemilih filter perlu diberi pencarian tersendiri.
 */
export function useDataLaporan() {
  const pegawai = useQuery({
    queryKey: ['laporan', 'master', 'pegawai'],
    queryFn: () => master.daftar<PegawaiRingkas>('/pegawai', { per_page: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const kelas = useQuery({
    queryKey: ['laporan', 'master', 'kelas'],
    queryFn: () => master.daftar<Kelas>('/kelas', { per_page: 200 }),
    staleTime: 5 * 60 * 1000,
  })

  const mapel = useQuery({
    queryKey: ['laporan', 'master', 'mapel'],
    queryFn: () => master.daftar<MapelRingkas>('/mapel', { per_page: 200 }),
    staleTime: 5 * 60 * 1000,
  })

  const semester = useSemester()

  return {
    pegawai: pegawai.data?.data ?? [],
    kelas: kelas.data?.data ?? [],
    mapel: mapel.data?.data ?? [],
    semester: semester.semesterAktif,
    daftarSemester: semester.semuaSemester,
  }
}

/**
 * FR-KOP-02..04 — pengaturan kop & penandatangan yang boleh dibaca pembuka
 * laporan (endpoint khusus di bawah grup `laporan`, bukan pengaturan admin).
 */
export function usePengaturanDokumen() {
  return useQuery({
    queryKey: ['laporan', 'pengaturan-dokumen'],
    queryFn: () => get<{ data: PengaturanDokumenLaporan }>('/laporan/pengaturan-dokumen'),
    staleTime: 5 * 60 * 1000,
  })
}
