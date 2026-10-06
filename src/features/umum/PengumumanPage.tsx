import { Bell, Megaphone } from 'lucide-react'

import { PageHeader } from '@/components/ui/PageHeader'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { DESKTOP_BREAKPOINT } from '@/lib/env'

/**
 * FR-PMN-02 — semua pengguna login melihat pengumuman aktif.
 * Daftar dari `GET /pengumuman` diisi pada Fase 6; sampai saat itu halaman
 * menampilkan keadaan kosong yang jelas.
 */
export function PengumumanPage() {
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
  const daftar: Array<{ id: number; judul: string; isi: string; penting: boolean; tanggal: string }> =
    []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengumuman"
        keterangan={desktop ? 'Pengumuman dan pengingat aktif dari admin sekolah.' : undefined}
      />

      {daftar.length === 0 ? (
        <section className="card flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-app-soft text-muted">
            <Megaphone size={28} />
          </span>
          <h2 className="mt-4 text-base font-bold text-strong">Belum ada pengumuman</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Pengumuman yang dipublikasikan admin akan muncul di halaman ini dan pada beranda
            aplikasi.
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {daftar.map((p) => (
            <li key={p.id} className="card p-5">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-link" />
                <h2 className="text-sm font-bold text-strong">{p.judul}</h2>
              </div>
              <p className="mt-1.5 text-sm text-muted">{p.isi}</p>
              <p className="mt-2 text-xs text-muted">{p.tanggal}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
