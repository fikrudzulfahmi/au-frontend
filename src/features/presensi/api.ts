import { get, post } from '@/lib/api'
import { master } from '@/lib/crud'
import type { PengajuanIzin, PengajuanLuarRadius, Presensi, StatusHariIni } from './types'

/** FR-PRS — status hari ini (menentukan tombol yang tampil). */
export function ambilStatusHariIni() {
  return get<{ data: StatusHariIni }>('/presensi/hari-ini')
}

/**
 * Mengirim presensi sebagai multipart: foto adalah berkas, bukan JSON.
 * Content-Type sengaja tidak diisi agar peramban menetapkan boundary sendiri.
 */
export function kirimPresensi(
  sisi: 'masuk' | 'pulang',
  data: { foto: File; lat: number; lng: number; akurasi_m: number; alasan?: string },
) {
  const form = new FormData()
  form.append('foto', data.foto)
  form.append('lat', String(data.lat))
  form.append('lng', String(data.lng))
  form.append('akurasi_m', String(data.akurasi_m))
  if (data.alasan) form.append('alasan', data.alasan)

  return post<{ message: string; data: Presensi }>(`/presensi/${sisi}`, form)
}

export function riwayatPresensi(params: Record<string, unknown> = {}) {
  return master.daftar<Presensi>('/presensi/riwayat', params)
}

/** Foto disajikan lewat endpoint berpelindung; diambil sebagai blob lalu dijadikan URL. */
export async function ambilFotoPresensi(presensiId: number, sisi: 'masuk' | 'pulang'): Promise<string> {
  const { urlFotoBerpelindung } = await import('@/lib/api')

  return urlFotoBerpelindung(`/presensi/${presensiId}/foto/${sisi}`)
}

export function daftarPengajuanIzin(params: Record<string, unknown> = {}) {
  return master.daftar<PengajuanIzin>('/pengajuan-izin', params)
}

export function ajukanIzin(data: {
  jenis: string
  tanggal_mulai: string
  tanggal_selesai: string
  alasan: string
  lampiran?: File | null
  presensi_luar_radius?: boolean
}) {
  const form = new FormData()
  form.append('jenis', data.jenis)
  form.append('tanggal_mulai', data.tanggal_mulai)
  form.append('tanggal_selesai', data.tanggal_selesai)
  form.append('alasan', data.alasan)
  if (data.jenis === 'dinas') form.append('presensi_luar_radius', data.presensi_luar_radius ? '1' : '0')
  if (data.lampiran) form.append('lampiran', data.lampiran)

  return post<{ message: string; data: PengajuanIzin }>('/pengajuan-izin', form)
}

export function daftarPengajuanLuarRadius(params: Record<string, unknown> = {}) {
  return master.daftar<PengajuanLuarRadius>('/pengajuan-luar-radius', params)
}

export function ajukanLuarRadius(data: { tanggal: string; alasan: string; lampiran?: File | null }) {
  const form = new FormData()
  form.append('tanggal', data.tanggal)
  form.append('alasan', data.alasan)
  if (data.lampiran) form.append('lampiran', data.lampiran)

  return post<{ message: string; data: PengajuanLuarRadius }>('/pengajuan-luar-radius', form)
}
