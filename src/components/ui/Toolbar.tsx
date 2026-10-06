import { Search } from 'lucide-react'

import { cn } from '@/lib/cn'
import { kelasInput } from './FormField'

interface ToolbarProps {
  cari?: string
  onCari?: (nilai: string) => void
  placeholderCari?: string
  children?: React.ReactNode
  aksi?: React.ReactNode
  className?: string
}

/** FR-UI-14 — filter di atas tabel, aksi di kanan. */
export function Toolbar({
  cari,
  onCari,
  placeholderCari = 'Cari…',
  children,
  aksi,
  className,
}: ToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {onCari && (
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={cari ?? ''}
            onChange={(e) => onCari(e.target.value)}
            placeholder={placeholderCari}
            aria-label={placeholderCari}
            className={cn(kelasInput, 'pl-9')}
          />
        </div>
      )}
      {children}
      {aksi && <div className="ml-auto flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  )
}
