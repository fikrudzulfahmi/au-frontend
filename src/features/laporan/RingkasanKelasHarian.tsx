import { Info, TriangleAlert } from 'lucide-react'

import type { KolomTabel } from '@/components/ui/DataTable'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/cn'
import { keteranganGuru } from './guruSesi'
import { sesiBelum, tentukanStatusKelas, urutkanKelas } from './ringkasanKelas'
import type { RingkasanKelasHarianItem } from './types'

/** Angka persen gaya Indonesia (koma desimal), seragam dengan laporan lain. */
function persen(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined) return '—'
  return `${String(nilai).replace('.', ',')}%`
}

interface RingkasanKelasHarianProps {
  data?: RingkasanKelasHarianItem[]
  /** Periode/tanggal laporan untuk judul blok, mis. "16 Oktober 2026". */
  periode?: string
  /** Hari libur: tidak ada sesi yang wajib diisi, jadi tabel per kelas tidak relevan. */
  libur?: {
    ada: boolean
    keterangan: string | null
  }
}

/**
 * Blok ringkasan status jurnal seluruh kelas pada laporan FR-LAP-13 (Jurnal Harian per Kelas).
 *
 * Ditampilkan di atas tabel detail sesi agar pimpinan sekolah / admin dapat langsung
 * mengidentifikasi kelas mana yang jurnalnya belum rampung pada tanggal terpilih.
 *
 * Seluruh kelas pada tahun pelajaran ikut ditampilkan — termasuk yang tidak punya
 * jadwal hari itu — karena kelas yang hilang dari daftar terbaca seolah aman.
 *
 * Setiap angka diberi satuan dan pembandingnya ("3 dari 4 jam", "13,6% keterisian"),
 * dan arti kolom "Berhalangan (izin)" dijelaskan pada catatan kaki — supaya pembaca
 * tidak perlu menebak apakah kelas itu dianggap lalai atau tidak.
 */
