import { useCallback, useEffect, useState } from 'react'

/** Peristiwa `beforeinstallprompt` belum ada di tipe DOM bawaan TypeScript. */
interface PeristiwaPemasangan extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type HasilPemasangan = 'diterima' | 'ditolak' | 'tidak_tersedia'

/**
 * Fase 7 — memasang aplikasi ke layar utama.
 * Peramban hanya mengirim `beforeinstallprompt` bila syarat PWA sudah terpenuhi
 * (manifest + service worker + ikon 192/512). Bila belum terkirim, tombol tidak
 * ditampilkan — jangan menampilkan tombol yang pasti gagal.
 */
export function usePemasanganPwa() {
  const [peristiwa, setPeristiwa] = useState<PeristiwaPemasangan | null>(null)
  const [sudahTerpasang, setSudahTerpasang] = useState(false)

  useEffect(() => {
    const tangkap = (e: Event) => {
      e.preventDefault()
      setPeristiwa(e as PeristiwaPemasangan)
    }
    const tandai = () => {
      setSudahTerpasang(true)
      setPeristiwa(null)
    }

    // Sudah berjalan sebagai aplikasi terpasang (bukan di dalam tab peramban).
    if (window.matchMedia?.('(display-mode: standalone)').matches) setSudahTerpasang(true)

    window.addEventListener('beforeinstallprompt', tangkap)
    window.addEventListener('appinstalled', tandai)
    return () => {
      window.removeEventListener('beforeinstallprompt', tangkap)
      window.removeEventListener('appinstalled', tandai)
    }
  }, [])

  const pasang = useCallback(async (): Promise<HasilPemasangan> => {
    if (!peristiwa) return 'tidak_tersedia'
    await peristiwa.prompt()
    const pilihan = await peristiwa.userChoice
    if (pilihan.outcome === 'accepted') setPeristiwa(null)
    return pilihan.outcome === 'accepted' ? 'diterima' : 'ditolak'
  }, [peristiwa])

  return { bisaDipasang: peristiwa !== null, sudahTerpasang, pasang }
}
