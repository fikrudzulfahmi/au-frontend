/** Nama aplikasi (FR / 1 — dipakai pada judul, manifest, sidebar). */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'SIPANDU'

/** Basis URL REST API backend (3.3 — dua domain terpisah). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

/** Ambang batas desktop vs mobile (FR-UI-01). */
export const DESKTOP_BREAKPOINT = 1024
