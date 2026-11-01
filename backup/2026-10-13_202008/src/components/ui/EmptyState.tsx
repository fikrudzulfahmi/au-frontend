import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

import { cn } from '@/lib/cn'

interface EmptyStateProps {
  judul?: string
  keterangan?: string
  icon?: LucideIcon
  aksi?: React.ReactNode
  className?: string
}

export function EmptyState({
  judul = 'Belum ada data',
  keterangan,
  icon: Icon = Inbox,
  aksi,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-app-soft text-muted">
        <Icon size={28} />
      </span>
      <p className="mt-4 text-sm font-bold text-strong">{judul}</p>
      {keterangan && <p className="mt-1 max-w-sm text-xs text-muted">{keterangan}</p>}
      {aksi && <div className="mt-4">{aksi}</div>}
    </div>
  )
}