export function RingkasanKelasHarian({ data, periode, libur }: RingkasanKelasHarianProps) {
  // Hari libur: tidak ada sesi, jadi tidak ada yang bisa "belum diisi".
  if (libur?.ada === true) {
    return (
      <div className="card flex items-start gap-3 border-l-4 border-l-pending p-5">
        <Info size={18} className="mt-0.5 shrink-0 text-pending" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-strong">
            Hari libur{libur.keterangan ? `: ${libur.keterangan}` : ''}
          </p>
          <p className="text-xs text-muted">
            Tidak ada sesi terjadwal yang dihitung dan tidak ada jurnal yang wajib diisi
            {periode ? ` pada ${periode}` : ''}.
          </p>
        </div>
      </div>
    )
  }

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
  const kelasBerjadwal = kelas.filter((k) => !k.tanpa_jadwal && k.sesi > 0)
  const belumLengkap = kelasBerjadwal.filter((k) => k.belum > 0)
  const totalSesi = kelasBerjadwal.reduce((n, k) => n + k.sesi, 0)
  const totalSudah = kelasBerjadwal.reduce((n, k) => n + k.sudah, 0)
  const totalBelum = kelasBerjadwal.reduce((n, k) => n + k.belum, 0)
  const totalBerhalangan = kelasBerjadwal.reduce((n, k) => n + k.berhalangan, 0)
  const sesiDinilai = totalSesi - totalBerhalangan
  const persenTotal = sesiDinilai > 0 ? Math.round((totalSudah / sesiDinilai) * 1000) / 10 : null

  const kolom: KolomTabel<RingkasanKelasHarianItem>[] = [
    {
      kunci: 'kelas',
      judul: 'Kelas',
      render: (k) => <span className="font-semibold text-strong">{k.nama}</span>,
    },
    {
      kunci: 'sesi',
      judul: 'Jam terjadwal',
      render: (k) =>
        k.tanpa_jadwal || k.sesi === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <span className="tnum">{k.sesi} jam</span>
        ),
    },
    {
      kunci: 'sudah',
      judul: 'Sudah diisi',
      render: (k) =>
        // Kelas tanpa jadwal tidak diberi angka 0: nol terbaca sebagai
        // "tidak ada yang mengisi", padahal memang tidak ada pelajaran.
        k.tanpa_jadwal || k.sesi === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <span className={cn('tnum', k.sudah > 0 && 'font-medium text-success')}>{k.sudah}</span>
        ),
    },
    {
      kunci: 'belum',
      judul: 'Belum diisi',
      render: (k) =>
        k.tanpa_jadwal || k.sesi === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <span className={cn('tnum', k.belum > 0 && 'font-bold text-danger')}>{k.belum}</span>
        ),
    },
    {
      kunci: 'berhalangan',
      judul: 'Berhalangan (izin)',
      sembunyiMobile: true,
      render: (k) =>
        k.tanpa_jadwal || k.sesi === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <span className={cn('tnum', k.berhalangan > 0 && 'text-info')}>{k.berhalangan}</span>
        ),
    },
    {
      kunci: 'persen_terisi',
      judul: '% keterisian',
      sembunyiMobile: true,
      render: (k) => {
        if (
          k.tanpa_jadwal ||
          k.sesi === 0 ||
          k.persen_terisi === null ||
          k.persen_terisi === undefined
        ) {
          return <span className="text-muted">—</span>
        }
        return <span className="tnum font-medium">{persen(k.persen_terisi)}</span>
      },
    },
    {
      kunci: 'status',
      judul: 'Status',
      render: (k) => {
        const status = tentukanStatusKelas(k)
        return <StatusBadge varian={status.varian}>{status.teks}</StatusBadge>
      },
    },
    {
      // Menjawab langsung "jurnal mana yang belum diisi": bukan hanya jumlahnya,
      // tetapi jam, mata pelajaran, guru, dan alasan sesi itu belum terisi.
      kunci: 'rincian',
      judul: `Jurnal belum diisi (${totalBelum})`,
      render: (k) => {
        const belum = sesiBelum(k)

        if (k.tanpa_jadwal || k.sesi === 0) {
          return <span className="text-xs text-muted">Tidak ada sesi terjadwal pada hari ini</span>
        }

        if (belum.length === 0) {
          return (
            <span className="text-xs text-success">
              Seluruh {k.sesi} jam sudah terisi
              {k.berhalangan > 0 ? ` (${k.berhalangan} berhalangan izin)` : ''}
            </span>
          )
        }

        return (
          <ul className="space-y-1">
            {belum.map((s) => (
              <li key={`${s.jam_ke_mulai}-${s.kode_mapel}`} className="text-xs text-strong">
                <span className="font-semibold">{s.label_jam}</span>
                {' · '}
                {s.mapel}
                {s.guru ? <span className="text-muted"> — {keteranganGuru(s)}</span> : null}
                {s.alasan ? <span className="text-warn-text"> ({s.alasan})</span> : null}
              </li>
            ))}
          </ul>
        )
      },
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-bold text-strong">
          Ringkasan per Kelas{periode ? ` · ${periode}` : ''}
        </h3>
        <span className="text-xs text-muted">
          {kelas.length} kelas terdaftar · {totalSesi} jam terjadwal · {totalBelum} belum diisi ·{' '}
          {persenTotal === null ? '—' : persen(persenTotal)} keterisian
        </span>
      </div>

      {belumLengkap.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-danger-soft px-3 py-2">
          <TriangleAlert size={16} className="shrink-0 text-danger" aria-hidden />
          <span className="text-sm font-semibold text-danger">
            {belumLengkap.length} dari {kelasBerjadwal.length} kelas belum lengkap:
          </span>
          <span className="text-sm text-strong">{belumLengkap.map((k) => k.nama).join(', ')}</span>
        </div>
      ) : (
        <div className="rounded-control bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          Seluruh kelas dengan jadwal sudah mengisi jurnalnya.
        </div>
      )}

      <DataTable
        data={kelas}
        kunciBaris={(k) => k.kelas_id}
        kolom={kolom}
        kosong="Tidak ada data ringkasan kelas."
      />

      <p className="flex items-start gap-1.5 px-1 text-xs text-muted">
        <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          <strong className="text-strong">Berhalangan (izin)</strong> = guru tidak masuk dengan izin
          disetujui, sehingga sesi itu tidak dihitung sebagai belum diisi.{' '}
          <strong className="text-strong">% keterisian</strong> = jam sudah diisi ÷ (jam terjadwal −
          jam berhalangan). Tanda “—” pada jam terjadwal berarti kelas tidak punya pelajaran pada
          hari itu.
        </span>
      </p>
    </div>
  )
}
