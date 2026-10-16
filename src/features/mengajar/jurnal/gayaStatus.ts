import type { StatusSiswa } from './types'

/**
 * Warna tombol status presensi siswa (FR-JRN-03).
 *
 * Dipisah dari halamannya agar bisa diperiksa uji: setiap status pada
 * `STATUS_SISWA` wajib punya warna, sehingga menambah status baru tidak pernah
 * menghasilkan tombol tanpa warna (atau warna bawaan yang tak sengaja).
 */
export const GAYA_STATUS: Record<StatusSiswa, string> = {
  H: 'bg-success-soft text-success ring-success',
  S: 'bg-purple-soft text-purple ring-purple',
  I: 'bg-info-soft text-info ring-info',
  A: 'bg-danger-soft text-danger ring-danger',
  B: 'bg-gray-soft text-gray ring-gray',
  T: 'bg-pending-soft text-pending ring-pending',
}
