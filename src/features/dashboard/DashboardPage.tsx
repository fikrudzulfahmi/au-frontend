import { Link } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  CalendarDays,
  Clock,
  Fingerprint,
  Inbox,
  UserRound,
  UserX,
  Users,
} from 'lucide-react'

import ilustrasiGrup from '@/assets/ilustrasi/guru-khaki-grup.svg'
import { LayananGrid } from '@/components/ui/LayananGrid'
import { Logo } from '@/components/ui/Logo'
import { PageHeader } from '@/components/ui/PageHeader'
import { PresensiKinerjaCard } from '@/components/ui/PresensiKinerjaCard'
import type { PresensiKinerjaData } from '@/components/ui/PresensiKinerjaCard'
import { StatCard } from '@/components/ui/StatCard'
import { cn } from '@/lib/cn'
import { DESKTOP_BREAKPOINT } from '@/lib/env'
import { jamAtauNol } from '@/lib/format'
import { layananPeran } from '@/lib/menu'
import { adminTanpaPegawai, lencanaPeran, punyaPeran, ROLE } from '@/lib/roles'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { useServerClock } from '@/lib/waktu'
import { useSekolah } from '@/features/sekolah/useSekolah'
import { useAuth } from '@/features/auth/AuthContext'
import { usePresensiHariIni, useRingkasanHariIni } from './useDashboard'

/** FR-DSH-01/02 — beranda sesuai peran. */
export function DashboardPage() {
  const desktop = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
  return desktop ? <BerandaDesktop /> : <BerandaMobile />
}

/* ------------------------------ MOBILE ------------------------------ */

