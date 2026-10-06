import { cn } from '@/lib/cn'

interface ProgressRingProps {
  /** 0–100 */
  nilai: number
  ukuran?: number
  tebal?: number
  className?: string
  warna?: string
  trackWarna?: string
  children?: React.ReactNode
}

/** Cincin persentase (dipakai layar TV & laporan). */
export function ProgressRing({
  nilai,
  ukuran = 96,
  tebal = 10,
  className,
  warna = 'var(--color-primary)',
  trackWarna = 'var(--color-app)',
  children,
}: ProgressRingProps) {
  const persen = Math.max(0, Math.min(100, nilai))
  const r = (ukuran - tebal) / 2
  const keliling = 2 * Math.PI * r
  const geser = keliling * (1 - persen / 100)

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={ukuran} height={ukuran} viewBox={`0 0 ${ukuran} ${ukuran}`} className="-rotate-90">
        <circle
          cx={ukuran / 2}
          cy={ukuran / 2}
          r={r}
          fill="none"
          stroke={trackWarna}
          strokeWidth={tebal}
        />
        <circle
          cx={ukuran / 2}
          cy={ukuran / 2}
          r={r}
          fill="none"
          stroke={warna}
          strokeWidth={tebal}
          strokeLinecap="round"
          strokeDasharray={keliling}
          strokeDashoffset={geser}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
