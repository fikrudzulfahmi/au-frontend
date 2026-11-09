import { get, post, urlFotoBerpelindung } from '@/lib/api'
import { master } from '@/lib/crud'
import type {
  PengajuanIzin,
  PengajuanLuarRadius,
  Presensi,
  StatusHariIni
} from './types'

/** FR-PRS — status hari ini (menentukan tombol yang tampil).
 *  Default: ambil dari server tanpa kecualian.
 */
export function ambilStatusHariIni() {
  return get<{ data: StatusHariIni }>('/presensi/hari-ini')
}

/** FR-PRS — cek kecualian WFA untuk pegawai tertentu pada hari ini.
 *  Return nilai null kalau tidak ada kecualian.
 */
export function cekKecualiHariIni(pegawaiId: number) {
  return get<KecualiWFA | null>(
    `/presensi/kecuali?pegawai_id=${pegawaiId}`
  )
}

/** FR-PRS — ambil semua kecualian untuk tanggal tertentu (untuk dashboard/admin) */
export function ambilKecualiTanggal(tanggal: string) {
  return get<KecualiWFA[]>(`/presensi/kecuali?tanggal=${tanggal}`)
}

/** FR-PRS — buat kecualian WFA baru (hanya admin) */
export function buatKecuali(params: {
  pegawai_id: number
  tanggal: string
  jenis: 'masuk_kantor' | 'dinas' | 'izin' | 'cuti'
  alasan: string
}) {
  return post<KecualiWFA>('/presensi/kecuali', params)
}

/** FR-PRS — update kecualian (hanya admin) */
export function updateKecuali(id: number, params: {
  alasan?: string
  status?: 'aktif' | 'nonaktif'
}) {
  return post<KecualiWFA>(`/presensi/kecuali/${id}`, params)
}

/** FR-PRS — hapus/nonaktifkan kecualian (hanya admin) */
export function hapusKecuali(id: number) {
  return post<void>(`/presensi/kecuali/${id}/hapus`, {})
}

/** Mengirim presensi sebagai multipart: foto adalah berkas, bukan JSON.
 * Content-Type sengaja tidak diisi agar peramban menetapkan boundary sendiri.
 */
export function kirimPresensi(
  sisi: 'masuk' | 'pulang',
  data: {
    foto: File
    lat: number
    lng: number
    akurasi_m: number
    alasan?: string
  }
) {
  const form = new FormData()
  form.append('foto', data.foto)
  form.append('lat', String(data.lat))
  form.append('lng', String(data.lng))
  form.append('akurasi_m', String(data.akurasi_m))
  if (data.alasan) form.append('alasan', data.alasan)

  return post<{ message: string; data: Presensi }>(`/presensi/${sisi}`, form)
}

/** FR-PRS — ambil riwayat presensi */
export function riwayatPresensi(params: Record<string, unknown> = {}) {
  return master.daftar<Presensi>('/presensi/riwayat', params)
}

/** Foto disajikan lewat endpoint berpelindung; diambil sebagai blob lalu dijadikan URL. */
export function ambilFotoPresensi(presensiId: number, sisi: 'masuk' | 'pulang'): Promise<string> {
  // Fase 7 — impor statis: `@/lib/api` juga diimpor statis oleh puluhan berkas,
  // sehingga `import()` di sini tidak pernah memecah chunk (Vite memperingatkan).
  return urlFotoBerpelindung(`/presensi/${presensiId}/foto/${sisi}`)
}

/** FR-PRS — daftar pengajuan izin */
export function daftarPengajuanIzin(params: Record<string, unknown> = {}) {
  return master.daftar<PengajuanIzin>('/pengajuan-izin', params)
}

/** FR-PRS — ajukan izin/sakit/dinas/cuti */
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

/** FR-PRS — daftar pengajuan luar radius */
export function daftarPengajuanLuarRadius(params: Record<string, unknown> = {}) {
  return master.daftar<PengajuanLuarRadius>('/pengajuan-luar-radius', params)
}

/** FR-PRS — ajukan luar radius */
export function ajukanLuarRadius(data: {
  tanggal: string
  alasan: string
  lampiran?: File | null
}) {
  const form = new FormData()
  form.append('tanggal', data.tanggal)
  form.append('alasan', data.alasan)
  if (data.lampiran) form.append('lampiran', data.lampiran)

  return post<{ message: string; data: PengajuanLuarRadius }>('/pengajuan-luar-radius', form)
}