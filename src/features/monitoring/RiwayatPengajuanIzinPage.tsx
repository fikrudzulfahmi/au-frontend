import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangTeks } from '@/components/ui/Bidang'
import { master } from '@/lib/crud'
import { formatTanggalDari } from '@/lib/format'
import { LampiranPengajuan } from '@/features/monitoring/LampiranPengajuan'
import type { PengajuanIzin } from '@/features/presensi/types'
import { OPSI_JENIS_IZIN } from '@/features/presensi/types'

const VARIAN_STATUS: Record<string, 'hadir' | 'izin' | 'menunggu' | 'alpa' | 'cuti'> = {
  menunggu: 'izin',
  disetujui: 'hadir',
  ditolak: 'alpa',
  dibatalkan: 'cuti',
}

/** Riwayat semua pengajuan izin untuk admin — filter status, pegawai, tanggal. */
export function RiwayatPengajuanIzinPage() {
  const [halaman, setHalaman] = useState(1)
  const [pilih, setPilih] = useState<PengajuanIzin | null>(null)

  // Filter
  const [nama, setNama] = useState('')
  const [jenis, setJenis] = useState('')
  const [status, setStatus] = useState('')
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')

  const params: Record<string, string | number> = { page: halaman, per_page: 25 }
  if (nama.trim()) params.nama = nama.trim()
  if (jenis) params.jenis = jenis
  if (status) params.status = status
  if (dari) params.dari = dari
  if (sampai) params.sampai = sampai

  const data = useQuery({
    queryKey: ['pengajuan-izin', 'riwayat', params],
    queryFn: () => master.daftar<PengajuanIzin>('/pengajuan-izin', params),
  })

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Riwayat Pengajuan Izin"
        keterangan="Semua pengajuan izin, sakit, dinas, dan cuti — menunggu, disetujui, ditolak, dibatalkan."
      />

      {/* Filter inline */}
      <div className="flex flex-wrap items-end gap-2">
        <BidangTeks label="Nama pegawai" id="nama-pegawai" nilai={nama} onUbah={(v) => { setNama(v); setHalaman(1) }}
          className="w-56" petunjuk="" placeholder="Cari nama atau NIP" />

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-strong">Jenis</span>
          <select value={jenis} onChange={(e) => { setJenis(e.target.value); setHalaman(1) }}
            className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
            <option value="">Semua</option>
            {OPSI_JENIS_IZIN.map((o) => (
              <option key={o.nilai} value={o.nilai}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-strong">Status</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setHalaman(1) }}
            className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
            <option value="">Semua</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </label>

        <BidangTeks label="Dari tanggal" id="dari" tipe="date" nilai={dari} onUbah={(v) => { setDari(v); setHalaman(1) }}
          className="w-44" />
        <BidangTeks label="Sampai tanggal" id="sampai" tipe="date" nilai={sampai} onUbah={(v) => { setSampai(v); setHalaman(1) }}
          className="w-44" />

        {(nama || jenis || status || dari || sampai) && (
          <Button varian="ghost" onClick={() => {
            setNama(''); setJenis(''); setStatus(''); setDari(''); setSampai('')
            setHalaman(1)
          }}>
            Reset
          </Button>
        )}
      </div>

      <DataTable
        data={data.data?.data ?? []}
        kunciBaris={(p) => p.id}
        kosong="Tidak ada pengajuan."
        kolom={[
          { kunci: 'nama', judul: 'Pegawai', render: (p) => <span className="font-bold text-strong">{p.pegawai?.nama ?? '—'}</span> },
          { kunci: 'jenis', judul: 'Jenis', render: (p) => <StatusBadge varian="izin">{p.label_jenis}</StatusBadge> },
          {
            kunci: 'tanggal', judul: 'Tanggal',
            render: (p) => (
              <span className="text-sm">
                {formatTanggalDari(p.tanggal_mulai)}
                {p.tanggal_selesai !== p.tanggal_mulai && ` – ${formatTanggalDari(p.tanggal_selesai)}`}
                <span className="tnum text-xs text-muted"> · {p.jumlah_hari} hari</span>
              </span>
            ),
          },
          { kunci: 'alasan', judul: 'Alasan', render: (p) => <span className="text-xs text-muted line-clamp-2">{p.alasan}</span>, sembunyiMobile: true },
          {
            kunci: 'status', judul: 'Status',
            render: (p) => (
              <span className="flex flex-wrap gap-1">
                <StatusBadge varian={VARIAN_STATUS[p.status] ?? 'izin'}>{p.label_status}</StatusBadge>
                {p.presensi_luar_radius && <StatusBadge varian="cuti">Luar radius</StatusBadge>}
              </span>
            ),
          },
          {
            kunci: 'aksi', judul: 'Aksi', className: 'w-20',
            render: (p) => (
              <button type="button" onClick={() => setPilih(p)}
                className="flex items-center gap-1 text-sm font-semibold text-link">
                <FileText size={14} /> Detail
              </button>
            ),
          },
        ]}
      />

      <Pagination halaman={data.data?.meta.page ?? 1} perHalaman={data.data?.meta.per_page ?? 25}
        total={data.data?.meta.total ?? 0} onUbah={setHalaman} />

      {/* Modal Detail */}
      <Modal terbuka={pilih !== null} lebar="sm" judul="Detail Pengajuan"
        onTutup={() => setPilih(null)}
        footer={
          <Button onClick={() => setPilih(null)}>Tutup</Button>
        }>
        {pilih && (
          <div className="space-y-4">
            <p className="text-sm text-strong"><strong>{pilih.pegawai?.nama ?? '—'}</strong> ({pilih.pegawai?.nip})</p>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs font-semibold text-muted">Jenis</dt><dd className="font-bold text-strong">{pilih.label_jenis}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Status</dt>
                <dd><StatusBadge varian={VARIAN_STATUS[pilih.status] ?? 'izin'}>{pilih.label_status}</StatusBadge></dd>
              </div>
              <div><dt className="text-xs font-semibold text-muted">Jumlah hari</dt><dd className="tnum font-bold text-strong">{pilih.jumlah_hari}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Dibuat</dt><dd className="text-xs text-muted">{pilih.dibuat_pada ? new Date(pilih.dibuat_pada).toLocaleDateString('id-ID') : '—'}</dd></div>
              <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Tanggal</dt>
                <dd className="font-bold text-strong">{formatTanggalDari(pilih.tanggal_mulai)} – {formatTanggalDari(pilih.tanggal_selesai)}</dd>
              </div>
              <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Alasan</dt><dd className="text-strong">{pilih.alasan}</dd></div>

              <div className="col-span-2">
                <dt className="text-xs font-semibold text-muted">Lampiran</dt>
                <dd className="mt-1">
                  <LampiranPengajuan pengajuan={pilih} />
                </dd>
              </div>

              {pilih.presensi_luar_radius && (
                <div className="col-span-2">
                  <p className="rounded-control bg-info-soft px-3 py-2 text-xs text-strong">
                    Dinas dengan presensi luar radius — pengajuan luar radius otomatis disetujui untuk setiap hari kerja.
                  </p>
                </div>
              )}

              {pilih.diputuskan_pada && (
                <>
                  <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Diputuskan oleh</dt>
                    <dd className="text-strong">{pilih.diputuskan_oleh ?? '—'}</dd>
                  </div>
                  <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Diputuskan pada</dt>
                    <dd className="text-sm text-muted">{new Date(pilih.diputuskan_pada).toLocaleString('id-ID')}</dd>
                  </div>
                  {pilih.catatan_penyetuju && (
                    <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Catatan penyetuju</dt>
                      <dd className="text-sm text-strong">{pilih.catatan_penyetuju}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  )
}
