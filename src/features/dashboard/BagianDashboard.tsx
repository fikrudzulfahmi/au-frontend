import { Link } from 'react-router-dom'
import { Bell, ClipboardList, FileWarning, Inbox, Megaphone, TrendingUp } from 'lucide-react'

import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StatusVarian } from '@/components/ui/StatusBadge'
import { formatTanggalDari } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useAntreanPersetujuan,
  useJurnalBelumTerisi,
  usePengajuanTerakhir,
  usePengumumanAktif,
  useRekapBulanIni,
} from './useDashboardRingkas'

/* ------------------------------ 5.17 FR-DSH-01 ------------------------------ */

/** Ringkasan bulan ini untuk guru/pegawai (hadir, terlambat, izin) — FR-DSH-01. */
export function RingkasanBulanIni() {
  const { user } = useAuth()
  const pegawai = Boolean(user?.pegawai_id)
  const { data, isLoading, isError } = useRekapBulanIni(pegawai)

  if (!pegawai) return null

  const baris = data?.baris?.find((b) => b.pegawai_id === user?.pegawai_id) ?? data?.baris?.[0]

  return (
    <section className="card p-5" aria-label="Ringkasan bulan ini">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-strong">Ringkasan Bulan Ini</h2>
        <Link
          to="/laporan/presensi/rekap"
          className="inline-flex items-center gap-1 text-xs font-semibold text-link"
        >
          <TrendingUp size={14} /> Laporan rekap
        </Link>
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted">Memuat ringkasan…</p>}

      {isError && (
        <p className="mt-3 text-sm text-danger">Ringkasan bulan ini tidak dapat dimuat.</p>
      )}

      {data && !baris && (
        <p className="mt-3 text-sm text-muted">Belum ada data presensi pada bulan ini.</p>
      )}

      {baris && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <AngkaRingkas label="Hadir" nilai={baris.hadir} warna="text-success" />
            <AngkaRingkas label="Terlambat" nilai={baris.terlambat} warna="text-warn-text" />
            <AngkaRingkas
              label="Izin/sakit"
              nilai={baris.izin + baris.sakit + baris.cuti + baris.dinas}
              warna="text-info"
            />
          </div>

          {/* Persentase kehadiran bulan ini (dihitung server, bukan klien). */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>Kehadiran</span>
              <span className="tnum">{baris.persen_kehadiran}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-app-soft">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, baris.persen_kehadiran))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Dari {baris.hari_kerja} hari kerja pada bulan ini.
            </p>
          </div>
        </>
      )}
    </section>
  )
}

function AngkaRingkas({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="rounded-control bg-app-soft p-2.5">
      <p className={`tnum text-xl font-extrabold ${warna}`}>{nilai}</p>
      <p className="text-[11px] font-semibold text-muted">{label}</p>
    </div>
  )
}

/** Status pengajuan terakhir milik pengguna (FR-DSH-01). */
export function PengajuanTerakhir() {
  const { user } = useAuth()
  const pegawai = Boolean(user?.pegawai_id)
  const { data, isLoading, isError } = usePengajuanTerakhir(pegawai)

  if (!pegawai) return null

  return (
    <section className="card p-5" aria-label="Pengajuan terakhir">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-strong">Pengajuan Terakhir</h2>
        <Link
          to="/pengajuan"
          className="inline-flex items-center gap-1 text-xs font-semibold text-link"
        >
          <Inbox size={14} /> Semua pengajuan
        </Link>
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted">Memuat pengajuan…</p>}

      {isError && <p className="mt-3 text-sm text-danger">Pengajuan tidak dapat dimuat.</p>}

      {!isLoading && !isError && !data && (
        <p className="mt-3 text-sm text-muted">Belum ada pengajuan izin atau dinas.</p>
      )}

      {data && (
        <div className="mt-3 rounded-control bg-app-soft p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-strong">{data.label_jenis || data.jenis}</p>
            <StatusBadge varian={varianPengajuan(data.status)}>{data.label_status}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatTanggalDari(data.tanggal_mulai)}
            {data.tanggal_selesai && data.tanggal_selesai !== data.tanggal_mulai
              ? ` s.d. ${formatTanggalDari(data.tanggal_selesai)}`
              : ''}
          </p>
        </div>
      )}
    </section>
  )
}

function varianPengajuan(status: string): StatusVarian {
  switch (status) {
    case 'disetujui':
      return 'hadir'
    case 'ditolak':
      return 'alpa'
    case 'dibatalkan':
      return 'netral'
    default:
      return 'menunggu'
  }
}

/* ------------------------------ 5.17 FR-DSH-02 ------------------------------ */

