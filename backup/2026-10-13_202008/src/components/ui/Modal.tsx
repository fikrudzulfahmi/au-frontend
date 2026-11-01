import { useEffect } from 'react'
import { X } from 'lucide-react'

import { cn } from '@/lib/cn'

interface ModalProps {
  terbuka: boolean
  judul: string
  keterangan?: string
  onTutup: () => void
  children: React.ReactNode
  /** Lebar maksimum panel. */
  lebar?: 'sm' | 'md' | 'lg'
  footer?: React.ReactNode
}

const lebarKelas = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' } as const

/** FR-UI-14 — formulir dua kolom pada panel besar; mobile ditampilkan penuh. */
export function Modal({
  terbuka,
  judul,
  keterangan,
  onTutup,
  children,
  lebar = 'md',
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!terbuka) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [terbuka, onTutup])

  if (!terbuka) return null

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-strong/45 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col rounded-t-card bg-surface shadow-pop sm:rounded-card',
          lebarKelas[lebar],
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-strong">{judul}</h2>
            {keterangan && <p className="mt-0.5 text-xs text-muted">{keterangan}</p>}
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="touch-target flex items-center justify-center rounded-full text-muted hover:bg-app-soft"
          >
            <X size={18} />
          </button>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>
  )
}
