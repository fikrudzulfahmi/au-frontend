import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { master, pesanPerBidang, unduhBerkas } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { LABEL_KELOMPOK, OPSI_KELOMPOK_MAPEL, type Jurusan, type Mapel } from './types'

const KOSONG = { kode: '', nama: '', kelompok: 'umum', jurusan_id: '', is_active: true }

/** FR-MPL-01..03 — mata pelajaran. */
export function MapelPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const qc = useQueryClient()
  const toast = useToast()

  const [cari, setCari] = useState('')
  const [kelompok, setKelompok] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({ terbuka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<Mapel | null>(null)

  const daftar = useQuery({
    queryKey: ['mapel', { cari, kelompok, halaman }],
    queryFn: () => master.daftar<Mapel>('/mapel', { cari, kelompok, page: halaman }),
  })

  const jurusan = useQuery({
    queryKey: ['jurusan', 'semua'],
    queryFn: () => master.daftar<Jurusan>('/jurusan', { per_page: 100 }),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      const body = { ...v.nilai, jurusan_id: v.nilai.jurusan_id === '' ? null : Number(v.nilai.jurusan_id) }
      return v.id ? master.ubah<Mapel>('/mapel', v.id, body) : master.buat<Mapel>('/mapel', body)
    },
    onSuccess: () => {
      toast.sukses('Mata pelajaran disimpan.')
      setForm({ terbuka: false, nilai: KOSONG })
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['mapel'] })
    },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/mapel', id),
    onSuccess: () => { toast.sukses('Mata pelajaran dihapus.'); setDihapus(null); void qc.invalidateQueries({ queryKey: ['mapel'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data
  const opsiJurusan = (jurusan.data?.data ?? []).map((j) => ({ nilai: j.id, label: `${j.kode} — ${j.nama}` }))

  async function unduhEkspor() {
    try {
      await unduhBerkas(`/mapel/ekspor?kelompok=${kelompok}`, 'daftar-mapel.xlsx')
    } catch (e) {
      toast.gagal(pesanError(e))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Mata Pelajaran"
        aksi={
          <>
            {bolehKelola && (
              <Button onClick={unduhEkspor} varian="secondary">
                <Download size={17} /> Ekspor Excel
              </Button>
            )}
            {bolehKelola && (
              <Button onClick={() => { setGalat({}); setForm({ terbuka: true, nilai: KOSONG }) }}>
                <Plus size={17} /> Tambah Mapel
              </Button>
            )}
          </>
        }
      />

      <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari kode atau nama mapel…">
        <select
          aria-label="Filter kelompok"
          value={kelompok}
          onChange={(e) => { setKelompok(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong"
        >
          <option value="">Semua kelompok</option>
          {OPSI_KELOMPOK_MAPEL.map((o) => (
            <option key={o.nilai} value={o.nilai}>{o.label}</option>
          ))}
        </select>
      </Toolbar>

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(m) => m.id}
        kosong="Belum ada mata pelajaran."
        kolom={[
          { kunci: 'kode', judul: 'Kode', render: (m) => <span className="font-bold">{m.kode}</span> },
          { kunci: 'nama', judul: 'Nama Mapel', render: (m) => m.nama },
          { kunci: 'kelompok', judul: 'Kelompok', render: (m) => LABEL_KELOMPOK[m.kelompok] ?? m.kelompok },
          { kunci: 'jurusan', judul: 'Jurusan', render: (m) => m.jurusan ?? '—' },
          {
            kunci: 'status', judul: 'Status',
            render: (m) => <StatusBadge varian={m.is_active ? 'hadir' : 'cuti'}>{m.is_active ? 'Aktif' : 'Nonaktif'}</StatusBadge>,
          },
          ...(bolehKelola
            ? [{
                kunci: 'aksi', judul: 'Aksi', className: 'w-24',
                render: (m: Mapel) => (
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={`Ubah ${m.nama}`}
                      onClick={() => { setGalat({}); setForm({ terbuka: true, id: m.id, nilai: { kode: m.kode, nama: m.nama, kelompok: m.kelompok, jurusan_id: m.jurusan_id === null ? '' : String(m.jurusan_id), is_active: m.is_active } }) }}
                      className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                      <Pencil size={16} />
                    </button>
                    <button type="button" aria-label={`Hapus ${m.nama}`} onClick={() => setDihapus(m)}
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

      <Modal
        terbuka={form.terbuka}
        judul={form.id ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran'}
        onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangTeks label="Kode" id="kode" wajib nilai={form.nilai.kode} pesanError={galat.kode}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, kode: v.toUpperCase() } }))} />
          <BidangTeks label="Nama Mapel" id="nama" wajib nilai={form.nilai.nama} pesanError={galat.nama}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nama: v } }))} />
          <BidangPilihan label="Kelompok" id="kelompok" wajib opsi={OPSI_KELOMPOK_MAPEL}
            nilai={form.nilai.kelompok} pesanError={galat.kelompok} kosongLabel="— Pilih kelompok —"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, kelompok: v } }))} />
          <BidangPilihan label="Jurusan" id="jurusan" opsi={opsiJurusan} nilai={form.nilai.jurusan_id}
            pesanError={galat.jurusan_id} kosongLabel="— Tidak terkait jurusan —"
            petunjuk="Diisi untuk mapel kejuruan."
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, jurusan_id: v } }))} />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-strong">
          <input type="checkbox" checked={form.nilai.is_active}
            onChange={(e) => setForm((f) => ({ ...f, nilai: { ...f.nilai, is_active: e.target.checked } }))} />
          Mapel aktif
        </label>
      </Modal>

      <ConfirmDialog
        terbuka={dihapus !== null}
        judul="Hapus mata pelajaran?"
        keterangan={dihapus ? `Mapel "${dihapus.nama}" akan dihapus. Mapel yang sudah dipakai plotting tidak dapat dihapus.` : ''}
        labelKonfirmasi="Hapus"
        memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)}
        onTutup={() => setDihapus(null)}
      />
    </div>
  )
}
