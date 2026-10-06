import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface PageHeaderProps {
  judul: string
  keterangan?: string
  aksi?: ReactNode
  className?: string
}

export function PageHeader({ judul, keterangan, aksi, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h1 className="text-xl font-extrabold text-strong sm:text-2xl">{judul}</h1>
        {keterangan && <p className="mt-0.5 text-sm text-muted">{keterangan}</p>}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </header>
  )
}
