import { Construction } from 'lucide-react'

import { PageHeader } from '@/components/ui/PageHeader'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { DESKTOP_BREAKPOINT } from '@/lib/env'

interface FiturSegeraProps {
  judul: string
  fase: string
  keterangan?: string
}

/**
 * Penanda halaman yang fiturnya baru dikerjakan pada fase berikutnya (Bagian 11).
 * Tidak berisi fitur di luar dokumen spesifikasi.
 */
export function FiturSegera({ judul, fase, keterangan }: FiturSegeraProps) {
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

  return (
    <div className="space-y-4">
      {desktop && <PageHeader judul={judul} keterangan={`Dijadwalkan pada ${fase}.`} />}
      <section className="card flex flex-col items-center px-6 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-warn-bg text-warn-text">
          <Construction size={28} />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-strong">{judul}</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          {keterangan ??
            `Halaman ini belum aktif. Sesuai rencana pengerjaan, fitur ini dibangun pada ${fase}.`}
        </p>
        <span className="mt-4 rounded-full bg-app-soft px-3 py-1 text-xs font-bold text-muted">
          {fase}
        </span>
      </section>
    </div>
  )
}
