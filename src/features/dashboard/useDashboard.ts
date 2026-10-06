import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api'

/**
 * Ringkasan presensi hari ini.
 * Fase 0: belum ada endpoint presensi, sehingga UI memakai data contoh (KP-0.5).
 * Fase 3 akan mengganti isi hook ini dengan `GET /presensi/hari-ini`.
 */
export interface PresensiHariIni {
  jam_datang: string | null
  jam_pulang: string | null
  status_masuk: 'hadir' | 'terlambat' | null
  validasi: 'valid' | 'menunggu' | 'disetujui' | 'ditolak' | null
  menit_terlambat: number
  menit_kerja: number
  menit_kerja_target: number
  libur: boolean
  keterangan_libur: string | null
  /** true bila hari ini izin/sakit/cuti disetujui sehingga presensi tidak diwajibkan. */
  berhalangan: boolean
  jenis_berhalangan: 'izin' | 'sakit' | 'cuti' | 'dinas' | null
}

const CONTOH: PresensiHariIni = {
  jam_datang: '07:01:12',
  jam_pulang: null,
  status_masuk: 'terlambat',
  validasi: 'valid',
  menit_terlambat: 2,
  menit_kerja: 114,
  menit_kerja_target: 300,
  libur: false,
  keterangan_libur: null,
  berhalangan: false,
  jenis_berhalangan: null,
}

export function usePresensiHariIni() {
  return useQuery({
    queryKey: ['presensi', 'hari-ini'],
    queryFn: async () => {
      try {
        const res = await get<{ data: PresensiHariIni }>('/presensi/hari-ini')
        return res.data
      } catch {
        // Fase 0 — fallback data contoh sampai endpoint presensi tersedia (Fase 3).
        return CONTOH
      }
    },
    staleTime: 15_000,
  })
}

/** Ringkasan hari ini untuk admin/kepsek/wakasek. Fase 0: data contoh. */
export interface RingkasanHaris {
  total_pegawai: number
  hadir: number
  terlambat: number
  belum: number
  izin: number
  dinas: number
}

const CONTOH_RINGKASAN: RingkasanHaris = {
  total_pegawai: 12,
  hadir: 9,
  terlambat: 1,
  belum: 1,
  izin: 1,
  dinas: 0,
}

export function useRingkasanHariIni() {
  return useQuery({
    queryKey: ['dashboard', 'ringkasan-hari-ini'],
    queryFn: async () => {
      try {
        const res = await get<{ data: RingkasanHaris }>('/monitoring/presensi-harian/ringkasan')
        return res.data
      } catch {
        return CONTOH_RINGKASAN
      }
    },
    staleTime: 30_000,
  })
}
