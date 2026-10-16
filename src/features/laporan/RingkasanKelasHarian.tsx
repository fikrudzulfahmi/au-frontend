import { TriangleAlert } from 'lucide-react'

import type { KolomTabel } from '@/components/ui/DataTable'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StatusVarian } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/cn'
import type { RingkasanKelasHarianItem, SesiKelasHarian } from './types'

/**
 * Menentukan label teks dan varian lencana untuk status keterisian jurnal per kelas.
 *
 * Mengikuti aturan BR laporan:
 * - 'Tidak ada jadwal' bila kelas tanpa jadwal (tanpa_jadwal = true atau sesi = 0),
 *   jangan sampai dianggap atau diberi label 'belum terisi'.
 * - 'N belum terisi' bila masih ada sesi mengajar yang jurnalnya belum diisi guru.
 * - 'Semua terisi' bila seluruh sesi terjadwal (sesi > 0) telah terisi atau berhalangan dengan izin.
 *
 * Teks eksplisit selalu ditampilkan agar tidak mengandalkan warna semata (aksesibilitas).
 */
function tentukanStatus(item: RingkasanKelasHarianItem): {
  teks: string
  varian: StatusVarian
} {
  if (item.tanpa_jadwal || item.sesi === 0) {
    return { teks: 'Tidak ada jadwal', varian: 'netral' }
  }

  if (item.belum > 0) {
    return { teks: `${item.belum} belum terisi`, varian: 'bahaya' }
  }

  return { teks: 'Semua terisi', varian: 'sukses' }
}

/** Sesi pada satu kelas yang jurnalnya belum diisi — inti pertanyaan pemantau. */
function sesiBelum(k: RingkasanKelasHarianItem): SesiKelasHarian[] {
  return (k.daftar ?? []).filter((s) => s.status === 'belum')
}

/**
 * Urutan baca: kelas yang masih menggantung lebih dulu.
 *
 * Seluruh kelas tetap ditampilkan (permintaan pemantau), tetapi kelas yang
 * belum lengkap tidak boleh tersembunyi di antara kelas yang sudah aman —
 * karena itu yang belum terisi naik ke atas, kelas tanpa jadwal turun ke bawah.
 */
function urutkan(data: RingkasanKelasHarianItem[]): RingkasanKelasHarianItem[] {
  return [...data].sort((a, b) => {
    if (a.tanpa_jadwal !== b.tanpa_jadwal) return a.tanpa_jadwal ? 1 : -1
    if (a.belum !== b.belum) return b.belum - a.belum
    return a.nama.localeCompare(b.nama)
  })
}

const KOLOM_RINGKASAN_KELAS: KolomTabel<RingkasanKelasHarianItem>[] = [
  {
    kunci: 'kelas',
    judul: 'Kelas',
    render: (k) => <span className="font-semibold text-strong">{k.nama}</span>,
  },
  {
    kunci: 'sesi',
    judul: 'Sesi',
    render: (k) => <span className="tnum">{k.sesi}</span>,
  },
  {
    kunci: 'sudah',
    judul: 'Terisi',
    render: (k) => <span className="tnum">{k.sudah}</span>,
  },
  {
    kunci: 'belum',
    judul: 'Belum',
    render: (k) => (
      <span className={cn('tnum', k.belum > 0 && !k.tanpa_jadwal && 'font-bold text-danger')}>
        {k.belum}
      </span>
    ),
  },
  {
    kunci: 'berhalangan',
    judul: 'Berhalangan',
    sembunyiMobile: true,
    render: (k) => <span className="tnum">{k.berhalangan}</span>,
  },
  {
    kunci: 'persen_terisi',
    judul: '% Terisi',
    sembunyiMobile: true,
    render: (k) => {
      if (k.tanpa_jadwal || k.persen_terisi === null || k.persen_terisi === undefined) {
        return <span className="text-muted">—</span>
      }
      return <span className="tnum font-medium">{k.persen_terisi}%</span>
    },
  },
  {
    kunci: 'status',
    judul: 'Status',
    render: (k) => {
      const { teks, varian } = tentukanStatus(k)
      return <StatusBadge varian={varian}>{teks}</StatusBadge>
    },
  },
  {
    // Menjawab langsung "jurnal mana yang belum diisi": bukan hanya jumlahnya,
    // tetapi jam dan mata pelajaran yang menggantung pada kelas itu.
    kunci: 'rincian',
    judul: 'Jurnal belum diisi',
    render: (k) => {
      const belum = sesiBelum(k)

      if (k.tanpa_jadwal) {
        return <span className="text-xs text-muted">Tidak ada sesi terjadwal hari ini</span>
      }

      if (belum.length === 0) {
        return <span className="text-xs text-success">Seluruh sesi sudah terisi</span>
      }

      return (
        <ul className="space-y-0.5">
          {belum.map((s) => (
            <li key={`${s.jam_ke_mulai}-${s.kode_mapel}`} className="text-xs text-strong">
              <span className="font-semibold">{s.label_jam}</span>
              {' · '}
              {s.mapel}
              {s.guru ? <span className="text-muted"> — {s.guru}</span> : null}
              {s.alasan ? <span className="text-warn-text"> ({s.alasan})</span> : null}
            </li>
          ))}
        </ul>
      )
    },
  },
]

interface RingkasanKelasHarianProps {
  data?: RingkasanKelasHarianItem[]
}

/**
 * Blok ringkasan status jurnal seluruh kelas pada laporan FR-LAP-13 (Jurnal Harian per Kelas).
 *
 * Ditampilkan di atas tabel detail sesi agar pimpinan sekolah / admin dapat langsung
 * mengidentifikasi kelas mana yang jurnalnya belum rampung pada tanggal terpilih.
 *
 * Seluruh kelas pada tahun pelajaran ikut ditampilkan — termasuk yang tidak punya
 * jadwal hari itu — karena kelas yang hilang dari daftar terbaca seolah aman.
 */
export function RingkasanKelasHarian({ data }: RingkasanKelasHarianProps) {
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

  const kelas = urutkan(data)
  const belumLengkap = kelas.filter((k) => !k.tanpa_jadwal && k.belum > 0)
  const totalBelum = kelas.reduce((n, k) => n + k.belum, 0)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="text-sm font-bold text-strong">Ringkasan per Kelas</h3>
        <span className="text-xs text-muted">
          {kelas.length} kelas terdaftar
          {belumLengkap.length > 0 ? ` · ${totalBelum} sesi belum terisi` : null}
        </span>
      </div>

      {belumLengkap.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-danger-soft px-3 py-2">
          <TriangleAlert size={16} className="shrink-0 text-danger" aria-hidden />
          <span className="text-sm font-semibold text-danger">
            {belumLengkap.length} dari {kelas.filter((k) => !k.tanpa_jadwal).length} kelas belum
            lengkap:
          </span>
          <span className="text-sm text-strong">
            {belumLengkap.map((k) => k.nama).join(', ')}
          </span>
        </div>
      ) : (
        <div className="rounded-control bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          Seluruh kelas dengan jadwal sudah mengisi jurnalnya.
        </div>
      )}

      <DataTable
        data={kelas}
        kunciBaris={(k) => k.kelas_id}
        kolom={KOLOM_RINGKASAN_KELAS}
        kosong="Tidak ada data ringkasan kelas."
      />
    </div>
  )
}
