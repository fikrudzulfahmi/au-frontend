import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { cn } from '@/lib/cn'
import { Logo } from '@/components/ui/Logo'
import { MENU_SIDEBAR, cariItemAktif, grupAktif } from '@/lib/menu'
import type { NavItem } from '@/lib/menu'
import { LABEL_PERAN } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useSekolah } from '@/features/sekolah/useSekolah'

interface SidebarProps {
  ciut: boolean
  onToggleCiut: () => void
}

/**
 * FR-UI-12 — Sidebar dua tingkat: menu grup (ikon + judul) membuka submenu.
 * Grup halaman aktif terbuka otomatis; hanya SATU item yang disorot (cocok terpanjang).
 * Mode ciut: ikon grup saja; arahkan kursor untuk flyout submenu.
 */
export function Sidebar({ ciut, onToggleCiut }: SidebarProps) {
  const { user, keluar } = useAuth()
  const { data: sekolah } = useSekolah()
  const { pathname } = useLocation()
  const [dibuka, setDibuka] = useState<Record<string, boolean>>({})
  const [flyout, setFlyout] = useState<string | null>(null)

  const itemAktif = cariItemAktif(pathname)
  const judulAktif = grupAktif(pathname)

  // Grup halaman aktif selalu terbuka (tanpa mengunci pilihan pengguna).
  const grupTerbuka = (judul: string) => dibuka[judul] ?? judul === judulAktif

  const toggle = (judul: string) => setDibuka((d) => ({ ...d, [judul]: !grupTerbuka(judul) }))

  const grup = MENU_SIDEBAR.map((g) => ({
    ...g,
    items: g.items.filter((i) => (i.akses ? i.akses(user) : true)),
  })).filter((g) => g.items.length > 0)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex',
        ciut ? 'w-[76px]' : 'w-[264px]',
      )}
      onMouseLeave={() => setFlyout(null)}
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
        <ul className="space-y-1">
          {grup.map((g) => {
            const terbuka = grupTerbuka(g.judul)
            const punyaAktif = g.items.some((i) => i.to === itemAktif?.to)

            return (
              <li key={g.judul} className="relative">
                <button
                  type="button"
                  title={g.judul}
                  aria-expanded={terbuka && !ciut}
                  onClick={() => toggle(g.judul)}
                  onMouseEnter={() => ciut && setFlyout(g.judul)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors',
                    ciut && 'justify-center px-0',
                    punyaAktif
                      ? 'bg-primary-soft font-bold text-primary'
                      : 'text-muted hover:bg-app-soft hover:text-strong',
                  )}
                >
                  <g.icon size={19} />
                  {!ciut && (
                    <>
                      <span className="flex-1 truncate text-left">{g.judul}</span>
                      <ChevronDown
                        size={15}
                        className={cn('shrink-0 opacity-60 transition-transform', terbuka && 'rotate-180')}
                      />
                    </>
                  )}
                </button>

                {/* Submenu: pita lebar saat lebar; flyout saat ciut (hover). */}
                {!ciut && terbuka && (
                  <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-line pl-3">
                    {g.items.map((item) => (
                      <li key={item.to}>
                        <SubmenuItem item={item} aktif={itemAktif?.to === item.to} />
                      </li>
                    ))}
                  </ul>
                )}
                {ciut && flyout === g.judul && (
                  <div className="absolute left-full top-0 z-50 w-56 rounded-control border border-line bg-surface p-2 shadow-pop">
                    <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      {g.judul}
                    </p>
                    <ul className="space-y-0.5">
                      {g.items.map((item) => (
                        <li key={item.to}>
                          <SubmenuItem item={item} aktif={itemAktif?.to === item.to} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
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

/** Item submenu — sorotan tunggal tanpa chevron ganda. */
function SubmenuItem({ item, aktif }: { item: NavItem; aktif: boolean }) {
  return (
    <NavLink
      to={item.to}
      title={item.label}
      className={cn(
        'flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
        // Penanda tunggal dari cariItemAktif — tanpa isActive bawaan (match prefix) agar tak dobel.
        aktif ? 'bg-primary-soft font-bold text-primary' : 'text-muted hover:bg-app-soft hover:text-strong',
      )}
    >
      <item.icon size={17} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}
