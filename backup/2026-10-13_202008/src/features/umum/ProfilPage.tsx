import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, LogOut, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { DESKTOP_BREAKPOINT } from '@/lib/env'
import { LABEL_PERAN } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'

/** Halaman /profil — profil pengguna dan pintasan ganti password. */
export function ProfilPage() {
  const { user, keluar } = useAuth()
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

  const baris: Array<[string, string]> = [
    ['Username', user?.username ?? '-'],
    ['Nama', user?.nama ?? '-'],
    ['Peran', user?.peran.map((p) => LABEL_PERAN[p]).join(', ') || '-'],
    ['NIP / ID', user?.nip ?? '-'],
    ['Jabatan', user?.jabatan ?? '-'],
    ['Status kepegawaian', user?.status_kepegawaian ?? '-'],
  ]

  return (
    <div className="space-y-4">
      {desktop ? (
        <PageHeader judul="Profil" keterangan="Data akun dan keamanan." />
      ) : (
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            aria-label="Kembali"
            className="touch-target flex items-center justify-center rounded-full bg-surface text-muted shadow-card"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-extrabold text-strong">Profil</h1>
        </div>
      )}

      <section className="card p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white">
            {(user?.nama ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-strong">{user?.nama}</p>
            <p className="truncate text-sm text-muted">@{user?.username}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {user?.peran.map((p) => (
                <StatusBadge key={p} varian="izin">
                  {LABEL_PERAN[p]}
                </StatusBadge>
              ))}
              {user?.jenis_pegawai && (
                <StatusBadge varian="dinas">{user.jenis_pegawai.toUpperCase()}</StatusBadge>
              )}
            </div>
          </div>
        </div>

        {user?.wajib_ganti_password && (
          <p className="mt-4 rounded-control bg-warn-bg px-3 py-2.5 text-sm font-medium text-warn-text">
            Password awal wajib diganti. Silakan buka menu Ganti Password.
          </p>
        )}
      </section>

      <section className="card divide-y divide-line">
        {baris.map(([label, nilai]) => (
          <div key={label} className="flex items-start justify-between gap-4 px-5 py-3.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
            <span className="text-right text-sm font-medium text-strong">{nilai}</span>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link to="/ganti-password" className="flex-1">
          <Button varian="secondary" penuh>
            <KeyRound size={17} /> Ganti Password
          </Button>
        </Link>
        <Button varian="danger" penuh className="flex-1" onClick={() => void keluar()}>
          <LogOut size={17} /> Keluar
        </Button>
      </div>

      <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted">
        <UserRound size={12} /> Satu akun hanya dapat dipakai pada satu perangkat terdaftar.
        Hubungi admin untuk reset perangkat.
      </p>
    </div>
  )
}
