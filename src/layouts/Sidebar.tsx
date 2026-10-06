import { NavLink } from 'react-router-dom'
import { ChevronLeft, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { cn } from '@/lib/cn'
import { Logo } from '@/components/ui/Logo'
import { MENU_SIDEBAR } from '@/lib/menu'
import { LABEL_PERAN } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useSekolah } from '@/features/sekolah/useSekolah'

interface SidebarProps {
  ciut: boolean
  onToggleCiut: () => void
}

/** FR-UI-12 — Sidebar kiri tetap (264 px; ciut 76 px berikon saja). */
export function Sidebar({ ciut, onToggleCiut }: SidebarProps) {
  const { user, keluar } = useAuth()
  const { data: sekolah } = useSekolah()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex',
        ciut ? 'w-[76px]' : 'w-[264px]',
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <Logo ukuran={ciut ? 'sm' : 'md'} denganLambang />
      </div>

      {!ciut && (
        <p className="-mt-3 px-4 pb-3 text-xs font-medium leading-snug text-muted">
          {sekolah?.nama_sekolah ?? 'Memuat info sekolah…'}
        </p>
      )}

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4" aria-label="Navigasi utama">
        {MENU_SIDEBAR.map((grup) => {
          const items = grup.items.filter((i) => (i.akses ? i.akses(user) : true))
          if (items.length === 0) return null
          return (
            <div key={grup.judul} className="mb-4">
              {!ciut && (
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {grup.judul}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors',
                          ciut && 'justify-center px-0',
                          isActive
                            ? 'bg-primary-soft font-bold text-primary'
                            : 'text-muted hover:bg-app-soft hover:text-strong',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon size={19} />
                          {!ciut && <span className="truncate">{item.label}</span>}
                          {!ciut && isActive && (
                            <ChevronLeft size={14} className="ml-auto rotate-180 opacity-70" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-line p-3">
        {!ciut && user && (
          <div className="mb-2 rounded-control bg-app-soft px-3 py-2">
            <p className="truncate text-sm font-bold text-strong">{user.nama}</p>
            <p className="truncate text-[11px] text-muted">
              {user.peran.map((p) => LABEL_PERAN[p]).join(' · ') || 'Pengguna'}
            </p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleCiut}
            className="touch-target flex flex-1 items-center justify-center gap-2 rounded-control text-xs font-semibold text-muted hover:bg-app-soft"
            aria-label={ciut ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
          >
            {ciut ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!ciut && <span>Ciutkan</span>}
          </button>
          <button
            type="button"
            onClick={() => void keluar()}
            className="touch-target flex items-center justify-center rounded-control px-3 text-danger hover:bg-danger-soft"
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
