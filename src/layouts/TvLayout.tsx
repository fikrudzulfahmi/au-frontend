import { Outlet } from 'react-router-dom'

/**
 * Layout layar TV (5.19) — tema gelap, satu-satunya bagian aplikasi bertema
 * gelap, dan TIDAK boleh menggulir (KP-6.9).
 */
export function TvLayout() {
  return (
    <div className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#0B1220] text-white">
      <Outlet />
    </div>
  )
}
