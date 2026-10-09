import { useEffect, useRef } from 'react'

interface PetaLokasiAbsenProps {
  lat: number
  lng: number
  lokasiLat: number | null
  lokasiLng: number | null
  radiusM: number | null
  nama: string
}

/** Peta lokasi presensi: lingkaran radius lokasi (jika ada) + titik posisi pegawai saat presensi. */
export function PetaLokasiAbsen({ lat, lng, lokasiLat, lokasiLng, radiusM, nama }: PetaLokasiAbsenProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let bersih: (() => void) | undefined
    void (async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (!ref.current) return

      const map = L.map(ref.current, { scrollWheelZoom: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const titik: [number, number][] = []

      if (lokasiLat !== null && lokasiLng !== null) {
        const pusat: [number, number] = [lokasiLat, lokasiLng]
        titik.push(pusat)
        if (radiusM !== null && radiusM > 0) {
          L.circle(pusat, { radius: radiusM, color: '#1E2A8A', weight: 1, fillOpacity: 0.08 }).addTo(map)
        }
        L.marker(pusat).addTo(map).bindPopup(`${nama} (lokasi)`)
      }

      const pos: [number, number] = [lat, lng]
      titik.push(pos)
      L.circleMarker(pos, { radius: 8, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 })
        .addTo(map)
        .bindPopup('Posisi presensi')

      map.fitBounds(L.latLngBounds(titik), { padding: [30, 30], maxZoom: 17 })
      bersih = () => map.remove()
    })()
    return () => bersih?.()
  }, [lat, lng, lokasiLat, lokasiLng, radiusM, nama])

  return (
    <div
      ref={ref}
      className="h-[220px] w-full overflow-hidden rounded-control border border-line"
      aria-label={`Peta lokasi presensi ${nama}`}
    />
  )
}
