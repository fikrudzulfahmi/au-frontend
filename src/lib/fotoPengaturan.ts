import { useQuery } from '@tanstack/react-query'

import { get } from './api'

/**
 * Setelan kompresi foto dari menu Pengaturan Sistem.
 *
 * Nilainya adalah *batas hasil kompresi*, bukan syarat berkas asal: foto
 * berukuran berapa pun diterima klien lalu dikompres ke batas ini sebelum
 * dikirim. Bila permintaan belum selesai atau gagal, nilai bawaan dipakai agar
 * unggahan tetap berjalan.
 */
export interface PengaturanFoto {
  /** Sisi terpanjang hasil kompres (piksel). */
  sisiMaks: number
  /** Kualitas JPEG 20–95. */
  kualitas: number
  /** Batas ukuran hasil kompres (KB). */
  targetKb: number
}

export const FOTO_BAWAAN: PengaturanFoto = { sisiMaks: 800, kualitas: 72, targetKb: 150 }

interface JawabanFoto {
  data?: { max_sisi_px?: number; kualitas_jpeg?: number; target_maks_kb?: number }
}

function batasi(nilai: number, minimal: number, maksimal: number): number {
  if (!Number.isFinite(nilai)) return minimal

  return Math.min(maksimal, Math.max(minimal, Math.round(nilai)))
}

/** Menormalkan jawaban API menjadi setelan yang aman dipakai kompresor. */
export function normalkanFoto(jawaban?: JawabanFoto['data']): PengaturanFoto {
  return {
    sisiMaks: batasi(jawaban?.max_sisi_px ?? FOTO_BAWAAN.sisiMaks, 200, 2000),
    kualitas: batasi(jawaban?.kualitas_jpeg ?? FOTO_BAWAAN.kualitas, 20, 95),
    targetKb: batasi(jawaban?.target_maks_kb ?? FOTO_BAWAAN.targetKb, 50, 1000),
  }
}

export function usePengaturanFoto(): PengaturanFoto {
  const { data } = useQuery({
    queryKey: ['pengaturan', 'foto'],
    queryFn: () => get<JawabanFoto>('/pengaturan/foto'),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })

  return normalkanFoto(data?.data)
}
