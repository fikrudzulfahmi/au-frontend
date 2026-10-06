import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

import { deviceToken } from './device'
import { API_BASE_URL } from './env'

export const TOKEN_KEY = 'sipandu.token'

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* abaikan */
  }
}

/** Struktur error standar API (3.4). */
export interface ApiErrorBody {
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly errors?: Record<string, string[]>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? 'Terjadi kesalahan pada server.')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.errors = body.errors
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

// 3.4 — header Authorization, X-Device-Token, Accept
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Device-Token'] = deviceToken()
  return config
})

/** Dipanggil bila server menolak token (401). */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0

    if (status === 401) {
      setToken(null)
      onUnauthorized?.()
    }

    if (error.response) {
      return Promise.reject(new ApiError(status, error.response.data ?? {}))
    }

    return Promise.reject(
      new ApiError(0, {
        message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.',
      }),
    )
  },
)

/** Pesan error siap tampil (Bahasa Indonesia). */
export function pesanError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan yang tidak diketahui.'
}

/**
 * Daftar: { data: [...], meta: { page, per_page, total } } (3.4).
 */
export interface DaftarResponse<T> {
  data: T[]
  meta: {
    page: number
    per_page: number
    total: number
  }
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<T>(url, { params })
  return data
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(url, body)
  return data
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<T>(url, body)
  return data
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<T>(url, body)
  return data
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url)
  return data
}
