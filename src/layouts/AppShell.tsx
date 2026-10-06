import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/cn'
import { DESKTOP_BREAKPOINT } from '@/lib/env'
import { useMediaQuery } from '@/lib/useMediaQuery'

/** Halaman penuh layar (FR-UI-11): presensi, kamera, dan pengisian jurnal. */
const HALAMAN_PENUH = [/^\/presensi$/, /^\/presensi\/kamera/, /^\/mengajar\/jurnal\/isi/]

export function AppShell() {
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
  const [ciut, setCiut] = useState(false)
  const location = useLocation()
  const halamanPenuh = HALAMAN_PENUH.some((r) => r.test(location.pathname))

  // FR-UI-01: mobile < 1024 px memakai bottom menu; desktop >= 1024 px memakai sidebar.
  if (!desktop) {
    return (
      <div className="min-h-dvh bg-app">
        <main className={cn('mx-auto w-full max-w-lg px-4 pt-4', halamanPenuh ? 'pb-4' : 'pb-28')}>
          <Outlet />
        </main>
        <BottomNav tersembunyi={halamanPenuh} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-app">
      <Sidebar ciut={ciut} onToggleCiut={() => setCiut((v) => !v)} />
      <div className={cn('transition-[padding] duration-200', ciut ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
