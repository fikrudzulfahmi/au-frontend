import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

import { ApiError } from '@/lib/api'
import type { ApiErrorBody } from '@/lib/api'
import { API_BASE_URL } from '@/lib/env'
import type { RekapTv, SekolahRingkas, TampilanTv } from './types'

/**
 * Jebakan #7 — token TV DIPISAH dari token pengguna.
 *
 * TV tidak punya sesi pengguna, jadi memakai `sipandu.token` akan bertabrakan
 * dengan sesi admin di peramban yang sama dan membuat TV tampil kosong.
 */
export const TV_TOKEN_KEY = 'sipandu.tv.token'

export function getTokenTv(): string | null {
  try {
    return window.localStorage.getItem(TV_TOKEN_KEY)
  } catch {
    return null
  }
}

export function simpanTokenTv(token: string): void {
  try {
    window.localStorage.setItem(TV_TOKEN_KEY, token)
  } catch {
    /* abaikan */
  }
}

export function hapusTokenTv(): void {
  try {
    window.localStorage.removeItem(TV_TOKEN_KEY)
  } catch {
    /* abaikan */
  }
}

/**
 * Instance axios khusus TV: hanya mengirim token TV, dan galat 401-nya TIDAK
 * menghapus sesi pengguna (tidak memakai interceptor `api`).
 */
export const apiTv: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 20000,
})

apiTv.interceptors.request.use((config) => {
  const token = getTokenTv()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiTv.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0
    const body = (error.response?.data as ApiErrorBody | undefined) ?? {}

    return Promise.reject(
      new ApiError(
        status,
        Object.keys(body).length > 0
          ? body
          : { message: 'Tidak dapat terhubung ke server. Periksa koneksi layar TV.' },
      ),
    )
  },
)

/** Nama perangkat ringkas untuk daftar sesi TV (FR-TV-16). */
export function namaPerangkat(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/Android/i.test(ua)) return 'Perangkat Android'
  if (/iPhone|iPad/i.test(ua)) return 'Perangkat iOS'
  if (/Windows/i.test(ua)) return 'Layar Windows'
  if (/Macintosh/i.test(ua)) return 'Layar macOS'
  if (/Linux/i.test(ua)) return 'Layar Linux'
  return 'Peramban'
}

export interface MasukTvHasil {
  token: string
  kedaluwarsa_at: string | null
  tampilan: TampilanTv
  sekolah: SekolahRingkas | null
}

/** FR-TV-02/03 — tukar kode TV (atau NPSN) menjadi token TV. */
export async function masukTv(kode: string, npsn: string): Promise<MasukTvHasil> {
  const { data } = await apiTv.post<{ data: MasukTvHasil }>('/tv/masuk', {
    kode: kode.trim() === '' ? null : kode.trim(),
    npsn: npsn.trim() === '' ? null : npsn.trim(),
    nama_perangkat: namaPerangkat(),
  })

  simpanTokenTv(data.data.token)
  return data.data
}

/** FR-TV-05 — rekap tiga kolom + jam server + pengumuman tayang (BR-37). */
export async function ambilRekapTv(tanggal?: string): Promise<RekapTv> {
  const { data } = await apiTv.get<{ data: RekapTv }>('/tv/rekap', {
    params: tanggal ? { tanggal } : {},
  })
  return data.data
}

/** FR-TV-15 — pengaturan tampilan untuk perangkat TV. */
export async function ambilTampilanTv(): Promise<{
  tampilan: TampilanTv
  sekolah: SekolahRingkas | null
}> {
  const { data } = await apiTv.get<{ data: { tampilan: TampilanTv; sekolah: SekolahRingkas | null } }>(
    '/tv/tampilan',
  )
  return data.data
}
