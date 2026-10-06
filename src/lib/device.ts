/**
 * Token perangkat (FR-SEC-02, A-08).
 * Disimpan di penyimpanan lokal peramban dan dikirim lewat header `X-Device-Token`.
 * Pengikatan perangkat ditegakkan di server (BR-14).
 */
const STORAGE_KEY = 'sipandu.device_token'

function acakToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '')
  }
  let out = ''
  for (let i = 0; i < 64; i += 1) out += Math.floor(Math.random() * 16).toString(16)
  return out
}

export function deviceToken(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const created = acakToken()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return acakToken()
  }
}

export function resetDeviceToken(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* abaikan */
  }
}

export function namaPerangkat(): string {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  if (/android/i.test(ua)) return 'Perangkat Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'Perangkat iOS'
  if (/windows/i.test(ua)) return 'Perangkat Windows'
  if (/mac os/i.test(ua)) return 'Perangkat macOS'
  return 'Peramban Web'
}