function BerandaMobile() {
  const { user } = useAuth()
  const { data: sekolah } = useSekolah()
  const { sekarang } = useServerClock()
  const { data: presensi } = usePresensiHariIni()

  return (
    <div className="-mx-4 -mt-4 pb-4">
      {/* FR-UI-05 — area kepala beranda */}
      <div className="relative overflow-hidden bg-app px-5 pb-14 pt-5">
        <div className="flex items-center justify-between">
          <Logo ukuran="md" />
          <Link
            to="/pengumuman"
            aria-label="Pengumuman"
            className="touch-target flex items-center justify-center rounded-full bg-surface/80 text-muted"
          >
            <Bell size={18} />
          </Link>
        </div>

        <div className="relative mt-4 pr-24">
          <h1 className="text-[26px] font-extrabold uppercase leading-[1.1] text-strong">
            {user?.nama ?? 'Pengguna'}
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">
            {user?.label_jabatan?.trim() ||
              user?.jabatan?.trim() ||
              (user?.jenis_pegawai === 'guru' ? 'Guru' : 'Pegawai')}
          </p>
          {user?.nip && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-muted">
              <UserRound size={13} /> NIP {user.nip}
            </span>
          )}
        </div>

        {/* FR-UI-16 — ilustrasi guru khaki (placeholder) mengintip dari tepi kartu */}
        <img
          src={ilustrasiGrup}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 bottom-0 h-40 w-auto"
        />
      </div>

      <div className="-mt-10 space-y-4 px-4">
        <PresensiKinerjaCard tanggal={sekarang} data={dataKartu(presensi, lencanaPeran(user))} />

        <LayananGrid items={layananPeran(user)} />

        <PanelPengumuman />

        <KartuJadwal />

        <p className="px-1 pb-2 text-center text-[11px] text-muted">
          {sekolah?.nama_sekolah ?? ''}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------ DESKTOP ------------------------------ */

function BerandaDesktop() {
  const { user } = useAuth()
  const { sekarang } = useServerClock()
  const { data: presensi } = usePresensiHariIni()
  const { data: ringkasan } = useRingkasanHariIni()
  const pimpinanView = punyaPeran(user, ROLE.admin, ROLE.kepalaSekolah, ROLE.wakasekKurikulum)

  return (
    <div className="space-y-6">
      <PageHeader
        judul={`Selamat datang, ${user?.nama ?? 'Pengguna'}`}
        keterangan="Ringkasan presensi dan kegiatan hari ini."
      />

      {pimpinanView && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Hadir hari ini" nilai={ringkasan?.hadir ?? 0} icon={Users} warna="success" />
          <StatCard
            label="Terlambat"
            nilai={ringkasan?.terlambat ?? 0}
            icon={Clock}
            warna="warn"
          />
          <StatCard label="Belum presensi" nilai={ringkasan?.belum ?? 0} icon={UserX} warna="danger" />
          <StatCard
            label="Izin / dinas"
            nilai={(ringkasan?.izin ?? 0) + (ringkasan?.dinas ?? 0)}
            icon={Inbox}
            warna="info"
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PresensiKinerjaCard
            tanggal={sekarang}
            data={dataKartu(presensi, lencanaPeran(user))}
            aksi={<TautanPresensi />}
          />
          <KartuJadwal />
        </div>

        <div className="space-y-6">
          <LayananGrid items={layananPeran(user)} />
          <PanelPengumuman />
        </div>
      </div>
    </div>
  )
}

function TautanPresensi() {
  const { user } = useAuth()
  if (adminTanpaPegawai(user) || !user?.pegawai_id) return null
  return (
    <Link
      to="/presensi"
      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white hover:bg-primary/90"
    >
      <Fingerprint size={18} /> Presensi Sekarang
    </Link>
  )
}

/* ------------------------------ BAGIAN BERSAMA ------------------------------ */

function dataKartu(
  presensi: ReturnType<typeof usePresensiHariIni>['data'],
  lencana: string,
): PresensiKinerjaData {
  const jamDatang = presensi?.jam_datang ?? null
  const jamPulang = presensi?.jam_pulang ?? null

  let lencanaFinal = lencana
  let varian: PresensiKinerjaData['lencanaVarian'] = 'netral'

  if (presensi?.libur) {
    lencanaFinal = 'LIBUR'
    varian = 'peringatan'
  } else if (presensi?.berhalangan) {
    lencanaFinal = (presensi.jenis_berhalangan ?? 'IZIN').toUpperCase()
    varian = 'peringatan'
  } else if (!presensi?.status_masuk) {
    lencanaFinal = 'BELUM PRESENSI'
    varian = 'bahaya'
  } else if (presensi.status_masuk === 'terlambat') {
    lencanaFinal = 'TERLAMBAT'
    varian = 'peringatan'
  } else {
    lencanaFinal = lencana || 'HARI KERJA'
    varian = 'sukses'
  }

  return {
    jamDatang: jamDatang ? jamAtauNol(jamDatang) : null,
    jamPulang: jamPulang ? jamAtauNol(jamPulang) : null,
    menitKerja: presensi?.menit_kerja ?? 0,
    menitKerjaTarget: presensi?.menit_kerja_target ?? 0,
    lencana: lencanaFinal,
    lencanaVarian: varian,
  }
}

function PanelPengumuman() {
  // FR-PMN — daftar pengumuman aktif; diisi pada Fase 6.
  const daftar: Array<{ id: number; judul: string; isi: string; penting: boolean }> = []

  return (
    <section className="card p-5" aria-label="Pengumuman">
      <h2 className="text-base font-bold text-strong">Pengumuman</h2>
      {daftar.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Belum ada pengumuman aktif. Pengumuman dari admin akan tampil di sini.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {daftar.map((p) => (
            <li key={p.id} className={cn('rounded-control p-3', p.penting ? 'bg-warn-bg' : 'bg-app-soft')}>
              <p className="text-sm font-bold text-strong">{p.judul}</p>
              <p className="text-xs text-muted">{p.isi}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function KartuJadwal() {
  const { user } = useAuth()
  if (!punyaPeran(user, ROLE.guru)) return null

  return (
    <section className="card p-5" aria-label="Jadwal hari ini">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-strong">Jadwal Hari Ini</h2>
        <Link to="/mengajar/jadwal" className="inline-flex items-center gap-1 text-xs font-semibold text-link">
          <CalendarDays size={14} /> Jadwal lengkap
        </Link>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-control bg-app-soft p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pastel-blue text-primary">
          <BookOpen size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold text-strong">Jadwal mengajar belum tersedia</p>
          <p className="text-xs text-muted">
            Daftar sesi mengajar dan status jurnal akan tampil setelah master jadwal diisi admin
            (Fase 2).
          </p>
        </div>
      </div>
    </section>
  )
}
