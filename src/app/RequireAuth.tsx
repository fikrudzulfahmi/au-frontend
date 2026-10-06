import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { LambangSipandu } from '@/components/ui/Logo'
import { useAuth } from '@/features/auth/AuthContext'

/** A-21 — tanpa token, diarahkan ke /masuk. Otorisasi sebenarnya tetap di server. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, memuat } = useAuth()
  const location = useLocation()

  if (memuat) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3 text-muted">
          <LambangSipandu size={44} />
          <p className="text-sm font-semibold">Memuat…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/masuk" replace state={{ dari: location.pathname }} />
  }

  return <>{children}</>
}
