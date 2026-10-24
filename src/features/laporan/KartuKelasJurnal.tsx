import { CalendarOff, TriangleAlert } from 'lucide-react'

import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/cn'

import {
  labelJam,
  sesiTerurut,
  tentukanStatusKelas,
  tentukanStatusSesi,
  urutkanKelas,
} from './ringkasanKelas'
import { keteranganGuru } from './guruSesi'
import type { RingkasanKelasHarianItem } from './types'

interface KartuKelasJurnalProps {
  data?: RingkasanKelasHarianItem[]
  /** Tanggal laporan (YYYY-MM-DD) untuk keterangan pembaca layar, opsional. */
  tanggal?: string
  className?: string
}

/**
 * Satu kartu = satu kelas: barisnya adalah jam pelajaran beserta mapel dan guru
 * pengampu, dengan keterangan sudah/belum mengisi jurnal di sisi kanan.
 *
 * Bentuk ini menjawab "jurnal mana yang belum diisi" langsung per jam, bukan
 * hanya jumlah per kelas, sehingga pemantau tahu sesi dan guru mana yang perlu
 * ditagih tanpa membuka laporan.
 */
function KartuKelas({
  kelas,
  tanggal,
}: {
  kelas: RingkasanKelasHarianItem
  tanggal?: string
}) {
  const statusKelas = tentukanStatusKelas(kelas)
  const sesi = sesiTerurut(kelas)
  const tanpaJadwal = kelas.tanpa_jadwal || kelas.sesi === 0

  return (
    <article className="card flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h3 className="truncate text-sm font-bold text-strong">{kelas.nama}</h3>
        <StatusBadge varian={statusKelas.varian}>{statusKelas.teks}</StatusBadge>
      </header>

      {tanpaJadwal ? (
        <p className="flex items-center gap-2 px-3 py-3 text-xs text-muted">
          <CalendarOff size={15} className="shrink-0" aria-hidden />
          Tidak ada jadwal pada hari ini.
        </p>
      ) : (
        <ul
          className="divide-y divide-line"
          aria-label={`Sesi jurnal kelas ${kelas.nama}${tanggal ? ` tanggal ${tanggal}` : ''}`}
        >
          {sesi.map((s) => {
            const status = tentukanStatusSesi(s)
            const belum = s.status === 'belum'

            return (
              <li
                key={`${s.jam_ke_mulai}-${s.guru_id}-${s.kode_mapel}`}
                className={cn(
                  'flex items-start justify-between gap-2 px-3 py-2',
                  belum && 'border-l-2 border-danger',
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm text-strong">
                    <span className="tnum font-semibold">{labelJam(s)}</span>
                    <span className="text-muted"> · </span>
                    {s.mapel}
                  </p>
                  <p className="truncate text-xs text-muted">{keteranganGuru(s)}</p>
                  {s.alasan ? (
                    <p className="text-xs text-warn-text">{s.alasan}</p>
                  ) : s.materi ? (
                    <p className="truncate text-xs text-muted">{s.materi}</p>
                  ) : null}
                </div>

                <StatusBadge varian={status.varian} className="shrink-0">
                  {status.teks}
                </StatusBadge>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

/**
 * Keterisian jurnal seluruh kelas pada satu hari, satu kartu per kelas.
 *
 * Seluruh kelas pada tahun pelajaran ikut ditampilkan — termasuk yang tidak
 * punya jadwal hari itu — karena kelas yang hilang dari daftar terbaca seolah
 * aman. Kelas yang jurnalnya belum lengkap diletakkan paling depan.
 */
export function KartuKelasJurnal({ data, tanggal, className }: KartuKelasJurnalProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card overflow-hidden">
        <EmptyState
          judul="Belum ada data kelas"
          keterangan="Tidak ada ringkasan jurnal kelas pada tanggal yang dipilih."
        />
      </div>
    )
  }

  const kelas = urutkanKelas(data)
  const totalBelum = kelas.reduce((n, k) => n + k.belum, 0)

  return (
    <div className={cn('space-y-2', className)}>
      {totalBelum > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-danger-soft px-3 py-2">
          <TriangleAlert size={16} className="shrink-0 text-danger" aria-hidden />
          <span className="text-sm font-semibold text-danger">
            {totalBelum} jam belum diisi pada{' '}
            {kelas.filter((k) => !k.tanpa_jadwal && k.belum > 0).length} kelas
          </span>
        </div>
      ) : (
        <div className="rounded-control bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          Seluruh kelas dengan jadwal sudah mengisi jurnalnya.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {kelas.map((k) => (
          <KartuKelas key={k.kelas_id} kelas={k} tanggal={tanggal} />
        ))}
      </div>
    </div>
  )
}
