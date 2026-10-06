import { Link, Outlet } from 'react-router-dom'

import { Logo } from '@/components/ui/Logo'
import { APP_NAME } from '@/lib/env'
import { useSekolah } from '@/features/sekolah/useSekolah'

/** Layout publik untuk landing page dan halaman masuk (FR-LND). */
export function PublicLayout() {
  const { data: sekolah } = useSekolah()

  return (
    <div className="min-h-dvh bg-surface">
      <Outlet />
      <footer className="border-t border-line bg-app-soft px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <Logo ukuran="sm" />
            <p className="mt-1 text-xs text-muted">
              {sekolah?.nama_sekolah ?? 'Info sekolah belum diisi'}
            </p>
          </div>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {APP_NAME} · v0.1.0
          </p>
        </div>
        <div className="mx-auto mt-4 max-w-5xl text-center text-xs text-muted">
          <Link to="/tv" className="font-semibold text-link">
            Layar TV
          </Link>
        </div>
      </footer>
    </div>
  )
}
