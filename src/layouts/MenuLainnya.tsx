import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, LayoutGrid, Search, X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { MENU_SIDEBAR } from '@/lib/menu'
import { useAuth } from '@/features/auth/AuthContext'

interface MenuLainnyaProps {
  terbuka: boolean
  onTutup: () => void
}

/**
 * FR-UI-09 (mobile) — panel "Lainnya": seluruh menu sidebar yang boleh diakses
 * pengguna, dikelompokkan seperti di desktop, sehingga halaman yang hanya ada di
 * sidebar tetap terjangkau dari HP. Ada pencarian untuk menu yang banyak.
 */
export function MenuLainnya({ terbuka, onTutup }: MenuLainnyaProps) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [cari, setCari] = useState('')
  const kolomCari = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!terbuka) return
    setCari('')
    kolomCari.current?.focus()
  }, [terbuka])

  // Tutup otomatis setelah pindah halaman.
  useEffect(() => {
    onTutup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!terbuka) return
    const kunci = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup()
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', kunci)

    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', kunci)
    }
  }, [terbuka, onTutup])

  if (!terbuka) return null

  const kunci = cari.trim().toLowerCase()
  const grup = MENU_SIDEBAR.map((g) => ({
    ...g,
    items: g.items.filter((i) => (i.akses ? i.akses(user) : true)),
  }))
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      ...g,
      items: kunci === '' ? g.items : g.items.filter((i) => i.label.toLowerCase().includes(kunci)),
    }))
    .filter((g) => g.items.length > 0)

  const aktif = (to: string) =>
    pathname === to || (to !== '/dashboard' && pathname.startsWith(`${to}/`))

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={onTutup}
        className="absolute inset-0 bg-strong/45 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu lainnya"
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[26px] bg-surface shadow-[0_-12px_40px_rgba(15,45,63,.22)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
          <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-line" />
          <h2 className="pt-3 text-lg font-extrabold text-strong">Menu Lainnya</h2>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="touch-target mt-3 flex items-center justify-center rounded-full bg-app-soft text-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 px-5 pb-2">
          <label htmlFor="cari-menu" className="sr-only">
            Cari menu
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="cari-menu"
              ref={kolomCari}
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari menu…"
              className="w-full rounded-control border border-line bg-app-soft py-2.5 pl-9 pr-3 text-sm text-strong outline-none focus:border-primary"
            />
          </div>
        </div>

        <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Semua menu">
          <NavLink
            to="/layanan"
            onClick={onTutup}
            className={({ isActive }) =>
              cn(
                'mt-1 flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold',
                isActive ? 'bg-primary-soft text-primary' : 'text-strong hover:bg-app-soft',
              )
            }
          >
            <LayoutGrid size={18} className="text-primary" /> Semua Layanan
            <ChevronRight size={15} className="ml-auto text-muted" />
          </NavLink>

          {grup.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted">Menu “{cari.trim()}” tidak ditemukan.</p>
          )}

          {grup.map((g) => {
            const IkonGrup = g.icon

            return (
              <section key={g.judul} className="mt-3">
                <p className="flex items-center gap-2 px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                  <IkonGrup size={13} /> {g.judul}
                </p>
                <ul>
                  {g.items.map((i) => {
                    const Ikon = i.icon
                    const sorot = aktif(i.to)

                    return (
                      <li key={i.to}>
                        <NavLink
                          to={i.to}
                          onClick={onTutup}
                          className={cn(
                            'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm',
                            sorot ? 'bg-primary-soft font-bold text-primary' : 'text-strong hover:bg-app-soft',
                          )}
                        >
                          <Ikon size={18} className={sorot ? 'text-primary' : 'text-muted'} />
                          <span className="truncate">{i.label}</span>
                          {i.lencanaPersetujuan && (
                            <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-danger" aria-label="Ada antrean" />
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
