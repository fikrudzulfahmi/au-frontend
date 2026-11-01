import { cn } from '@/lib/cn'

interface LogoProps {
  /** Ukuran teks wordmark. */
  ukuran?: 'sm' | 'md' | 'lg'
  /** Tampilkan lambang (emblem) di samping wordmark. */
  denganLambang?: boolean
  className?: string
  /** Warna teks (mis. putih untuk TV / latar gelap). */
  terang?: boolean
}

/**
 * Lambang + wordmark SIPANDU (1 — aturan pemakaian nama).
 * Kepanjangan SIPANDU belum ditetapkan: tampilkan hanya "SIPANDU".
 */
export function Logo({ ukuran = 'md', denganLambang = true, className, terang }: LogoProps) {
  const teks =
    ukuran === 'lg' ? 'text-2xl' : ukuran === 'sm' ? 'text-base' : 'text-xl'

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {denganLambang && <LambangSipandu size={ukuran === 'sm' ? 22 : 30} terang={terang} />}
      <span
        className={cn(
          'font-extrabold tracking-tight',
          teks,
          terang ? 'text-white' : 'text-primary',
        )}
      >
        SIPANDU
      </span>
    </span>
  )
}

/** Ikon sidik jari dalam perisai — dipakai logo, FAB, dan ikon PWA. */
export function LambangSipandu({ size = 30, terang = false }: { size?: number; terang?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="sipandu-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={terang ? '#FFFFFF' : '#2646B0'} />
          <stop offset="100%" stopColor={terang ? '#D7E1FF' : '#1E2A8A'} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#sipandu-grad)" />
      <g
        stroke={terang ? '#1E2A8A' : '#FFFFFF'}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M24 12c-5.6 0-10 4.5-10 10v6" />
        <path d="M24 17c-2.8 0-5 2.3-5 5v8" />
        <path d="M24 22c-1.1 0-2 .9-2 2v9" />
        <path d="M34 22v4c0 4.4-1.6 8.5-4.3 11.6" />
        <path d="M29 15.4c3 1.6 5 4.8 5 8.6" />
      </g>
    </svg>
  )
}
