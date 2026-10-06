import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/cn'
import type { LayananItem } from '@/lib/menu'

const warnaIkon: Record<LayananItem['warna'], string> = {
  hijau: 'bg-pastel-green text-success',
  biru: 'bg-pastel-blue text-primary',
  oranye: 'bg-pastel-orange text-warn-text',
  kuning: 'bg-pastel-yellow text-warn-text',
}

interface LayananGridProps {
  items: LayananItem[]
  /** Sembunyikan tautan "Lihat Semua" (mis. pada halaman /layanan). */
  tanpaTautan?: boolean
  className?: string
}

/**
 * FR-UI-07 — grid 4 kolom ikon bulat berwarna pastel dengan label.
 * Fitur yang belum aktif diberi lencana oranye "Segera".
 */
export function LayananGrid({ items, tanpaTautan = false, className }: LayananGridProps) {
  return (
    <section className={cn('card p-5', className)} aria-label="Layanan lainnya">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-strong">Layanan Lainnya</h2>
        {!tanpaTautan && (
          <Link
            to="/layanan"
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-link"
          >
            Lihat Semua <ChevronRight size={16} />
          </Link>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-4 gap-y-5">
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <Link
              to={item.to}
              className="flex flex-col items-center gap-2 text-center"
              aria-label={item.label}
            >
              <span className="relative">
                <span
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full',
                    warnaIkon[item.warna],
                  )}
                >
                  <item.icon size={24} strokeWidth={2} />
                </span>
                {item.segera && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-warn-bg px-1.5 py-0.5 text-[9px] font-bold uppercase text-warn-text">
                    Segera
                  </span>
                )}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-strong">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
