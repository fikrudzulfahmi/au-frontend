import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api'
import { ambilStatusHariIni } from '@/features/presensi/api'
import type { MonitoringHarian, StatusHariIni } from '@/features/presensi/types'

export type { StatusHariIni }

/**
 * Status presensi hari ini milik pengguna. Bentuk mengikuti endpoint aktual
 * `/presensi/hari-ini` (StatusHariIni); tidak ada lagi data contoh "Fase 0".
 */
export function usePresensiHariIni() {
  return useQuery({
    queryKey: ['presensi', 'hari-ini'],
    queryFn: async () => (await ambilStatusHariIni()).data,
    staleTime: 15_000,
  })
}

/** Ringkasan hari ini untuk admin/kepsek/wakasek (FR-DSH-02). */
export interface RingkasanHaris {
  total_pegawai: number
  hadir: number
  terlambat: number
  belum: number
  izin: number
  dinas: number
}

/**
 * Ringkasan hari ini diambil dari endpoint `harian` (yang memang mengirim
 * `ringkasan`), bukan endpoint `/ringkasan` yang tidak ada.
 */
export function useRingkasanHariIni() {
  return useQuery({
    queryKey: ['dashboard', 'ringkasan-hari-ini'],
    queryFn: async (): Promise<RingkasanHaris> => {
      const res = await get<{ data: MonitoringHarian }>('/monitoring/presensi-harian')
      const r = res.data.ringkasan

      return {
        total_pegawai: res.data.baris.length,
        hadir: r.hadir ?? 0,
        terlambat: r.terlambat ?? 0,
        belum: r.belum_presensi ?? 0,
        izin: r.berhalangan ?? 0,
        dinas: 0,
      }
    },
    staleTime: 30_000,
  })
}
