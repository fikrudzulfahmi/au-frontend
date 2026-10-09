import { useEffect, useRef } from 'react'
import type { LokasiPresensi, Posisi } from '@/lib/geolokasi'

interface PetaPresensiProps {
  daftarLokasi: LokasiPresensi[]
  posisi: Posisi | null
}

/**
 * Peta Leaflet/OpenStreetMap untuk visualisasi radius presensi dan posisi pengguna.
 * Menampilkan lingkaran radius untuk setiap lokasi presensi efektif dan titik GPS pengguna.
 */
export function PetaPresensi({ daftarLokasi, posisi }: PetaPresensiProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let dibatalkan = false
    let bersih: (() => void) | undefined

    void (async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (dibatalkan || !containerRef.current) return

      const map = L.map(containerRef.current, { scrollWheelZoom: false })
      bersih = () => {
        map.remove()
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const semuaTitik: [number, number][] = []

      for (const lok of daftarLokasi) {
        L.circle([lok.latitude, lok.longitude], {
          radius: lok.radius_m,
          color: '#1E2A8A',
          weight: 1,
          fillOpacity: 0.08,
        }).addTo(map)

        L.marker([lok.latitude, lok.longitude])
          .addTo(map)
          .bindPopup(`${lok.nama} (radius ${lok.radius_m} m)`)

        semuaTitik.push([lok.latitude, lok.longitude])
      }

      if (posisi !== null) {
        L.circleMarker([posisi.lat, posisi.lng], {
          radius: 8,
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup('Posisi Anda')

        semuaTitik.push([posisi.lat, posisi.lng])
      }

      if (semuaTitik.length > 0) {
        map.fitBounds(L.latLngBounds(semuaTitik), { padding: [30, 30], maxZoom: 16 })
      } else {
        map.setView([-2.2, 117.0], 5)
      }
    })()

    return () => {
      dibatalkan = true
      bersih?.()
    }
  }, [daftarLokasi, posisi])

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-[240px] w-full overflow-hidden rounded-card border border-line"
      aria-label="Peta lokasi presensi"
    />
  )
}
