import { useEffect } from 'react'

import { pasangFavicon } from './favicon'
import { useSekolah } from './useSekolah'

/**
 * FR-SCH-02 — memasang favicon sekolah yang diunggah admin di Info Sekolah.
 *
 * Dipanggil sekali di akar aplikasi supaya berlaku di landing page, halaman
 * masuk, TV, maupun area setelah login.
 */
export function useFaviconSekolah(): void {
  const { data } = useSekolah()
  const url = data?.favicon_url

  useEffect(() => {
    pasangFavicon(url)
  }, [url])
}
