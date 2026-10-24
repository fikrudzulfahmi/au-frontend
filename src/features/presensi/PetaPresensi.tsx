import { useEffect, useRef } from 'react'
import type { LokasiPresensi, Posisi } from '@/lib/geolokasi'

interface PetaPresensiProps {
  daftarLokasi: LokasiPresensi[]
  posisi: Posisi | null
}

/**
 * Peta Leaflet untuk visualisasi radius/poligon presensi dan posisi pengguna.
 * Menampilkan kontrol basemap Citra satelit (default) dan Jalan (OSM),
 * visualisasi zona presensi (poligon atau lingkaran), serta titik GPS pengguna.
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

      // Basemap Citra (Esri World Imagery) sebagai default agar batas area sekolah tampak jelas
      const citra = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        },
      )

      // Basemap Jalan (OpenStreetMap) sebagai alternatif peta jalan
      const jalan = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      })

      // Citra satelit dipasang sebagai lapisan default
      citra.addTo(map)

      // Kontrol lapisan untuk beralih antara Citra satelit dan Jalan
      L.control.layers({ Citra: citra, Jalan: jalan }, undefined, { position: 'topright' }).addTo(map)

      const semuaTitik: [number, number][] = []

      for (const lok of daftarLokasi) {
        const punyaPoligon = Array.isArray(lok.poligon) && lok.poligon.length >= 3

        if (punyaPoligon && lok.poligon) {
          // Bila lokasi memiliki zona poligon (>= 3 titik), gambar L.polygon dan jangan gambar lingkaran radius
          L.polygon(lok.poligon, {
            color: '#1E2A8A',
            weight: 2,
            fillOpacity: 0.12,
          })
            .addTo(map)
            .bindPopup(`${lok.nama} (zona poligon)`)

          for (const titik of lok.poligon) {
            semuaTitik.push(titik)
          }
        } else {
          // Bila tidak ada poligon, tetap tampilkan lingkaran radius
          L.circle([lok.latitude, lok.longitude], {
            radius: lok.radius_m,
            color: '#1E2A8A',
            weight: 1,
            fillOpacity: 0.08,
          }).addTo(map)
        }

        L.marker([lok.latitude, lok.longitude])
          .addTo(map)
          .bindPopup(punyaPoligon ? `${lok.nama} (zona poligon)` : `${lok.nama} (radius ${lok.radius_m} m)`)

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
