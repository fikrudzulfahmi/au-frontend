/**
 * FR-PRS-06 / BR-11 — pembacaan posisi perangkat dan perhitungan jarak.
 *
 * Jarak dihitung ulang di klien HANYA untuk menampilkan indikator "jarak ke lokasi
 * terdekat" kepada pegawai. Keputusan sah/tidak tetap diambil server; nilai di sini
 * tidak pernah dikirim sebagai dasar keputusan.
 */

export interface Posisi {
  lat: number
  lng: number
  akurasi_m: number
}

export interface LokasiPresensi {
  id: number
  nama: string
  radius_m: number
  latitude: number
  longitude: number
  is_default: boolean
  /**
   * Titik-titik sudut poligon [lat, lng] untuk batas presensi khusus.
   * Bila berisi minimal 3 titik, zona poligon digunakan sebagai pengganti lingkaran radius.
   */
  poligon?: [number, number][] | null
  /**
   * Opsional: endpoint `/presensi/hari-ini` hanya mengirim lokasi yang sudah aktif
   * (tanpa `is_active`), sedangkan `/pengaturan/lokasi` mengirimkannya.
   */
  is_active?: boolean
}

/** Radius Bumi rata-rata dalam meter (sama dengan Haversine di server). */
const RADIUS_BUMI_M = 6371000

/** Jarak lingkaran besar antara dua koordinat, dalam meter. */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2

  return RADIUS_BUMI_M * 2 * Math.asin(Math.min(1, Math.sqrt(a)))
}

export interface JarakLokasi {
  lokasi: LokasiPresensi
  jarak_m: number
  diDalamRadius: boolean
}

/**
 * Uji titik-dalam-poligon (ray casting, even-odd) — cerminan `App\Support\Poligon`
 * di server. Dipakai agar indikator klien tidak menyatakan "di luar radius" ketika
 * lokasi memakai zona poligon; keputusan sah tetap milik server.
 */
export function titikDiDalamPoligon(
  lat: number,
  lng: number,
  poligon: [number, number][] | null | undefined,
): boolean {
  if (!poligon || poligon.length < 3) return false

  let diDalam = false

  for (let i = 0, j = poligon.length - 1; i < poligon.length; j = i++) {
    const [latI, lngI] = poligon[i]
    const [latJ, lngJ] = poligon[j]

    // Titik yang jatuh tepat di garis batas dianggap di dalam (server memakai
    // toleransi serupa) supaya indikator tidak berkedip saat berdiri di tepi zona.
    if (diSegmen(lat, lng, latI, lngI, latJ, lngJ)) return true

    const memotongGaris =
      lngI > lng !== lngJ > lng && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI

    if (memotongGaris) diDalam = !diDalam
  }

  return diDalam
}

/** Toleransi derajat untuk titik yang dianggap menempel pada garis batas (~0,1 mm). */
const TOLERANSI_BATAS = 1e-9

/** Apakah titik (lat, lng) berada pada segmen (latA, lngA)–(latB, lngB)? */
function diSegmen(
  lat: number,
  lng: number,
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): boolean {
  const silang = (lng - lngA) * (latB - latA) - (lat - latA) * (lngB - lngA)
  if (Math.abs(silang) > TOLERANSI_BATAS) return false

  const dot = (lat - latA) * (latB - latA) + (lng - lngA) * (lngB - lngA)
  if (dot < -TOLERANSI_BATAS) return false

  const panjang = (latB - latA) ** 2 + (lngB - lngA) ** 2
  return dot <= panjang + TOLERANSI_BATAS
}

/** Zona sah sebuah lokasi: poligon bila terisi (≥3 titik), selain itu lingkaran radius. */
export function diDalamZona(posisi: Posisi, lokasi: LokasiPresensi, jarak_m: number): boolean {
  if (lokasi.poligon && lokasi.poligon.length >= 3) {
    return titikDiDalamPoligon(posisi.lat, posisi.lng, lokasi.poligon)
  }

  // Radius 0 pada lokasi tanpa poligon tidak boleh ada (ditolak server), tetapi
  // jangan pernah menganggap titik mana pun sah bila datanya rusak.
  return lokasi.radius_m > 0 && jarak_m <= lokasi.radius_m
}

/** Lokasi terdekat dari posisi saat ini, beserta status di dalam zonanya. */
export function terdekatLokasi(posisi: Posisi, daftar: LokasiPresensi[]): JarakLokasi | null {
  if (daftar.length === 0) return null

  // Lokasi yang zonanya benar-benar memuat posisi menang lebih dulu; tanpa itu guru
  // berdiri di dalam poligon tetapi dinilai memakai radius lokasi lain yang lebih dekat.
  return daftar
    .map((lokasi) => {
      const jarak_m = haversine(posisi.lat, posisi.lng, lokasi.latitude, lokasi.longitude)
      return { lokasi, jarak_m, diDalamRadius: diDalamZona(posisi, lokasi, jarak_m) }
    })
    .sort((a, b) => {
      if (a.diDalamRadius !== b.diDalamRadius) return a.diDalamRadius ? -1 : 1
      return a.jarak_m - b.jarak_m
    })[0]
}

/** Format jarak yang enak dibaca (meter atau kilometer). */
export function formatJarak(meter: number | null | undefined): string {
  if (meter === null || meter === undefined) return '—'
  if (meter < 1000) return `${Math.round(meter)} m`
  return `${(meter / 1000).toFixed(2)} km`
}

export class GeolokasiError extends Error {
  constructor(
    pesan: string,
    readonly kode: 'tidak_diizinkan' | 'tidak_tersedia' | 'timeout' | 'tak_didukung',
  ) {
    super(pesan)
    this.name = 'GeolokasiError'
  }
}

/** Membaca posisi perangkat sekali (akurasi tinggi). */
export function bacaPosisi(timeoutMs = 15000): Promise<Posisi> {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new GeolokasiError('Perangkat ini tidak mendukung layanan lokasi.', 'tak_didukung'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (posisi) =>
        resolve({
          lat: posisi.coords.latitude,
          lng: posisi.coords.longitude,
          akurasi_m: Math.round(posisi.coords.accuracy),
        }),
      (galat) => {
        if (galat.code === galat.PERMISSION_DENIED) {
          reject(new GeolokasiError('Izin lokasi ditolak. Aktifkan izin lokasi untuk peramban ini.', 'tidak_diizinkan'))
          return
        }
        if (galat.code === galat.POSITION_UNAVAILABLE) {
          reject(new GeolokasiError('Posisi tidak dapat ditentukan. Cari tempat terbuka lalu coba lagi.', 'tidak_tersedia'))
          return
        }
        reject(new GeolokasiError('Waktu pembacaan lokasi habis. Coba lagi.', 'timeout'))
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    )
  })
}
