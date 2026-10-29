import ikonUrl from 'leaflet/dist/images/marker-icon.png'
import ikon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import bayanganUrl from 'leaflet/dist/images/marker-shadow.png'

import type * as Leaflet from 'leaflet'

/**
 * Arahkan ikon penanda Leaflet ke berkas yang ikut dibundel Vite.
 *
 * Bawaan Leaflet mencari `marker-icon.png` relatif ke berkas CSS-nya. Setelah bundel
 * produksi, alamat itu jatuh ke root situs (`/marker-icon-2x.png`) — berkas yang tidak
 * ada di hosting, sehingga LiteSpeed menjawab `index.html` dan peramban menolaknya
 * (`415 Unsupported Media Type`). Akibatnya penanda peta hilang tanpa pesan di UI.
 *
 * Impor lewat Vite memberi URL ber-hash di `/assets/`, jadi penanda selalu ditemukan.
 * Aman dipanggil berkali-kali; modul Leaflet bisa dimuat dinamis di beberapa layar.
 */
export function pasangIkonLeaflet(L: Partial<typeof Leaflet>): void {
  try {
    const bawaan = L.Icon?.Default
    if (!bawaan?.mergeOptions) return

    bawaan.mergeOptions({
      iconUrl: ikonUrl,
      iconRetinaUrl: ikon2xUrl,
      shadowUrl: bayanganUrl,
    })
  } catch {
    // Modul leaflet dipalsukan (uji unit memakai Proxy yang melempar untuk ekspor
    // yang tidak ada). Ikon hanyalah hiasan — jangan gagalkan pemuatan peta.
  }
}
