import { useState } from 'react'

import { getTokenTv, hapusTokenTv } from './api'
import { HalamanKodeTv } from './HalamanKodeTv'
import { LayarTv } from './LayarTv'

/**
 * FR-TV-01..16 — rute publik `/tv`.
 *
 * Bila token TV sudah tersimpan di perangkat, layar utama langsung dibuka
 * (tidak perlu memasukkan kode lagi setelah TV dinyalakan ulang).
 */
export function TvPage() {
  const [siap, setSiap] = useState<boolean>(() => Boolean(getTokenTv()))

  if (!siap) return <HalamanKodeTv onMasuk={() => setSiap(true)} />

  return (
    <LayarTv
      onKeluar={() => {
        hapusTokenTv()
        setSiap(false)
      }}
    />
  )
}
