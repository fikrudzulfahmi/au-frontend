import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

interface CarouselProps {
  jumlah: number
  /** Interval pergantian slide (ms). */
  intervalMs?: number
  children: (indeks: number) => React.ReactNode
  className?: string
}

/** Carousel ringan tanpa pustaka (dipakai pengumuman beranda, landing, dan TV). */
export function Carousel({ jumlah, intervalMs = 6000, children, className }: CarouselProps) {
  const [indeks, setIndeks] = useState(0)
  const jeda = useRef<number | null>(null)

  useEffect(() => {
    if (jumlah <= 1) return
    jeda.current = window.setInterval(() => {
      setIndeks((i) => (i + 1) % jumlah)
    }, intervalMs)
    return () => {
      if (jeda.current) window.clearInterval(jeda.current)
    }
  }, [jumlah, intervalMs])

  if (jumlah === 0) return null

  return (
    <div className={cn('relative', className)}>
      <div className="animate-fade-up" key={indeks}>
        {children(Math.min(indeks, jumlah - 1))}
      </div>
      {jumlah > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: jumlah }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndeks(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === indeks ? 'w-5 bg-primary' : 'w-1.5 bg-muted/40',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
