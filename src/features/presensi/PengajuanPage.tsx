import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, MapPinPlus, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { aksi } from '@/lib/crud'
import { formatTanggalDari } from '@/lib/format'
import { daftarPengajuanIzin, daftarPengajuanLuarRadius } from './api'
import { OPSI_JENIS_IZIN } from './types'

const VARIAN_STATUS: Record<string, 'hadir' | 'izin' | 'menunggu' | 'alpa' | 'cuti'> = {
  menunggu: 'izin',
  disetujui: 'hadir',
  ditolak: 'alpa',
  dibatalkan: 'cuti',
}

/** FR-IZN-09 / FR-PRS-12 — pengajuan milik sendiri: izin dan luar radius. */
export function PengajuanPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'izin' | 'luar-radius'>('izin')
  const [halaman, setHalaman] = useState(1)
  const [batal, setBatal] = useState<{ id: number; nama: string; jenis: 'izin' | 'luar' } | null>(null)

  const izin = useQuery({
    queryKey: ['pengajuan-izin', { halaman }],
    queryFn: () => daftarPengajuanIzin({ page: halaman, per_page: 25 }),
    enabled: tab === 'izin',
  })

  const luarRadius = useQuery({
    queryKey: ['pengajuan-luar-radius', { halaman }],
    queryFn: () => daftarPengajuanLuarRadius({ page: halaman, per_page: 25 }),
    enabled: tab === 'luar-radius',
  })

  const batalkanIzin = useMutation({
    mutationFn: (id: number) => aksi(`/pengajuan-izin/${id}/batalkan`, {}),
    onSuccess: () => { toast.sukses('Pengajuan dibatalkan.'); setBatal(null); void qc.invalidateQueries({ queryKey: ['pengajuan-izin'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const dataIzin = izin.data
  const dataLuar = luarRadius.data

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengajuan Saya"
        keterangan="Izin, sakit, dinas, cuti, dan pengajuan presensi di luar radius."
        aksi={
          <>
            <Link to="/pengajuan/izin/baru">
              <Button varian="secondary"><CalendarPlus size={17} /> Izin / Dinas</Button>
            </Link>
            <Link to="/pengajuan/luar-radius/baru">
              <Button><MapPinPlus size={17} /> Luar Radius</Button>
            </Link>
          </>
        }
      />

      <div className="flex gap-1 rounded-control bg-surface p-1 shadow-card">
        {([['izin', 'Izin / Sakit / Dinas / Cuti'], ['luar-radius', 'Presensi Luar Radius']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => { setTab(k); setHalaman(1) }}
            className={`rounded-[13px] px-4 py-2 text-sm font-bold transition-colors ${tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-app-soft'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'izin' && (
        <>
          <DataTable
            data={dataIzin?.data ?? []}
            kunciBaris={(p) => p.id}
            kosong="Belum ada pengajuan izin."
            kolom={[
              { kunci: 'jenis', judul: 'Jenis', render: (p) => <span className="font-bold text-strong">{p.label_jenis}</span> },
              {
                kunci: 'tanggal',
                judul: 'Tanggal',
                render: (p) => (
                  <span className="text-sm">
                    {formatTanggalDari(p.tanggal_mulai)}
                    {p.tanggal_selesai !== p.tanggal_mulai && ` – ${formatTanggalDari(p.tanggal_selesai)}`}
                    <span className="tnum text-xs text-muted"> · {p.jumlah_hari} hari</span>
                  </span>
                ),
              },
              { kunci: 'alasan', judul: 'Alasan', render: (p) => <span className="text-sm text-muted">{p.alasan}</span>, sembunyiMobile: true },
              {
                kunci: 'status',
                judul: 'Status',
                render: (p) => (
                  <span className="flex flex-wrap gap-1">
                    <StatusBadge varian={VARIAN_STATUS[p.status] ?? 'izin'}>{p.label_status}</StatusBadge>
                    {p.presensi_luar_radius && <StatusBadge varian="cuti">Luar radius</StatusBadge>}
                  </span>
                ),
              },
              ...(dataIzin?.data.some((p) => p.status === 'menunggu')
                ? [{
                    kunci: 'aksi', judul: 'Aksi', className: 'w-24',
                    render: (p: (typeof dataIzin.data)[number]) =>
                      p.status === 'menunggu' ? (
                        <button type="button"
                          onClick={() => setBatal({ id: p.id, nama: `${p.label_jenis} ${formatTanggalDari(p.tanggal_mulai)}`, jenis: 'izin' })}
                          className="flex items-center gap-1 text-sm font-semibold text-danger">
                          <XCircle size={14} /> Batalkan
                        </button>
                      ) : <span className="text-xs text-muted">—</span>,
                  }]
                : []),
            ]}
          />
          <Pagination halaman={dataIzin?.meta.page ?? 1} perHalaman={dataIzin?.meta.per_page ?? 25}
            total={dataIzin?.meta.total ?? 0} onUbah={setHalaman} />
        </>
      )}

      {tab === 'luar-radius' && (
        <>
          <DataTable
            data={dataLuar?.data ?? []}
            kunciBaris={(p) => p.id}
            kosong="Belum ada pengajuan presensi luar radius."
            kolom={[
              { kunci: 'tanggal', judul: 'Tanggal', render: (p) => formatTanggalDari(p.tanggal) },
              { kunci: 'alasan', judul: 'Alasan', render: (p) => <span className="text-sm text-muted">{p.alasan}</span> },
              {
                kunci: 'asal',
                judul: 'Asal',
                render: (p) => (p.dari_dinas ? <StatusBadge varian="cuti">Dari dinas</StatusBadge> : <span className="text-xs text-muted">Mandiri</span>),
                sembunyiMobile: true,
              },
              { kunci: 'status', judul: 'Status', render: (p) => <StatusBadge varian={VARIAN_STATUS[p.status] ?? 'izin'}>{p.label_status}</StatusBadge> },
            ]}
          />
          <Pagination halaman={dataLuar?.meta.page ?? 1} perHalaman={dataLuar?.meta.per_page ?? 25}
            total={dataLuar?.meta.total ?? 0} onUbah={setHalaman} />
        </>
      )}

      <p className="px-1 text-xs text-muted">
        Pengajuan luar radius yang disetujui membuat presensi Anda pada tanggal itu langsung sah (BR-17 Jalur A).
        Jenis {OPSI_JENIS_IZIN.map((o) => o.label).join(', ')}.
      </p>

      <ConfirmDialog terbuka={batal !== null} judul="Batalkan pengajuan?"
        keterangan={batal ? `${batal.nama} akan dibatalkan.` : ''}
        labelKonfirmasi="Batalkan" memuat={batalkanIzin.isPending}
        onKonfirmasi={() => batal && batalkanIzin.mutate(batal.id)} onTutup={() => setBatal(null)} />
    </div>
  )
}
