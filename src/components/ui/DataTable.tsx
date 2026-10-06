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

/** Dukungan centang massal (FR-PLK-01: pilih siswa lalu tempatkan ke kelas). */
interface PilihProps<T> {
  terpilih: Array<string | number>
  onUbah: (kunci: string | number, dicentang: boolean) => void
  /** Centang pada judul kolom untuk memilih seluruh baris satu halaman. */
  onSemua?: (dicentang: boolean) => void
  idBaris: (baris: T) => string | number
}

interface DataTableProps<T> {
  kolom: KolomTabel<T>[]
  data: T[]
  kunciBaris: (baris: T) => string | number
  kosong?: string
  className?: string
  pilih?: PilihProps<T>
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
  pilih,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="card overflow-hidden">
        <EmptyState judul="Belum ada data" keterangan={kosong} />
      </div>
    )
  }

  const semuaTerpilih = pilih !== undefined && data.every((b) => pilih.terpilih.includes(pilih.idBaris(b)))

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* Desktop: tabel */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-app-soft text-left">
              {pilih && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua baris"
                    checked={semuaTerpilih}
                    onChange={(e) => pilih.onSemua?.(e.target.checked)}
                  />
                </th>
              )}
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
                {pilih && (
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      aria-label={`Pilih baris ${kunciBaris(baris)}`}
                      checked={pilih.terpilih.includes(pilih.idBaris(baris))}
                      onChange={(e) => pilih.onUbah(pilih.idBaris(baris), e.target.checked)}
                    />
                  </td>
                )}
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
            {pilih && (
              <label className="flex items-center gap-2 text-sm font-semibold text-strong">
                <input
                  type="checkbox"
                  checked={pilih.terpilih.includes(pilih.idBaris(baris))}
                  onChange={(e) => pilih.onUbah(pilih.idBaris(baris), e.target.checked)}
                />
                Pilih
              </label>
            )}
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
