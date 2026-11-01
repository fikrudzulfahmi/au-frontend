import { get } from '@/lib/api'
import { bersihkanParams } from '@/lib/crud'
import { unduhBerkasApi } from '@/lib/unduhan'
import type { HasilLaporan } from './types'

/** Format ekspor yang didukung semua laporan (KP-5.1). */
export type FormatEkspor = 'pdf' | 'excel'

/** Mengambil hasil laporan sebagai JSON untuk ditampilkan di web. */
export async function ambilLaporan(
  endpoint: string,
  params: Record<string, unknown>,
): Promise<HasilLaporan> {
  const respons = await get<{ data: HasilLaporan }>(endpoint, bersihkanParams(params))

  return respons.data
}

/**
 * Mengunduh laporan sebagai PDF atau Excel.
 *
 * `?format=` diteruskan ke server; nama berkas diambil dari header
 * `Content-Disposition` hasil server (KP-5.1).
 */
export async function unduhLaporan(
  endpoint: string,
  params: Record<string, unknown>,
  format: FormatEkspor,
  cadangan: string,
): Promise<string> {
  return unduhBerkasApi(endpoint, { ...bersihkanParams(params), format }, cadangan)
}
