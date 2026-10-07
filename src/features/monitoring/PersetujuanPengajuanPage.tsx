import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FileText, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { aksi, master } from '@/lib/crud'
import { formatTanggalDari } from '@/lib/format'
import type { PengajuanIzin, PengajuanLuarRadius } from '@/features/presensi/types'

/** FR-IZN-04 — memutuskan pengajuan izin/sakit/dinas/cuti dan pengajuan luar radius mandiri. */
export function PersetujuanPengajuanPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'izin' | 'luar-radius'>('izin')
  const [pilih, setPilih] = useState<PengajuanIzin | PengajuanLuarRadius | null>(null)
  const [catatan, setCatatan] = useState('')

  const izin = useQuery({
    queryKey: ['pengajuan-izin', 'menunggu'],
    queryFn: () => master.daftar<PengajuanIzin>('/pengajuan-izin', { status: 'menunggu', per_page: 50 }),
    enabled: tab === 'izin',
  })

  const luar = useQuery({
    queryKey: ['pengajuan-luar-radius', 'menunggu'],
    queryFn: () => master.daftar<PengajuanLuarRadius>('/pengajuan-luar-radius', { status: 'menunggu', per_page: 50 }),
    enabled: tab === 'luar-radius',
  })

  const segarkan = () => {
    void qc.invalidateQueries({ queryKey: ['pengajuan-izin'] })
    void qc.invalidateQueries({ queryKey: ['pengajuan-luar-radius'] })
  }

  const putuskanIzin = useMutation({
    mutationFn: (v: { id: number; status: 'disetujui' | 'ditolak' }) =>
      aksi(`/pengajuan-izin/${v.id}/putuskan`, { status: v.status, catatan_penyetuju: catatan || null }, 'patch'),
    onSuccess: () => { toast.sukses('Keputusan tersimpan.'); setPilih(null); setCatatan(''); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const putuskanLuar = useMutation({
    mutationFn: (v: { id: number; status: 'disetujui' | 'ditolak' }) =>
      aksi(`/pengajuan-luar-radius/${v.id}/putuskan`, { status: v.status, catatan_penyetuju: catatan || null }, 'patch'),
    onSuccess: () => { toast.sukses('Keputusan tersimpan.'); setPilih(null); setCatatan(''); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Persetujuan Pengajuan"
        keterangan="Pengajuan yang menunggu keputusan Anda. Izin, sakit, dan cuti yang disetujui membebaskan presensi; dinas tidak (BR-25)."
      />

      <div className="flex gap-1 rounded-control bg-surface p-1 shadow-card">
        {([['izin', `Izin / Sakit / Dinas / Cuti`], ['luar-radius', 'Luar Radius Mandiri']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`rounded-[13px] px-4 py-2 text-sm font-bold transition-colors ${tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-app-soft'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'izin' && (
        <DataTable
          data={izin.data?.data ?? []}
          kunciBaris={(p) => p.id}
          kosong="Tidak ada pengajuan yang menunggu keputusan."
          kolom={[
            { kunci: 'nama', judul: 'Pegawai', render: (p) => <span className="font-bold text-strong">{p.pegawai?.nama ?? '—'}</span> },
            { kunci: 'jenis', judul: 'Jenis', render: (p) => <StatusBadge varian="izin">{p.label_jenis}</StatusBadge> },
            {
              kunci: 'tanggal', judul: 'Tanggal',
              render: (p) => (
                <span className="text-sm">
                  {formatTanggalDari(p.tanggal_mulai)}
                  {p.tanggal_selesai !== p.tanggal_mulai && ` – ${formatTanggalDari(p.tanggal_selesai)}`}
                </span>
              ),
            },
            { kunci: 'alasan', judul: 'Alasan', render: (p) => <span className="text-xs text-muted">{p.alasan}</span>, sembunyiMobile: true },
            {
              kunci: 'aksi', judul: 'Aksi', className: 'w-20',
              render: (p) => (
                <button type="button" onClick={() => { setPilih(p); setCatatan('') }}
                  className="flex items-center gap-1 text-sm font-semibold text-link">
                  <FileText size={14} /> Tinjau
                </button>
              ),
            },
          ]}
        />
      )}

      {tab === 'luar-radius' && (
        <DataTable
          data={luar.data?.data ?? []}
          kunciBaris={(p) => p.id}
          kosong="Tidak ada pengajuan luar radius yang menunggu keputusan."
          kolom={[
            { kunci: 'nama', judul: 'Pegawai', render: (p) => <span className="font-bold text-strong">{p.pegawai?.nama ?? '—'}</span> },
            { kunci: 'tanggal', judul: 'Tanggal', render: (p) => formatTanggalDari(p.tanggal) },
            { kunci: 'alasan', judul: 'Alasan', render: (p) => <span className="text-xs text-muted">{p.alasan}</span> },
            {
              kunci: 'aksi', judul: 'Aksi', className: 'w-20',
              render: (p) => (
                <button type="button" onClick={() => { setPilih(p); setCatatan('') }}
                  className="flex items-center gap-1 text-sm font-semibold text-link">
                  <FileText size={14} /> Tinjau
                </button>
              ),
            },
          ]}
        />
      )}

      <Modal terbuka={pilih !== null} lebar="sm" judul="Tinjau Pengajuan" onTutup={() => setPilih(null)}
        footer={
          <>
            <Button varian="secondary" memuat={putuskanIzin.isPending || putuskanLuar.isPending}
              onClick={() => {
                if (pilih === null) return
                if ('jenis' in pilih) putuskanIzin.mutate({ id: pilih.id, status: 'ditolak' })
                else putuskanLuar.mutate({ id: pilih.id, status: 'ditolak' })
              }}>
              <XCircle size={17} /> Tolak
            </Button>
            <Button memuat={putuskanIzin.isPending || putuskanLuar.isPending}
              onClick={() => {
                if (pilih === null) return
                if ('jenis' in pilih) putuskanIzin.mutate({ id: pilih.id, status: 'disetujui' })
                else putuskanLuar.mutate({ id: pilih.id, status: 'disetujui' })
              }}>
              <CheckCircle2 size={17} /> Setujui
            </Button>
          </>
        }>
        {pilih && (
          <div className="space-y-4">
            <p className="text-sm text-strong"><strong>{pilih.pegawai?.nama ?? '—'}</strong></p>

            {'jenis' in pilih ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs font-semibold text-muted">Jenis</dt><dd className="font-bold text-strong">{pilih.label_jenis}</dd></div>
                <div><dt className="text-xs font-semibold text-muted">Jumlah hari</dt><dd className="tnum font-bold text-strong">{pilih.jumlah_hari}</dd></div>
                <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Tanggal</dt>
                  <dd className="font-bold text-strong">{formatTanggalDari(pilih.tanggal_mulai)} – {formatTanggalDari(pilih.tanggal_selesai)}</dd></div>
                <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Alasan</dt><dd className="text-strong">{pilih.alasan}</dd></div>
              </dl>
            ) : (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs font-semibold text-muted">Tanggal</dt><dd className="font-bold text-strong">{formatTanggalDari(pilih.tanggal)}</dd></div>
                <div><dt className="text-xs font-semibold text-muted">Asal</dt><dd className="font-bold text-strong">{pilih.dari_dinas ? 'Dari dinas' : 'Mandiri'}</dd></div>
                <div className="col-span-2"><dt className="text-xs font-semibold text-muted">Alasan</dt><dd className="text-strong">{pilih.alasan}</dd></div>
              </dl>
            )}

            {'presensi_luar_radius' in pilih && pilih.presensi_luar_radius && (
              <p className="rounded-control bg-info-soft px-3 py-2 text-xs text-strong">
                Dinas ini meminta presensi dari luar radius. Bila disetujui, pengajuan luar radius untuk setiap
                hari kerja pada rentang tersebut ikut disetujui otomatis (FR-IZN-02).
              </p>
            )}

            <BidangTeks label="Catatan penyetuju" id="catatan-pengajuan" nilai={catatan}
              petunjuk="Wajib diisi bila menolak (FR-IZN-04)."
              onUbah={setCatatan} />
          </div>
        )}
      </Modal>
    </div>
  )
}
