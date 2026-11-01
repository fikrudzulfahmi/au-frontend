import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/cn'

interface PaginationProps {
  halaman: number
  perHalaman: number
  total: number
  onUbah: (halaman: number) => void
  className?: string
}

export function Pagination({ halaman, perHalaman, total, onUbah, className }: PaginationProps) {
  const jumlahHalaman = Math.max(1, Math.ceil(total / perHalaman))
  if (total === 0) return null

  const mulai = (halaman - 1) * perHalaman + 1
  const sampai = Math.min(halaman * perHalaman, total)

  return (
    <nav
      className={cn('flex flex-wrap items-center justify-between gap-3 px-1 pt-3', className)}
      aria-label="Navigasi halaman"
    >
      <p className="tnum text-xs text-muted">
        Menampilkan {mulai}–{sampai} dari {total} data
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onUbah(halaman - 1)}
          disabled={halaman <= 1}
          className="touch-target flex items-center gap-1 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-muted disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Sebelumnya
        </button>
        <span className="tnum text-xs font-bold text-strong">
          {halaman} / {jumlahHalaman}
        </span>
        <button
          type="button"
          onClick={() => onUbah(halaman + 1)}
          disabled={halaman >= jumlahHalaman}
          className="touch-target flex items-center gap-1 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-muted disabled:opacity-40"
        >
          Berikutnya <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  )
}
