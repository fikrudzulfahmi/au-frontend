import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'

import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { get } from '@/lib/api'
import { master } from '@/lib/crud'
import { formatTanggalDari, formatJamLengkap } from '@/lib/format'
import type { AuditLog } from '@/features/master/types'

/** FR-SEC-05 / Bagian 9 — audit log bersifat hanya-baca; tidak dapat diubah dari UI. */
export function AuditLogPage() {
  const [aksi, setAksi] = useState('')
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [halaman, setHalaman] = useState(1)

  const daftar = useQuery({
    queryKey: ['audit-log', { aksi, dari, sampai, halaman }],
    queryFn: () => master.daftar<AuditLog>('/pengaturan/audit-log', { aksi, dari, sampai, page: halaman }),
  })

  const daftarAksi = useQuery({
    queryKey: ['audit-log', 'aksi'],
    queryFn: () => get<{ data: string[] }>('/pengaturan/audit-log/aksi'),
  })

  const data = daftar.data

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Audit Log"
        keterangan="Catatan tindakan penting: login gagal, koreksi, persetujuan, perubahan data dan pengaturan."
      />

      <Toolbar>
        <select aria-label="Filter aksi" value={aksi}
          onChange={(e) => { setAksi(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua aksi</option>
          {(daftarAksi.data?.data ?? []).map((a) => (<option key={a} value={a}>{a}</option>))}
        </select>
        <input type="date" aria-label="Dari tanggal" value={dari}
          onChange={(e) => { setDari(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong" />
        <input type="date" aria-label="Sampai tanggal" value={sampai}
          onChange={(e) => { setSampai(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong" />
      </Toolbar>

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(a) => a.id}
        kosong="Belum ada catatan pada filter ini."
        kolom={[
          {
            kunci: 'waktu', judul: 'Waktu',
            render: (a) =>
              a.waktu ? (
                <span className="tnum whitespace-nowrap text-xs">
                  {formatTanggalDari(a.waktu)} {formatJamLengkap(new Date(a.waktu))}
                </span>
              ) : '—',
          },
          { kunci: 'aksi', judul: 'Aksi', render: (a) => <StatusBadge varian="izin">{a.aksi}</StatusBadge> },
          { kunci: 'user', judul: 'Pengguna', render: (a) => a.user ?? <span className="text-muted">Sistem</span> },
          {
            kunci: 'objek', judul: 'Objek',
            render: (a) => (a.objek_tipe ? `${a.objek_tipe}${a.objek_id ? ` #${a.objek_id}` : ''}` : '—'),
            sembunyiMobile: true,
          },
          { kunci: 'ip', judul: 'IP', render: (a) => <span className="tnum text-xs">{a.ip ?? '—'}</span>, sembunyiMobile: true },
        ]}
      />

      <Pagination halaman={data?.meta.page ?? 1} perHalaman={data?.meta.per_page ?? 20} total={data?.meta.total ?? 0} onUbah={setHalaman} />

      <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted">
        <ShieldCheck size={12} /> Catatan ini tidak dapat diubah atau dihapus dari antarmuka.
      </p>
    </div>
  )
}
