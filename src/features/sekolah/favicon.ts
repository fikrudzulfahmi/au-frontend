/**
 * FR-SCH-02 — favicon mengikuti gambar yang diunggah admin di Info Sekolah.
 *
 * `index.html` memuat ikon statis `/icons/favicon-64.png`, sehingga favicon tidak
 * pernah berubah walau admin mengunggah favicon baru. Tautan diganti saat data
 * sekolah sudah termuat; URL-nya membawa parameter versi dari server agar cache
 * peramban gugur ketika gambar diganti.
 */
export function pasangFavicon(url: string | null | undefined, dokumen: Document = document): void {
  if (!url) return

  const tautan = (rel: string): HTMLLinkElement => {
    let el = dokumen.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

    if (!el) {
      el = dokumen.createElement('link')
      el.rel = rel
      dokumen.head.appendChild(el)
    }

    return el
  }

  const ikon = tautan('icon')
  // Berkas unggahan disimpan sebagai JPEG; atribut type lama (image/png) akan
  // menyesatkan peramban sehingga dihapus agar tipenya ditebak dari respons.
  ikon.removeAttribute('type')
  ikon.href = url
  tautan('apple-touch-icon').href = url
}
