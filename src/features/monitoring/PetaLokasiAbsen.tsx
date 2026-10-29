import { useEffect, useRef } from 'react'

import { pasangIkonLeaflet } from '@/lib/ikonLeaflet'

interface PetaLokasiAbsenProps {
  lat: number
  lng: number
  lokasiLat: number | null
  lokasiLng: number | null
  radiusM: number | null
  /** Zona areal sekolah; bila ≥3 titik, areal inilah yang digambar, bukan lingkaran radius. */
  poligon?: Array<[number, number]> | null
  nama: string
  /** Keterangan popup titik posisi presensi: "Posisi presensi datang"/"... pulang". */
  labelTitik?: string
}

/**
 * Peta lokasi presensi: zona sah lokasi (poligon atau lingkaran radius) + titik posisi
 * pegawai saat presensi. Menggambar lingkaran radius pada lokasi berpoligon membuat
 * titik yang sah tampak di luar zona, jadi bentuk zona mengikuti data lokasi.
 */
export function PetaLokasiAbsen({ lat, lng, lokasiLat, lokasiLng, radiusM, poligon, nama, labelTitik }: PetaLokasiAbsenProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let bersih: (() => void) | undefined
    void (async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      pasangIkonLeaflet(L)
      if (!ref.current) return

      const map = L.map(ref.current, { scrollWheelZoom: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const titik: [number, number][] = []

      const punyaPoligon = Array.isArray(poligon) && poligon.length >= 3

      if (punyaPoligon) {
        const batas = poligon as [number, number][]
        L.polygon(batas, { color: '#1E2A8A', weight: 2, fillOpacity: 0.08 })
          .addTo(map)
          .bindPopup(`${nama} (zona poligon)`)
        batas.forEach((titikPoligon) => titik.push(titikPoligon))
      }

      if (lokasiLat !== null && lokasiLng !== null) {
        const pusat: [number, number] = [lokasiLat, lokasiLng]
        titik.push(pusat)
        if (!punyaPoligon && radiusM !== null && radiusM > 0) {
          L.circle(pusat, { radius: radiusM, color: '#1E2A8A', weight: 1, fillOpacity: 0.08 }).addTo(map)
        }
        L.marker(pusat).addTo(map).bindPopup(`${nama} (lokasi)`)
      }

      const pos: [number, number] = [lat, lng]
      titik.push(pos)
      L.circleMarker(pos, { radius: 8, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 })
        .addTo(map)
        .bindPopup(labelTitik ?? 'Posisi presensi')

      map.fitBounds(L.latLngBounds(titik), { padding: [30, 30], maxZoom: 17 })
      bersih = () => map.remove()
    })()
    return () => bersih?.()
  }, [lat, lng, lokasiLat, lokasiLng, radiusM, poligon, nama, labelTitik])

  return (
    <div
      ref={ref}
      className="h-[220px] w-full overflow-hidden rounded-control border border-line"
      aria-label={`Peta lokasi presensi ${nama}`}
    />
  )
}
