import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type ToastVariant = 'sukses' | 'gagal' | 'info'

export interface ToastItem {
  id: number
  pesan: string
  varian: ToastVariant
}

interface ToastContextValue {
  tampilkan: (pesan: string, varian?: ToastVariant) => void
  sukses: (pesan: string) => void
  gagal: (pesan: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let urutan = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const tampilkan = useCallback((pesan: string, varian: ToastVariant = 'info') => {
    urutan += 1
    const id = urutan
    setItems((prev) => [...prev, { id, pesan, varian }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      tampilkan,
      sukses: (pesan: string) => tampilkan(pesan, 'sukses'),
      gagal: (pesan: string) => tampilkan(pesan, 'gagal'),
    }),
    [tampilkan],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'animate-fade-up pointer-events-auto w-full max-w-sm rounded-control px-4 py-3 text-sm font-medium shadow-pop',
              t.varian === 'sukses' && 'bg-success text-white',
              t.varian === 'gagal' && 'bg-danger text-white',
              t.varian === 'info' && 'bg-strong text-white',
            )}
          >
            {t.pesan}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider')
  return ctx
}
