import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'

interface StatCardProps {
  label: string
  nilai: string | number
  icon?: LucideIcon
  /** Warna aksen kartu. */
  warna?: 'primary' | 'success' | 'danger' | 'warn' | 'info' | 'muted'
  keterangan?: string
  className?: string
}

const aksen: Record<NonNullable<StatCardProps['warna']>, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-bg text-warn-text',
  info: 'bg-info-soft text-info',
  muted: 'bg-gray-soft text-gray',
}

export function StatCard({ label, nilai, icon: Icon, warna = 'primary', keterangan, className }: StatCardProps) {
  return (
    <div className={cn('card flex items-center gap-3 p-4', className)}>
      {Icon && (
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-control', aksen[warna])}>
          <Icon size={20} />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted">{label}</p>
        <p className="tnum text-xl font-extrabold leading-tight text-strong">{nilai}</p>
        {keterangan && <p className="truncate text-[11px] text-muted">{keterangan}</p>}
      </div>
    </div>
  )
}
