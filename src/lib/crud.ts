import { ApiError, del, get, getToken, patch, post, put } from './api'
import type { DaftarResponse } from './api'
import { API_BASE_URL } from './env'

/** Membuang nilai kosong agar tidak ikut menjadi query string. */
export function bersihkanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false),
  )
}

/**
 * Pesan galat validasi per bidang dari server (3.4 — 422 dengan `errors`).
 * Dipakai agar pesan aturan bisnis dari backend (mis. BR-02/BR-03) tampil di formulir.
 */
export function pesanPerBidang(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.errors) return {}

  return Object.fromEntries(
    Object.entries(error.errors).map(([bidang, daftar]) => [bidang, daftar[0]]),
  )
}

/** Ringkasan baris gagal pada import (KP-1.3). */
export interface LaporanDetail {
  total_baris: number
  berhasil: number
  gagal: number
  baris_gagal: Array<{ baris: number; pesan: string }>
  akun?: Array<{ nip: string; password_awal: string }>
}

/** Nama lama dipertahankan agar pemakaian Fase 1 tidak perlu diubah. */
export type LaporanImport = LaporanDetail

export const master = {
  daftar: <T>(jalur: string, params: Record<string, unknown> = {}) =>
    get<DaftarResponse<T>>(jalur, bersihkanParams(params)),

  satu: <T>(jalur: string, id: number) => get<{ data: T }>(`${jalur}/${id}`),

  buat: <T>(jalur: string, body: unknown) =>
    post<{ data: T; message?: string; password_awal?: string | null }>(jalur, body),

  ubah: <T>(jalur: string, id: number, body: unknown) => put<{ data: T; message?: string }>(`${jalur}/${id}`, body),

  tambal: <T>(jalur: string, id: number, body: unknown) =>
    patch<{ data: T }>(`${jalur}/${id}`, body),

  hapus: (jalur: string, id: number) => del<{ message?: string }>(`${jalur}/${id}`),
}

/**
 * Aksi khusus (aktifkan, selesai, reset, dsb).
 *
 * `metode` WAJIB disebut bila rutenya bukan POST.
 *
 * Helper ini dulu selalu mengirim POST, padahal backend memakai PATCH untuk semua
 * aksi yang MENGUBAH STATUS (`putuskan`, `batalkan`, `koreksi`, `default`).
 * Akibatnya tujuh tombol gagal dengan galat "The POST method is not supported for
 * this route", termasuk tombol persetujuan perizinan dan pembatalan pengajuan oleh
 * guru. Rute yang memang POST (reset perangkat, aktifkan/selesai tahun pelajaran,
 * jam kerja) tetap memakai nilai bawaan.
 */
export function aksi<T = unknown>(jalur: string, body?: unknown, metode: 'post' | 'patch' = 'post') {
  return metode === 'patch' ? patch<T>(jalur, body) : post<T>(jalur, body)
}

/**
 * Mengunggah berkas (import) sebagai multipart.
 * `Content-Type` sengaja tidak diisi agar peramban menetapkan boundary sendiri.
 */
export async function unggahBerkas<T>(jalur: string, berkas: File, bidangLain: Record<string, unknown> = {}): Promise<T> {
  const form = new FormData()
  form.append('berkas', berkas)
  Object.entries(bidangLain).forEach(([k, v]) => form.append(k, String(v)))

  return post<T>(jalur, form)
}

/**
 * Mengunduh berkas dari API (endpoint ekspor/template).
 * Unduhan memerlukan header Authorization, sehingga tidak bisa memakai <a href> biasa.
 */
export async function unduhBerkas(jalur: string, namaBerkas: string): Promise<void> {
  const respons = await fetch(`${API_BASE_URL}${jalur}`, {
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${getToken() ?? ''}`,
    },
  })

  if (!respons.ok) {
    let pesan = 'Berkas gagal diunduh.'
    try {
      const body = (await respons.json()) as { message?: string }
      if (body.message) pesan = body.message
    } catch {
      /* respons bukan JSON */
    }
    throw new ApiError(respons.status, { message: pesan })
  }

  const blob = await respons.blob()
  const url = URL.createObjectURL(blob)
  const tautan = document.createElement('a')
  tautan.href = url
  tautan.download = namaBerkas
  document.body.appendChild(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)
}
