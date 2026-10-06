import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'

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
import { aksi, master, pesanPerBidang } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import {
  OPSI_TINGKAT,
  type Jurusan,
  type Kelas,
  type Pegawai,
  type TahunPelajaran,
} from './types'

const KOSONG = { tahun_pelajaran_id: '', nama: '', tingkat: '', jurusan_id: '', wali_kelas_id: '', is_active: true }

/** FR-KLS-02..05 — kelas per tahun pelajaran. Wali kelas unik per tahun (BR-02). */
export function KelasPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const qc = useQueryClient()
  const toast = useToast()

  const [cari, setCari] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({ terbuka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<Kelas | null>(null)
  const [salin, setSalin] = useState<{ buka: boolean; asal: string; tujuan: string }>({ buka: false, asal: '', tujuan: '' })

  const tahun = useQuery({
    queryKey: ['tahun-pelajaran', 'pilihan'],
    queryFn: () => master.daftar<TahunPelajaran>('/tahun-pelajaran', { per_page: 100 }),
  })

  const jurusan = useQuery({
    queryKey: ['jurusan', { per_page: 100 }],
    queryFn: () => master.daftar<Jurusan>('/jurusan', { per_page: 100 }),
  })

  const guru = useQuery({
    queryKey: ['pegawai', 'guru'],
    queryFn: () => master.daftar<Pegawai>('/pegawai', { jenis_pegawai: 'guru', is_active: true, per_page: 100 }),
  })

  const daftar = useQuery({
    queryKey: ['kelas', { cari, tahunFilter, tingkatFilter, halaman }],
    queryFn: () => master.daftar<Kelas>('/kelas', { cari, tahun_pelajaran_id: tahunFilter, tingkat: tingkatFilter, page: halaman }),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      const body = {
        ...v.nilai,
        tahun_pelajaran_id: Number(v.nilai.tahun_pelajaran_id),
        jurusan_id: Number(v.nilai.jurusan_id),
        wali_kelas_id: v.nilai.wali_kelas_id === '' ? null : Number(v.nilai.wali_kelas_id),
      }
      return v.id ? master.ubah<Kelas>('/kelas', v.id, body) : master.buat<Kelas>('/kelas', body)
    },
    onSuccess: () => { toast.sukses('Kelas disimpan.'); setForm({ terbuka: false, nilai: KOSONG }); setGalat({}); void qc.invalidateQueries({ queryKey: ['kelas'] }) },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/kelas', id),
    onSuccess: () => { toast.sukses('Kelas dihapus.'); setDihapus(null); void qc.invalidateQueries({ queryKey: ['kelas'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const salinKelas = useMutation({
    mutationFn: (v: { asal: string; tujuan: string }) =>
      aksi<{ message: string; data: { dibuat: number; dilewati: Array<{ nama: string; alasan: string }> } }>('/kelas/salin', {
        tahun_pelajaran_asal_id: Number(v.asal),
        tahun_pelajaran_id: Number(v.tujuan),
      }),
    onSuccess: (hasil) => {
      toast.sukses(hasil.message)
      hasil.data.dilewati.forEach((d) => toast.tampilkan(`${d.nama}: ${d.alasan}`, 'info'))
      setSalin({ buka: false, asal: '', tujuan: '' })
      void qc.invalidateQueries({ queryKey: ['kelas'] })
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data
  const opsiTahun = (tahun.data?.data ?? []).map((t) => ({ nilai: t.id, label: `${t.nama} (${t.status})` }))
  const opsiJurusan = (jurusan.data?.data ?? []).map((j) => ({ nilai: j.id, label: `${j.kode} — ${j.nama}` }))
  const opsiGuru = (guru.data?.data ?? []).map((g) => ({ nilai: g.id, label: `${g.nama} (${g.jabatan ?? 'Guru'})` }))

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Kelas"
        keterangan="Kelas dibuat per tahun pelajaran. Satu guru hanya boleh menjadi wali satu kelas per tahun (BR-02)."
        aksi={
          bolehKelola && (
            <>
              <Button varian="secondary" onClick={() => setSalin({ buka: true, asal: '', tujuan: tahunFilter })}>
                <Copy size={17} /> Salin dari Tahun Lain
              </Button>
              <Button onClick={() => { setGalat({}); setForm({ terbuka: true, nilai: { ...KOSONG, tahun_pelajaran_id: tahunFilter } }) }}>
                <Plus size={17} /> Tambah Kelas
              </Button>
            </>
          )
        }
      />

      <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari nama kelas…">
        <select aria-label="Filter tahun pelajaran" value={tahunFilter}
          onChange={(e) => { setTahunFilter(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua tahun</option>
          {opsiTahun.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
        </select>
        <select aria-label="Filter tingkat" value={tingkatFilter}
          onChange={(e) => { setTingkatFilter(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua tingkat</option>
          {OPSI_TINGKAT.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
        </select>
      </Toolbar>

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(k) => k.id}
        kosong="Belum ada kelas pada filter ini."
        kolom={[
          { kunci: 'nama', judul: 'Kelas', render: (k) => <span className="font-bold">{k.nama}</span> },
          { kunci: 'tahun', judul: 'Tahun Pelajaran', render: (k) => k.tahun_pelajaran ?? '—' },
          { kunci: 'jurusan', judul: 'Jurusan', render: (k) => k.jurusan?.kode ?? '—' },
          { kunci: 'wali', judul: 'Wali Kelas', render: (k) => k.wali_kelas ?? <span className="text-muted">Belum ditetapkan</span> },
          {
            kunci: 'status', judul: 'Status',
            render: (k) => <StatusBadge varian={k.is_active ? 'hadir' : 'cuti'}>{k.is_active ? 'Aktif' : 'Nonaktif'}</StatusBadge>,
          },
          ...(bolehKelola
            ? [{
                kunci: 'aksi', judul: 'Aksi', className: 'w-24',
                render: (k: Kelas) => (
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={`Ubah ${k.nama}`}
                      onClick={() => { setGalat({}); setForm({ terbuka: true, id: k.id, nilai: { tahun_pelajaran_id: String(k.tahun_pelajaran_id), nama: k.nama, tingkat: k.tingkat, jurusan_id: String(k.jurusan_id), wali_kelas_id: k.wali_kelas_id ? String(k.wali_kelas_id) : '', is_active: k.is_active } }) }}
                      className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                      <Pencil size={16} />
                    </button>
                    <button type="button" aria-label={`Hapus ${k.nama}`} onClick={() => setDihapus(k)}
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

      <Modal terbuka={form.terbuka} judul={form.id ? 'Ubah Kelas' : 'Tambah Kelas'} onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangPilihan label="Tahun Pelajaran" id="k-tp" wajib opsi={opsiTahun} nilai={form.nilai.tahun_pelajaran_id}
            pesanError={galat.tahun_pelajaran_id} kosongLabel="— Pilih —"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tahun_pelajaran_id: v } }))} />
          <BidangTeks label="Nama Kelas" id="k-nama" wajib nilai={form.nilai.nama} pesanError={galat.nama}
            placeholder="X TKJ 1"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nama: v } }))} />
          <BidangPilihan label="Tingkat" id="k-tingkat" wajib opsi={OPSI_TINGKAT} nilai={form.nilai.tingkat}
            pesanError={galat.tingkat} kosongLabel="— Pilih —"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tingkat: v } }))} />
          <BidangPilihan label="Jurusan" id="k-jurusan" wajib opsi={opsiJurusan} nilai={form.nilai.jurusan_id}
            pesanError={galat.jurusan_id} kosongLabel="— Pilih —"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, jurusan_id: v } }))} />
          <BidangPilihan label="Wali Kelas" id="k-wali" opsi={opsiGuru} nilai={form.nilai.wali_kelas_id}
            pesanError={galat.wali_kelas_id} kosongLabel="— Belum ditetapkan —" className="sm:col-span-2"
            petunjuk="Hanya pegawai berjenis guru yang dapat dipilih."
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, wali_kelas_id: v } }))} />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-strong">
          <input type="checkbox" checked={form.nilai.is_active}
            onChange={(e) => setForm((f) => ({ ...f, nilai: { ...f.nilai, is_active: e.target.checked } }))} />
          Kelas aktif
        </label>
      </Modal>

      <Modal terbuka={salin.buka} judul="Salin Kelas dari Tahun Pelajaran Lain"
        keterangan="Tingkat dinaikkan otomatis (X→XI, XI→XII). Kelas XII tidak disalin karena diluluskan lewat Plotting Kelas."
        onTutup={() => setSalin({ buka: false, asal: '', tujuan: '' })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setSalin({ buka: false, asal: '', tujuan: '' })}>Batal</Button>
            <Button memuat={salinKelas.isPending} onClick={() => salinKelas.mutate(salin)}>Salin Kelas</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangPilihan label="Dari Tahun Pelajaran" id="s-asal" wajib opsi={opsiTahun} nilai={salin.asal}
            kosongLabel="— Pilih —" onUbah={(v) => setSalin((s) => ({ ...s, asal: v }))} />
          <BidangPilihan label="Ke Tahun Pelajaran" id="s-tujuan" wajib opsi={opsiTahun} nilai={salin.tujuan}
            kosongLabel="— Pilih —" onUbah={(v) => setSalin((s) => ({ ...s, tujuan: v }))} />
        </div>
      </Modal>

      <ConfirmDialog terbuka={dihapus !== null} judul="Hapus kelas?"
        keterangan={dihapus ? `Kelas "${dihapus.nama}" akan dihapus. Kelas yang sudah memiliki jurnal atau jadwal tidak dapat dihapus.` : ''}
        labelKonfirmasi="Hapus" memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)} onTutup={() => setDihapus(null)} />
    </div>
  )
}
