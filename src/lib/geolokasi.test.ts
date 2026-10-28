import { describe, expect, it } from 'vitest'
import { diDalamZona, formatJarak, haversine, terdekatLokasi, titikDiDalamPoligon } from './geolokasi'
import type { LokasiPresensi, Posisi } from './geolokasi'

describe('geolokasi', () => {
  it('menghitung jarak haversine dengan benar', () => {
    // Jarak antara 2 titik identik adalah 0
    expect(haversine(-7.8654, 111.465, -7.8654, 111.465)).toBe(0)

    // Jarak sekitar 111 meter per 0.001 derajat latitude
    const jarak = haversine(-7.8654, 111.465, -7.8664, 111.465)
    expect(jarak).toBeGreaterThan(100)
    expect(jarak).toBeLessThan(120)
  })

  it('menentukan lokasi terdekat saat poligon bernilai null atau terisi', () => {
    const posisi: Posisi = { lat: -7.8654, lng: 111.465, akurasi_m: 10 }
    const daftar: LokasiPresensi[] = [
      {
        id: 1,
        nama: 'Gedung Utama',
        latitude: -7.8654,
        longitude: 111.465,
        radius_m: 100,
        is_default: true,
        poligon: null,
      },
      {
        id: 2,
        nama: 'Bengkel Otomotif',
        latitude: -7.87,
        longitude: 111.47,
        radius_m: 50,
        is_default: false,
        poligon: [
          [-7.869, 111.469],
          [-7.871, 111.469],
          [-7.871, 111.471],
        ],
      },
    ]

    const hasil = terdekatLokasi(posisi, daftar)
    expect(hasil).not.toBeNull()
    expect(hasil?.lokasi.id).toBe(1)
    expect(hasil?.diDalamRadius).toBe(true)
    expect(hasil?.jarak_m).toBeLessThan(1)
  })

  it('menilai titik di dalam poligon meski di luar radius', () => {
    const poligon: [number, number][] = [
      [-7.869, 111.469],
      [-7.871, 111.469],
      [-7.871, 111.471],
      [-7.869, 111.471],
    ]

    expect(titikDiDalamPoligon(-7.87, 111.47, poligon)).toBe(true)
    expect(titikDiDalamPoligon(-7.86, 111.47, poligon)).toBe(false)
    expect(titikDiDalamPoligon(-7.87, 111.47, null)).toBe(false)

    // Lokasi beradius 0 yang memakai poligon: titik di dalam kotak tetap sah,
    // walau jarak ke titik pusat jauh melebihi radius.
    const lokasi: LokasiPresensi = {
      id: 3,
      nama: 'Aula Poligon',
      latitude: -7.87,
      longitude: 111.47,
      radius_m: 0,
      is_default: false,
      poligon,
    }
    const posisi: Posisi = { lat: -7.8695, lng: 111.4705, akurasi_m: 8 }
    const jarak = haversine(posisi.lat, posisi.lng, lokasi.latitude, lokasi.longitude)

    expect(diDalamZona(posisi, lokasi, jarak)).toBe(true)
    expect(terdekatLokasi(posisi, [lokasi])?.diDalamRadius).toBe(true)
  })

  it('memilih lokasi yang zonanya memuat posisi, bukan sekadar yang terdekat', () => {
    const posisi: Posisi = { lat: -7.8695, lng: 111.4705, akurasi_m: 8 }

    const dekat: LokasiPresensi = {
      id: 10, nama: 'Pos Satpam', latitude: -7.8690, longitude: 111.4705,
      radius_m: 5, is_default: true, poligon: null,
    }
    const poligon: LokasiPresensi = {
      id: 11, nama: 'Aula', latitude: -7.875, longitude: 111.475, radius_m: 0, is_default: false,
      poligon: [
        [-7.869, 111.470],
        [-7.870, 111.470],
        [-7.870, 111.471],
        [-7.869, 111.471],
      ],
    }

    // Pos satpam lebih dekat tetapi titik berada di luar radiusnya (posisi ~55 m dari pusat).
    expect(terdekatLokasi(posisi, [dekat, poligon])?.lokasi.id).toBe(11)
  })

  it('memformat jarak dengan meter atau kilometer', () => {
    expect(formatJarak(null)).toBe('—')
    expect(formatJarak(undefined)).toBe('—')
    expect(formatJarak(45.2)).toBe('45 m')
    expect(formatJarak(1500)).toBe('1.50 km')
  })
})
