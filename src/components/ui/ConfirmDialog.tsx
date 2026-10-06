import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

import { Button } from './Button'
import { cn } from '@/lib/cn'

interface ConfirmDialogProps {
  terbuka: boolean
  judul: string
  keterangan?: string
  labelKonfirmasi?: string
  labelBatal?: string
  /** Warna tombol konfirmasi; pakai 'danger' untuk operasi destruktif (BR-31). */
  varian?: 'primary' | 'danger'
  memuat?: boolean
  onKonfirmasi: () => void
  onTutup: () => void
}

/** BR-31 — operasi destruktif memerlukan konfirmasi. */
export function ConfirmDialog({
  terbuka,
  judul,
  keterangan,
  labelKonfirmasi = 'Lanjutkan',
  labelBatal = 'Batal',
  varian = 'danger',
  memuat,
  onKonfirmasi,
  onTutup,
}: ConfirmDialogProps) {
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-strong/45 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={cn('w-full max-w-md rounded-card bg-surface p-5 shadow-pop')}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              varian === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary',
            )}
          >
            <AlertTriangle size={20} />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-bold text-strong">{judul}</h2>
            {keterangan && <p className="mt-1 text-sm text-muted">{keterangan}</p>}
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onTutup}
            className="touch-target flex items-center justify-center rounded-full text-muted hover:bg-app-soft"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button varian="ghost" onClick={onTutup}>
            {labelBatal}
          </Button>
          <Button varian={varian === 'danger' ? 'danger' : 'primary'} memuat={memuat} onClick={onKonfirmasi}>
            {labelKonfirmasi}
          </Button>
        </div>
      </div>
    </div>
  )
}
