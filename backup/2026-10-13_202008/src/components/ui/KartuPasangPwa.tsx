import { useState } from 'react'
import { Download, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { usePemasanganPwa } from '@/lib/pwa'

/**
 * Fase 7 — ajakan memasang SIPANDU ke layar utama.
 * Hanya tampil ketika peramban benar-benar menawarkan pemasangan; bila pengguna
 * menolak, kartu disembunyikan agar tidak mengganggu.
 */
export function KartuPasangPwa() {
  const { bisaDipasang, sudahTerpasang, pasang } = usePemasanganPwa()
  const [ditolak, setDitolak] = useState(false)

  if (!bisaDipasang || sudahTerpasang || ditolak) return null

  return (
    <section className="card flex flex-wrap items-center justify-between gap-3 p-4" aria-label="Pasang aplikasi">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
          <Smartphone size={19} />
        </span>
        <div>
          <p className="text-sm font-bold text-strong">Pasang SIPANDU di layar utama</p>
          <p className="text-xs text-muted">
            Buka lebih cepat dan tampil layar penuh, tanpa membuka peramban.
          </p>
        </div>
      </div>

      <Button
        varian="primary"
        onClick={() => {
          void pasang().then((hasil) => {
            if (hasil === 'ditolak') setDitolak(true)
          })
        }}
      >
        <Download size={16} /> Pasang
      </Button>
    </section>
  )
}
