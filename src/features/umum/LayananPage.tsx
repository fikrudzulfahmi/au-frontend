import { Link } from 'react-router-dom'
import { ArrowLeft, Grid2x2 } from 'lucide-react'

import { KartuPasangPwa } from '@/components/ui/KartuPasangPwa'
import { LayananGrid } from '@/components/ui/LayananGrid'
import { PageHeader } from '@/components/ui/PageHeader'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { DESKTOP_BREAKPOINT } from '@/lib/env'
import { layananPeran } from '@/lib/menu'
import { useAuth } from '@/features/auth/AuthContext'

/** FR-UI-07 — halaman /layanan ("Lihat Semua"). */
export function LayananPage() {
  const { user } = useAuth()
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

  return (
    <div className="space-y-4">
      {desktop ? (
        <PageHeader judul="Layanan" keterangan="Seluruh menu yang tersedia untuk peran Anda." />
      ) : (
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            aria-label="Kembali"
            className="touch-target flex items-center justify-center rounded-full bg-surface text-muted shadow-card"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-extrabold text-strong">
              <Grid2x2 size={18} /> Layanan
            </h1>
            <p className="text-xs text-muted">Menu sesuai peran Anda</p>
          </div>
        </div>
      )}

      {/* Fase 7 — ajakan memasang aplikasi ke layar utama (muncul bila peramban menawarkannya). */}
      <KartuPasangPwa />

      <LayananGrid items={layananPeran(user)} tanpaTautan />
    </div>
  )
}
