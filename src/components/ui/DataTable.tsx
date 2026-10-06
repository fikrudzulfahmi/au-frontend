import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { EmptyState } from './EmptyState'

export interface KolomTabel<T> {
  kunci: string
  judul: string
  render: (baris: T) => ReactNode
  /** Sembunyikan kolom pada layar kecil. */
  sembunyiMobile?: boolean
  className?: string
}

interface DataTableProps<T> {
  kolom: KolomTabel<T>[]
  data: T[]
  kunciBaris: (baris: T) => string | number
  kosong?: string
  className?: string
}

/**
 * FR-UI-15 / 5.22 — tabel desktop dengan header lembut; pada layar kecil
 * dirender sebagai daftar kartu.
 */
export function DataTable<T>({
  kolom,
  data,
  kunciBaris,
  kosong = 'Belum ada data untuk ditampilkan.',
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="card overflow-hidden">
        <EmptyState judul="Belum ada data" keterangan={kosong} />
      </div>
    )
  }

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* Desktop: tabel */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-app-soft text-left">
              {kolom.map((k) => (
                <th
                  key={k.kunci}
                  className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted', k.className)}
                >
                  {k.judul}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((baris) => (
              <tr key={kunciBaris(baris)} className="border-t border-line hover:bg-app-soft/60">
                {kolom.map((k) => (
                  <td key={k.kunci} className={cn('px-4 py-3 align-middle text-strong', k.className)}>
                    {k.render(baris)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: daftar kartu */}
      <ul className="divide-y divide-line lg:hidden">
        {data.map((baris) => (
          <li key={kunciBaris(baris)} className="space-y-1.5 px-4 py-3">
            {kolom
              .filter((k) => !k.sembunyiMobile)
              .map((k) => (
                <div key={k.kunci} className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold text-muted">{k.judul}</span>
                  <span className="text-right text-sm text-strong">{k.render(baris)}</span>
                </div>
              ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
