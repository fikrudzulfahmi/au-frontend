import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type Varian = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sukses'
type Ukuran = 'sm' | 'md' | 'lg'

const varian: Record<Varian, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-surface text-primary border border-line hover:bg-app-soft',
  ghost: 'bg-transparent text-muted hover:bg-app-soft hover:text-strong',
  danger: 'bg-danger text-white hover:bg-danger/90',
  sukses: 'bg-success text-white hover:bg-success/90',
}

const ukuran: Record<Ukuran, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: Varian
  ukuran?: Ukuran
  /** Memuat: menonaktifkan tombol dan menampilkan indikator. */
  memuat?: boolean
  penuh?: boolean
}

/** Tombol dasar; tinggi minimal 44 px untuk ukuran md/lg (FR-UI-03). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { varian: v = 'primary', ukuran: u = 'md', memuat, penuh, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || memuat}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        u !== 'sm' && 'min-h-[44px]',
        varian[v],
        ukuran[u],
        penuh && 'w-full',
        className,
      )}
      {...rest}
    >
      {memuat && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
})
