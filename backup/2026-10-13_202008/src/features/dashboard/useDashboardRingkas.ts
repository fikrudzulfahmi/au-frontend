import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api'

/**
 * Bagian 5.17 Dashboard — data pelengkap beranda.
 * Semua angka diambil dari endpoint yang sudah ada (tidak dihitung sendiri),
 * dan setiap permintaan punya cabang memuat / gagal / kosong di komponennya.
 */

/* ------------------------- 5.17 FR-DSH-01 (pegawai) ------------------------- */

export interface BarisRekapBulanan {
  pegawai_id: number
  nama: string
  hari_kerja: number
  hadir: number
  terlambat: number
  izin: number
  sakit: number
  dinas: number
  cuti: number
  alpa: number
  persen_kehadiran: number
}

export interface RekapBulanan {
  periode: string
  baris: BarisRekapBulanan[]
}

/** Ringkasan bulan ini; server sudah membatasi guru/pegawai ke dirinya sendiri (L(S)). */
export function useRekapBulanIni(aktif: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'rekap-bulan-ini'],
    queryFn: async () => {
      const res = await get<{ data: RekapBulanan }>('/laporan/presensi/rekap-pegawai', {
        periode: 'bulan_ini',
      })
      return res.data
    },
    enabled: aktif,
    staleTime: 60_000,
  })
}

export interface PengajuanRingkas {
  id: number
  jenis: string
  label_jenis: string
  tanggal_mulai: string
  tanggal_selesai: string
  status: string
  label_status: string
}

/** Pengajuan terakhir milik pengguna yang sedang masuk. */
export function usePengajuanTerakhir(aktif: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'pengajuan-terakhir'],
    queryFn: async () => {
      const res = await get<{ data: PengajuanRingkas[] }>('/pengajuan-izin', { per_page: 1 })
      return res.data[0] ?? null
    },
    enabled: aktif,
    staleTime: 60_000,
  })
}

/* ------------------------- 5.17 FR-DSH-02 (pimpinan) ------------------------ */

export interface AntreanPersetujuan {
  izin: number
  luarRadius: number
  presensiLuarRadius: number
}

/** Antrean persetujuan: pengajuan izin, pengajuan luar radius, presensi luar radius. */
export function useAntreanPersetujuan(aktif: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'antrean-persetujuan'],
    queryFn: async (): Promise<AntreanPersetujuan> => {
      const [izin, luar, presensi] = await Promise.all([
        get<{ meta?: { total?: number } }>('/pengajuan-izin', { status: 'menunggu', per_page: 1 }),
        get<{ meta?: { total?: number } }>('/pengajuan-luar-radius', {
          status: 'menunggu',
          per_page: 1,
        }),
        get<{ data: unknown[] }>('/monitoring/persetujuan-presensi'),
      ])
      return {
        izin: izin.meta?.total ?? 0,
        luarRadius: luar.meta?.total ?? 0,
        presensiLuarRadius: presensi.data?.length ?? 0,
      }
    },
    enabled: aktif,
    staleTime: 30_000,
  })
}

export interface BarisKepatuhanJurnal {
  pegawai_id: number
  nama: string
  terjadwal: number
  terisi: number
  belum_terisi: number
  persen_kepatuhan: number
}

export interface KepatuhanJurnal {
  guru: BarisKepatuhanJurnal[]
}

/** Guru yang belum mengisi jurnal untuk sesi hari ini (FR-DSH-02). */
export function useJurnalBelumTerisi(aktif: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'jurnal-belum-hari-ini'],
    queryFn: async () => {
      const res = await get<{ data: KepatuhanJurnal }>('/laporan/jurnal/kepatuhan', {
        periode: 'hari_ini',
      })
      return res.data
    },
    enabled: aktif,
    staleTime: 60_000,
  })
}

export interface PengumumanRingkas {
  id: number
  judul: string
  isi: string | null
  prioritas: string
}

/** Pengumuman yang benar-benar tayang untuk aplikasi (BR-36). */
export function usePengumumanAktif() {
  return useQuery({
    queryKey: ['dashboard', 'pengumuman-aktif'],
    queryFn: () => get<{ data: PengumumanRingkas[] }>('/pengumuman/aktif'),
    staleTime: 60_000,
  })
}
