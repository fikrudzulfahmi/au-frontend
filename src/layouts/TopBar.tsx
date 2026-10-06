import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Menu, X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatJamLengkap, formatTanggalPanjang } from '@/lib/format'
import { MENU_SIDEBAR } from '@/lib/menu'
import { LABEL_PERAN } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useServerClock } from '@/lib/waktu'

/** FR-UI-13 — Top bar: judul halaman, jam live, lonceng antrean, menu pengguna. */
export function TopBar() {
  const { user, keluar } = useAuth()
  const { sekarang } = useServerClock()
  const location = useLocation()
  const [menuTerbuka, setMenuTerbuka] = useState(false)

  useEffect(() => setMenuTerbuka(false), [location.pathname])

  const judul = MENU_SIDEBAR.flatMap((g) => g.items).find((i) =>
    location.pathname.startsWith(i.to),
  )?.label

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-bold text-strong">{judul ?? 'SIPANDU'}</h1>
        <p className="tnum truncate text-[11px] text-muted">
          {formatTanggalPanjang(sekarang)} · {formatJamLengkap(sekarang)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="touch-target relative flex items-center justify-center rounded-control text-muted hover:bg-app-soft"
          aria-label="Antrean persetujuan"
        >
          <Bell size={19} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuTerbuka((v) => !v)}
            className="touch-target flex items-center gap-2 rounded-control px-2 hover:bg-app-soft"
            aria-expanded={menuTerbuka}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {inisial(user?.nama)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[140px] truncate text-xs font-bold text-strong">
                {user?.nama}
              </span>
              <span className="block text-[10px] text-muted">
                {user?.peran.map((p) => LABEL_PERAN[p]).join(' · ')}
              </span>
            </span>
          </button>

          {menuTerbuka && (
            <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-control border border-line bg-surface shadow-pop">
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-bold text-strong">{user?.nama}</p>
                <p className="truncate text-xs text-muted">@{user?.username}</p>
              </div>
              <button
                type="button"
                onClick={() => void keluar()}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-danger-soft',
                )}
              >
                <X size={16} /> Keluar
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="touch-target flex items-center justify-center rounded-control text-muted lg:hidden"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  )
}

function inisial(nama?: string | null): string {
  if (!nama) return '?'
  const bagian = nama.trim().split(/\s+/)
  return ((bagian[0]?.[0] ?? '') + (bagian[1]?.[0] ?? '')).toUpperCase()
}
