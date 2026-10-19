import { useCallback, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'
import { LambangSipandu } from '@/components/ui/Logo'
import { menuBawah } from '@/lib/menu'
import { adminTanpaPegawai } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { MenuLainnya } from './MenuLainnya'

interface BottomNavProps {
  /** FR-UI-09: disembunyikan pada halaman presensi/kamera penuh layar. */
  tersembunyi?: boolean
}

/**
 * FR-UI-09 / 8.2 — Bottom menu 5 slot dengan tombol tengah melayang.
 * Item aktif: ikon + label biru tua. Tidak aktif: ikon abu-biru tanpa label.
 */
export function BottomNav({ tersembunyi = false }: BottomNavProps) {
  const { user } = useAuth()
  const location = useLocation()
  const items = menuBawah(user)
  const tengah = items[2]
  const kiri = items.slice(0, 2)
  // Slot 4 dipakai tombol "Lainnya" (seluruh menu sidebar); slot 5 tetap item terakhir.
  const kanan = items.slice(4)
  const [menuBuka, setMenuBuka] = useState(false)
  const tutupMenu = useCallback(() => setMenuBuka(false), [])
  const adminMode = adminTanpaPegawai(user)

  const aktif = (to: string) =>
    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(`${to}/`))

  // "Lainnya" menyala bila halaman aktif tidak termasuk empat tab yang tampak.
  const aktifLainnya = ![tengah, ...kiri, ...kanan].some((i) => aktif(i.to))

  if (tersembunyi) return null

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative mx-auto w-full max-w-lg px-2">
        <div className="relative h-[64px]">
          {/* Bilah putih dengan lekuk cekung di tengah */}
          <div className="absolute inset-0 rounded-t-[26px] bg-surface shadow-[0_-8px_24px_rgba(15,45,63,.10)]">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-[-8px] h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-app"
            />
          </div>

          {/* Tombol tengah melayang (FR-UI-10) */}
          <NavLink
            to={tengah.to}
            aria-label={tengah.label}
            className="absolute left-1/2 top-[-8px] z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-fab ring-[5px] ring-app transition-transform active:scale-95"
          >
            {adminMode ? (
              <tengah.icon size={26} strokeWidth={2.2} />
            ) : (
              <LambangSipandu size={30} terang />
            )}
            {tengah.lencanaPersetujuan && <span className="sr-only">Antrean persetujuan</span>}
          </NavLink>

          {/* Slot kiri & kanan */}
          <ul className="relative grid h-full grid-cols-5">
            {kiri.map((item) => (
              <ItemNav key={item.to} item={item} aktif={aktif(item.to)} />
            ))}
            <li aria-hidden="true" />
            <li>
              <button
                type="button"
                onClick={() => setMenuBuka(true)}
                aria-haspopup="dialog"
                aria-expanded={menuBuka}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center gap-1 text-[10px]',
                  aktifLainnya ? 'font-bold text-primary' : 'text-muted',
                )}
              >
                <LayoutGrid size={22} />
                <span className="leading-none">Lainnya</span>
              </button>
            </li>
            {kanan.map((item) => (
              <ItemNav key={item.to} item={item} aktif={aktif(item.to)} />
            ))}
          </ul>
        </div>
      </div>

      <MenuLainnya terbuka={menuBuka} onTutup={tutupMenu} />
    </nav>
  )
}

function ItemNav({ item, aktif }: { item: { to: string; label: string; icon: LucideIcon }; aktif: boolean }) {
  const Icon = item.icon
  return (
    <li>
      <NavLink
        to={item.to}
        className={cn(
          'flex h-full flex-col items-center justify-center gap-1 text-[10px]',
          aktif ? 'font-bold text-primary' : 'text-muted',
        )}
      >
        <Icon size={22} />
        {aktif && <span className="leading-none">{item.label}</span>}
        {!aktif && <span className="sr-only">{item.label}</span>}
      </NavLink>
    </li>
  )
}
