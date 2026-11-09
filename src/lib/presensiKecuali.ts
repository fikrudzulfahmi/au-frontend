/** Ekspor fungsi untuk pengelolaan kecualian WFA (Work From Area) per tanggal.
 *  Fitur ini memungkinkan admin membuat pengecualian jadwal WFA untuk tanggal tertentu,
 *  sehingga guru yang dijadwalkan WFA tetap bisa absen sebagai hadir di kantor.
 */

import { get, post } from '@/lib/api'

/** Data kecualian WFA per tanggal */
export interface KecualiWFA {
  id: number
  pegawai_id: number
  tanggal: string         // format: YYYY-MM-DD
  jenis: 'masuk_kantor' | 'dinas' | 'izin' | 'cuti'
  alasan: string
  dibuat_oleh_admin: boolean
  dibuat_pada: string
}

/** Parameters untuk membuat kecualian */
export interface BuatKecualiParams {
  pegawai_id: number
  tanggal: string         // format: YYYY-MM-DD
  jenis: 'masuk_kantor' | 'dinas' | 'izin' | 'cuti'
  alasan: string
}

/** Parameters untuk mengupdate kecualian */
export interface UpdateKecualiParams {
  alasan?: string
  status?: 'aktif' | 'nonaktif'
}

/** Ambil kecualian untuk pegawai pada tanggal tertentu */
export function ambilKecuali(pegawaiId: number, tanggal: string) {
  return get<KecualiWFA>(`/presensi/kecuali?pegawai_id=${pegawaiId}&tanggal=${tanggal}`)
}

/** Ambil semua kecualian untuk tanggal tertentu (untuk lihat semua pegawai) */
export function ambilKecualiTanggal(tanggal: string) {
  return get<KecualiWFA[]>(`/presensi/kecuali?tanggal=${tanggal}`)
}

/** Buat kecualian WFA baru (hanya admin) */
export function buatKecuali(params: BuatKecualiParams) {
  return post<KecualiWFA>('/presensi/kecuali', params)
}

/** Update kecualian (hanya admin) */
export function updateKecuali(id: number, params: UpdateKecualiParams) {
  return post<KecualiWFA>(`/presensi/kecuali/${id}`, params)
}

/** Hapus/nonaktifkan kecualian (hanya admin) */
export function hapusKecuali(id: number) {
  return post<void>(`/presensi/kecuali/${id}/hapus`, {})
}