/** Antrean persetujuan pimpinan: pengajuan + presensi luar radius (FR-DSH-02). */
export function AntreanPersetujuan() {
  const { data, isLoading, isError } = useAntreanPersetujuan(true)

  const total = (data?.izin ?? 0) + (data?.luarRadius ?? 0) + (data?.presensiLuarRadius ?? 0)

  return (
    <section className="card p-5" aria-label="Antrean persetujuan">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-strong">
          <ClipboardList size={17} className="text-primary" /> Antrean Persetujuan
        </h2>
        <StatusBadge varian={total > 0 ? 'menunggu' : 'netral'}>
          {total > 0 ? `${total} menunggu` : 'Tidak ada'}
        </StatusBadge>
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted">Memuat antrean…</p>}

      {isError && <p className="mt-3 text-sm text-danger">Antrean persetujuan tidak dapat dimuat.</p>}

      {data && (
        <ul className="mt-3 divide-y divide-line">
          <BarisAntrean
            label="Pengajuan izin/sakit/dinas"
            jumlah={data.izin}
            to="/persetujuan/pengajuan"
          />
          <BarisAntrean
            label="Pengajuan luar radius"
            jumlah={data.luarRadius}
            to="/persetujuan/presensi-luar-radius"
          />
          <BarisAntrean
            label="Presensi di luar radius"
            jumlah={data.presensiLuarRadius}
            to="/monitoring/presensi-harian"
          />
        </ul>
      )}
    </section>
  )
}

function BarisAntrean({ label, jumlah, to }: { label: string; jumlah: number; to: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80">
        <span className="text-sm font-semibold text-strong">{label}</span>
        <span className="flex items-center gap-2">
          <span className={`tnum text-sm font-extrabold ${jumlah > 0 ? 'text-warn-text' : 'text-muted'}`}>
            {jumlah}
          </span>
          <span className="text-xs text-link">Tinjau</span>
        </span>
      </Link>
    </li>
  )
}

/** Guru yang belum mengisi jurnal untuk sesi hari ini (FR-DSH-02). */
export function JurnalBelumTerisi() {
  const { data, isLoading, isError } = useJurnalBelumTerisi(true)

  const guru = (data?.guru ?? []).filter((g) => g.belum_terisi > 0)
  const totalBelum = guru.reduce((jumlah, g) => jumlah + g.belum_terisi, 0)

  return (
    <section className="card p-5" aria-label="Jurnal belum terisi hari ini">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-strong">
          <FileWarning size={17} className="text-primary" /> Jurnal Belum Terisi
        </h2>
        <Link to="/laporan/jurnal/kepatuhan" className="text-xs font-semibold text-link">
          Laporan kepatuhan
        </Link>
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted">Memuat kepatuhan jurnal…</p>}

      {isError && (
        <p className="mt-3 text-sm text-danger">Kepatuhan jurnal hari ini tidak dapat dimuat.</p>
      )}

      {data && guru.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          Semua sesi hari ini sudah diisi jurnalnya. Tidak ada yang tertinggal.
        </p>
      )}

      {data && guru.length > 0 && (
        <>
          <p className="mt-2 text-xs font-semibold text-muted">
            {totalBelum} sesi belum diisi oleh {guru.length} guru.
          </p>
          <ul className="mt-3 space-y-2">
            {guru.slice(0, 4).map((g) => (
              <li key={g.pegawai_id} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold text-strong">{g.nama}</span>
                <span className="shrink-0 text-xs font-bold text-warn-text">
                  {g.belum_terisi} dari {g.terjadwal} sesi
                </span>
              </li>
            ))}
          </ul>
          {guru.length > 4 && (
            <p className="mt-2 text-[11px] text-muted">+{guru.length - 4} guru lainnya</p>
          )}
        </>
      )}
    </section>
  )
}

/* ------------------------------ FR-PMN / BR-36 ------------------------------ */

/** Pengumuman aktif pada beranda (BR-36); diisi dari Fase 6. */
export function PanelPengumuman() {
  const { data, isLoading, isError } = usePengumumanAktif()
  const daftar = (data?.data ?? []).slice(0, 3)

  return (
    <section className="card p-5" aria-label="Pengumuman">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-strong">
          <Megaphone size={17} className="text-primary" /> Pengumuman
        </h2>
        <Link
          to="/pengumuman"
          className="inline-flex items-center gap-1 text-xs font-semibold text-link"
        >
          <Bell size={13} /> Semua
        </Link>
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted">Memuat pengumuman…</p>}

      {isError && <p className="mt-3 text-sm text-danger">Pengumuman tidak dapat dimuat.</p>}

      {!isLoading && !isError && daftar.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          Belum ada pengumuman aktif. Pengumuman dari admin akan tampil di sini.
        </p>
      )}

      {daftar.length > 0 && (
        <ul className="mt-3 space-y-3">
          {daftar.map((p) => (
            <li
              key={p.id}
              className={`rounded-control p-3 ${p.prioritas === 'penting' ? 'bg-warn-bg' : 'bg-app-soft'}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-strong">{p.judul}</p>
                {p.prioritas === 'penting' && <StatusBadge varian="bahaya">Penting</StatusBadge>}
              </div>
              {p.isi && <p className="mt-1 text-xs text-muted">{p.isi}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
