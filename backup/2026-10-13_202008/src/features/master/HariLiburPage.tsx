import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { master, pesanPerBidang } from '@/lib/crud'
import { formatTanggalDari } from '@/lib/format'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import type { HariLibur, TahunPelajaran } from './types'

const KOSONG = { tahun_pelajaran_id: '', tanggal_mulai: '', tanggal_selesai: '', keterangan: '' }

/** FR-TP-07 — hari libur per tahun pelajaran; dipakai menghitung hari kerja dan alpa (BR-24). */
export function HariLiburPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const qc = useQueryClient()
  const toast = useToast()

  const [tahunFilter, setTahunFilter] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({ terbuka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<HariLibur | null>(null)

  const tahun = useQuery({
    queryKey: ['tahun-pelajaran', 'pilihan'],
    queryFn: () => master.daftar<TahunPelajaran>('/tahun-pelajaran', { per_page: 100 }),
  })

  const daftar = useQuery({
    queryKey: ['hari-libur', { tahunFilter, halaman }],
    queryFn: () => master.daftar<HariLibur>('/hari-libur', { tahun_pelajaran_id: tahunFilter, page: halaman }),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      const body = { ...v.nilai, tahun_pelajaran_id: Number(v.nilai.tahun_pelajaran_id) }
      return v.id ? master.ubah<HariLibur>('/hari-libur', v.id, body) : master.buat<HariLibur>('/hari-libur', body)
    },
    onSuccess: () => { toast.sukses('Hari libur disimpan.'); setForm({ terbuka: false, nilai: KOSONG }); setGalat({}); void qc.invalidateQueries({ queryKey: ['hari-libur'] }) },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/hari-libur', id),
    onSuccess: () => { toast.sukses('Hari libur dihapus.'); setDihapus(null); void qc.invalidateQueries({ queryKey: ['hari-libur'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data
  const opsiTahun = (tahun.data?.data ?? []).map((t) => ({ nilai: t.id, label: `${t.nama} (${t.status})` }))
  const namaTahun = (id: number) => tahun.data?.data.find((t) => t.id === id)?.nama ?? `#${id}`

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Hari Libur"
        keterangan="Dipakai untuk menghitung hari kerja dan alpa pada laporan (BR-24)."
        aksi={
          bolehKelola && (
            <Button onClick={() => { setGalat({}); setForm({ terbuka: true, nilai: { ...KOSONG, tahun_pelajaran_id: tahunFilter || String(tahun.data?.data[0]?.id ?? '') } }) }}>
              <Plus size={17} /> Tambah Hari Libur
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Filter tahun pelajaran" value={tahunFilter}
          onChange={(e) => { setTahunFilter(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua tahun pelajaran</option>
          {opsiTahun.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
        </select>
      </div>

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(h) => h.id}
        kosong="Belum ada hari libur."
        kolom={[
          { kunci: 'tahun', judul: 'Tahun Pelajaran', render: (h) => namaTahun(h.tahun_pelajaran_id) },
          { kunci: 'mulai', judul: 'Tanggal', render: (h) => formatTanggalDari(h.tanggal_mulai) },
          { kunci: 'selesai', judul: 'Sampai', render: (h) => (h.tanggal_mulai === h.tanggal_selesai ? '—' : formatTanggalDari(h.tanggal_selesai)) },
          { kunci: 'keterangan', judul: 'Keterangan', render: (h) => h.keterangan },
          ...(bolehKelola
            ? [{
                kunci: 'aksi', judul: 'Aksi', className: 'w-24',
                render: (h: HariLibur) => (
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={`Ubah ${h.keterangan}`}
                      onClick={() => { setGalat({}); setForm({ terbuka: true, id: h.id, nilai: { tahun_pelajaran_id: String(h.tahun_pelajaran_id), tanggal_mulai: h.tanggal_mulai, tanggal_selesai: h.tanggal_selesai, keterangan: h.keterangan } }) }}
                      className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                      <Pencil size={16} />
                    </button>
                    <button type="button" aria-label={`Hapus ${h.keterangan}`} onClick={() => setDihapus(h)}
                      className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ),
              }]
            : []),
        ]}
      />

      <Pagination halaman={data?.meta.page ?? 1} perHalaman={data?.meta.per_page ?? 20} total={data?.meta.total ?? 0} onUbah={setHalaman} />

      <Modal terbuka={form.terbuka} judul={form.id ? 'Ubah Hari Libur' : 'Tambah Hari Libur'}
        keterangan="Biarkan tanggal selesai sama bila liburnya satu hari."
        onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangPilihan label="Tahun Pelajaran" id="tp" wajib opsi={opsiTahun} nilai={form.nilai.tahun_pelajaran_id}
            pesanError={galat.tahun_pelajaran_id} kosongLabel="— Pilih tahun pelajaran —"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tahun_pelajaran_id: v } }))} className="sm:col-span-2" />
          <BidangTeks label="Tanggal Mulai" id="hl-mulai" tipe="date" wajib nilai={form.nilai.tanggal_mulai}
            pesanError={galat.tanggal_mulai}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tanggal_mulai: v, tanggal_selesai: f.nilai.tanggal_selesai || v } }))} />
          <BidangTeks label="Tanggal Selesai" id="hl-selesai" tipe="date" wajib nilai={form.nilai.tanggal_selesai}
            pesanError={galat.tanggal_selesai}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tanggal_selesai: v } }))} />
          <BidangTeks label="Keterangan" id="keterangan" wajib nilai={form.nilai.keterangan} pesanError={galat.keterangan}
            placeholder="Hari Kemerdekaan" className="sm:col-span-2"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, keterangan: v } }))} />
        </div>
      </Modal>

      <ConfirmDialog terbuka={dihapus !== null} judul="Hapus hari libur?"
        keterangan={dihapus ? `"${dihapus.keterangan}" akan dihapus.` : ''} labelKonfirmasi="Hapus"
        memuat={hapus.isPending} onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)} onTutup={() => setDihapus(null)} />
    </div>
  )
}
