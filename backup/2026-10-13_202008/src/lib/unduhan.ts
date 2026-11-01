import { api } from './api'
import { bersihkanParams } from './crud'

/**
 * 5.14 / KP-5.1 — mengunduh berkas laporan (PDF/Excel) dari API.
 *
 * Endpoint ekspor menuntut header `Authorization`, sehingga tidak dapat dipakai
 * sebagai `<a href>` biasa (server membalas 401). Pola yang sama dengan
 * `urlFotoBerpelindung()`: ambil blob lewat instance `api` (interceptor yang
 * menyisipkan token), buat object URL, picu unduhan lewat `<a download>`
 * sementara, lalu bebaskan URL-nya.
 */

/**
 * Mengambil nama berkas dari header `Content-Disposition`.
 *
 * Bentuk yang mungkin dijawab server:
 *   - `attachment; filename="rekap-presensi-pegawai.pdf"` (paling umum)
 *   - `attachment; filename=rekap-presensi-pegawai.xlsx` (tanpa kutip)
 *   - `attachment; filename*=UTF-8''rekap%20presensi.pdf` (RFC 5987)
 *
 * Bila tidak ada atau tidak terbaca, dipakai `cadangan`.
 */
export function namaDariContentDisposition(
  header: string | null | undefined,
  cadangan = 'laporan',
): string {
  if (!header) return cadangan

  // filename*= lebih diutamakan: ia yang membawa nama ber-UTF-8.
  const berbintang = /filename\*\s*=\s*([^;]+)/i.exec(header)
  if (berbintang) {
    const nilai = berbintang[1].trim().replace(/^["']|["']$/g, '')
    const pisah = nilai.split("''")
    const mentah = pisah.length > 1 ? pisah.slice(1).join("''") : nilai
    try {
      const hasil = decodeURIComponent(mentah).trim()
      if (hasil) return hasil
    } catch {
      const hasil = mentah.trim()
      if (hasil) return hasil
    }
  }

  const biasa = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i.exec(header)
  if (biasa) {
    const mentah = (biasa[1] ?? biasa[2] ?? '').trim()
    if (mentah) return mentah
  }

  return cadangan
}

/** Menambahkan ekstensi bila nama berkas belum memilikinya. */
export function pastikanEkstensi(nama: string, ekstensi: string): string {
  const bersih = ekstensi.replace(/^\./, '').toLowerCase()
  if (!bersih) return nama
  if (nama.toLowerCase().endsWith(`.${bersih}`)) return nama

  return `${nama}.${bersih}`
}

/**
 * Mengunduh berkas dari endpoint API dan mengembalikan nama berkas yang dipakai.
 *
 * @param jalur     jalur relatif API, mis. `/laporan/presensi/rekap-pegawai`
 * @param params    query string (periode/filter) — nilai kosong dibuang
 * @param cadangan  nama berkas bila `Content-Disposition` tidak memberi nama
 */
export async function unduhBerkasApi(
  jalur: string,
  params: Record<string, unknown> = {},
  cadangan = 'laporan',
): Promise<string> {
  const respons = await api.get<Blob>(jalur, {
    params: bersihkanParams(params),
    responseType: 'blob',
  })

  const nama = namaDariContentDisposition(
    respons.headers['content-disposition'] as string | undefined,
    cadangan,
  )

  const url = URL.createObjectURL(respons.data)
  const tautan = document.createElement('a')
  tautan.href = url
  tautan.download = nama
  document.body.appendChild(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)

  return nama
}
