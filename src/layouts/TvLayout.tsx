import { Outlet } from 'react-router-dom'

/** Layout layar TV 16:9 tanpa chrome aplikasi (5.19). */
export function TvLayout() {
  return (
    <div className="min-h-dvh bg-[#0B1220] text-white">
      <Outlet />
    </div>
  )
}
