import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { formatJamLengkap, formatTanggalPanjang } from '@/lib/format'
import { GaugeMenitKerja } from './GaugeMenitKerja'

export interface PresensiKinerjaData {
  jamDatang: string | null
  jamPulang: string | null
  /** X — menit kerja berjalan (A-20). */
  menitKerja: number
  /** Y — durasi jam kerja hari ini. */
  menitKerjaTarget: number
  /** Lencana kanan atas: GURU / HARI KERJA / LIBUR / TERLAMBAT (FR-UI-06). */
  lencana: string
  /** Warna lencana agar konsisten dengan status. */
  lencanaVarian?: 'netral' | 'sukses' | 'peringatan' | 'bahaya'
}

interface PresensiKinerjaCardProps {
  tanggal: Date
  data: PresensiKinerjaData
  className?: string
  aksi?: ReactNode
}

const varianLencana: Record<string, string> = {
  netral: 'bg-primary-soft text-primary',
  sukses: 'bg-success-soft text-success',
  peringatan: 'bg-warn-bg text-warn-text',
  bahaya: 'bg-danger-soft text-danger',
}

/**
 * FR-UI-06 — Kartu putih membulat besar "Presensi & Kinerja".
 * Dipakai pada beranda mobile, beranda desktop, dan laman TV tidak memakainya.
 */
export function PresensiKinerjaCard({
  tanggal,
  data,
  className,
  aksi,
}: PresensiKinerjaCardProps) {
  const varian = data.lencanaVarian ?? 'netral'

  return (
    <section className={cn('card p-5', className)} aria-label="Presensi dan kinerja">
      <div className="flex items-start justify-between gap-3">
        <p className="tnum text-xs font-medium text-muted">
          {formatTanggalPanjang(tanggal)} · {formatJamLengkap(tanggal)}
        </p>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide',
            varianLencana[varian],
          )}
        >
          {data.lencana}
        </span>
      </div>

      <h2 className="mt-1 text-lg font-extrabold text-strong">Presensi &amp; Kinerja</h2>

      <div className="mt-3 h-px bg-line" />

      <div className="mt-4 flex items-center justify-between gap-4">
        <dl className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="#2BA84A" strokeWidth="2" />
                <path
                  d="M12 7.5V12l3 2"
                  fill="none"
                  stroke="#2BA84A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <dd className="tnum text-base font-extrabold leading-tight text-strong">
                {data.jamDatang ?? '00:00:00'}
              </dd>
              <dt className="text-xs font-medium text-muted">Jam Datang</dt>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="#D93A3A" strokeWidth="2" />
                <path
                  d="M12 7.5V12l3 2"
                  fill="none"
                  stroke="#D93A3A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <dd className="tnum text-base font-extrabold leading-tight text-strong">
                {data.jamPulang ?? '00:00:00'}
              </dd>
              <dt className="text-xs font-medium text-muted">Jam Pulang</dt>
            </div>
          </div>
        </dl>

        <GaugeMenitKerja berjalan={data.menitKerja} target={data.menitKerjaTarget} />
      </div>

      {aksi && <div className="mt-5">{aksi}</div>}
    </section>
  )
}
