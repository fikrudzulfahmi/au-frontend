import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'
import { LambangSipandu } from '@/components/ui/Logo'
import { menuBawah } from '@/lib/menu'
import { adminTanpaPegawai } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'

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
  const kanan = items.slice(3)
  const adminMode = adminTanpaPegawai(user)

  const aktif = (to: string) =>
    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(`${to}/`))

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
              className="absolute left-1/2 top-0 h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-app"
            />
          </div>

          {/* Tombol tengah melayang (FR-UI-10) */}
          <NavLink
            to={tengah.to}
            aria-label={tengah.label}
            className="absolute left-1/2 top-0 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-[62%] items-center justify-center rounded-full bg-primary text-white shadow-fab ring-[5px] ring-app transition-transform active:scale-95"
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
            {kanan.map((item) => (
              <ItemNav key={item.to} item={item} aktif={aktif(item.to)} />
            ))}
          </ul>
        </div>
      </div>
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
