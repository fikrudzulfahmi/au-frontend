import { useQuery } from '@tanstack/react-query'
import { Bell, Megaphone } from 'lucide-react'

import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { get } from '@/lib/api'
import { formatTanggalDari } from '@/lib/format'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { DESKTOP_BREAKPOINT } from '@/lib/env'

interface PengumumanAktif {
  id: number
  judul: string
  isi: string | null
  tipe: string
  prioritas: string
  tanggal_mulai: string
  tanggal_selesai: string | null
}

/**
 * FR-PMN-02 — semua pengguna login melihat pengumuman aktif (BR-36).
 * Hanya pengumuman yang benar-benar tayang yang dikembalikan server.
 */
export function PengumumanPage() {
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pengumuman', 'aktif'],
    queryFn: () => get<{ data: PengumumanAktif[] }>('/pengumuman/aktif'),
  })

  const daftar = data?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengumuman"
        keterangan={desktop ? 'Pengumuman dan pengingat aktif dari admin sekolah.' : undefined}
      />

      {isError && (
        <p className="card p-6 text-sm text-danger">
          Pengumuman gagal dimuat. Periksa koneksi lalu muat ulang halaman.
        </p>
      )}

      {!isError && daftar.length === 0 && (
        <section className="card">
          <EmptyState
            icon={Megaphone}
            judul={isLoading ? 'Memuat pengumuman…' : 'Belum ada pengumuman'}
            keterangan="Pengumuman yang dipublikasikan admin akan muncul di halaman ini dan pada beranda aplikasi."
          />
        </section>
      )}

      {daftar.length > 0 && (
        <ul className="space-y-3">
          {daftar.map((p) => (
            <li key={p.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Bell size={16} className="text-link" />
                <h2 className="text-sm font-bold text-strong">{p.judul}</h2>
                {p.prioritas === 'penting' && <StatusBadge varian="bahaya">Penting</StatusBadge>}
              </div>
              <p className="mt-1.5 text-sm text-muted">{p.isi ?? '—'}</p>
              <p className="mt-2 text-xs text-muted">
                Tayang {formatTanggalDari(p.tanggal_mulai)}
                {p.tanggal_selesai ? ` s.d. ${formatTanggalDari(p.tanggal_selesai)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
