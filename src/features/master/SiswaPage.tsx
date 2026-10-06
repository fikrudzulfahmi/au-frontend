import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { PeringatanImport } from '@/components/ui/PeringatanImport'
import { StatusBadge, type StatusVarian } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { master, pesanPerBidang, unduhBerkas, unggahBerkas, type LaporanImport } from '@/lib/crud'
import { formatTanggalDari } from '@/lib/format'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { OPSI_JENIS_KELAMIN, OPSI_STATUS_SISWA, type Siswa } from './types'

const KOSONG = {
  nis: '', nisn: '', nama: '', jenis_kelamin: 'L', tempat_lahir: '', tanggal_lahir: '',
  tahun_masuk: '', status: 'aktif', tahun_lulus: '',
}

const VARIAN_STATUS: Record<string, StatusVarian> = {
  aktif: 'hadir', lulus: 'izin', pindah: 'menunggu', keluar: 'cuti',
}

/** FR-SIS-01..06 — data siswa, import, dan export. */
export function SiswaPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const qc = useQueryClient()
  const toast = useToast()

  const [cari, setCari] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({ terbuka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<Siswa | null>(null)
  const [impor, setImpor] = useState<{ buka: boolean; laporan: LaporanImport | null }>({ buka: false, laporan: null })
  const [berkasImport, setBerkasImport] = useState<File | null>(null)

  const daftar = useQuery({
    queryKey: ['siswa', { cari, statusFilter, halaman }],
    queryFn: () => master.daftar<Siswa>('/siswa', { cari, status: statusFilter, page: halaman }),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      const body = {
        ...v.nilai,
        nisn: v.nilai.nisn === '' ? null : v.nilai.nisn,
        tahun_masuk: v.nilai.tahun_masuk === '' ? null : Number(v.nilai.tahun_masuk),
        tahun_lulus: v.nilai.tahun_lulus === '' ? null : Number(v.nilai.tahun_lulus),
        tempat_lahir: v.nilai.tempat_lahir === '' ? null : v.nilai.tempat_lahir,
        tanggal_lahir: v.nilai.tanggal_lahir === '' ? null : v.nilai.tanggal_lahir,
      }
      return v.id ? master.ubah<Siswa>('/siswa', v.id, body) : master.buat<Siswa>('/siswa', body)
    },
    onSuccess: () => { toast.sukses('Data siswa disimpan.'); setForm({ terbuka: false, nilai: KOSONG }); setGalat({}); void qc.invalidateQueries({ queryKey: ['siswa'] }) },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/siswa', id),
    onSuccess: () => { toast.sukses('Siswa dihapus.'); setDihapus(null); void qc.invalidateQueries({ queryKey: ['siswa'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jalankanImport = useMutation({
    mutationFn: () => unggahBerkas<{ message: string; data: LaporanImport }>('/siswa/import', berkasImport as File),
    onSuccess: (hasil) => {
      setImpor((s) => ({ ...s, laporan: hasil.data }))
      toast.sukses(hasil.message)
      void qc.invalidateQueries({ queryKey: ['siswa'] })
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data

  async function unduh(jalur: string, nama: string) {
    try { await unduhBerkas(jalur, nama) } catch (e) { toast.gagal(pesanError(e)) }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Siswa"
        keterangan="Penempatan siswa ke kelas dilakukan pada menu Plotting Kelas, bukan di sini."
        aksi={
          bolehKelola && (
            <>
              <Button varian="secondary" onClick={() => unduh('/siswa/ekspor', 'daftar-siswa.xlsx')}>
                <Download size={17} /> Ekspor
              </Button>
              <Button varian="secondary" onClick={() => setImpor({ buka: true, laporan: null })}>
                <Upload size={17} /> Import
              </Button>
              <Button onClick={() => { setGalat({}); setForm({ terbuka: true, nilai: KOSONG }) }}>
                <Plus size={17} /> Tambah Siswa
              </Button>
            </>
          )
        }
      />

      <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari NIS, NISN, atau nama…">
        <select aria-label="Filter status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua status</option>
          {OPSI_STATUS_SISWA.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
        </select>
      </Toolbar>

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(s) => s.id}
        kosong="Belum ada data siswa pada filter ini."
        kolom={[
          { kunci: 'nis', judul: 'NIS', render: (s) => <span className="tnum font-bold">{s.nis}</span> },
          { kunci: 'nama', judul: 'Nama', render: (s) => s.nama },
          { kunci: 'jk', judul: 'L/P', render: (s) => s.jenis_kelamin, sembunyiMobile: true },
          { kunci: 'lahir', judul: 'Tanggal Lahir', render: (s) => formatTanggalDari(s.tanggal_lahir), sembunyiMobile: true },
          { kunci: 'masuk', judul: 'Tahun Masuk', render: (s) => s.tahun_masuk ?? '—', sembunyiMobile: true },
          { kunci: 'status', judul: 'Status', render: (s) => <StatusBadge varian={VARIAN_STATUS[s.status]}>{s.status}</StatusBadge> },
          ...(bolehKelola
            ? [{
                kunci: 'aksi', judul: 'Aksi', className: 'w-24',
                render: (s: Siswa) => (
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={`Ubah ${s.nama}`}
                      onClick={() => { setGalat({}); setForm({ terbuka: true, id: s.id, nilai: { nis: s.nis, nisn: s.nisn ?? '', nama: s.nama, jenis_kelamin: s.jenis_kelamin, tempat_lahir: s.tempat_lahir ?? '', tanggal_lahir: s.tanggal_lahir ?? '', tahun_masuk: s.tahun_masuk ? String(s.tahun_masuk) : '', status: s.status, tahun_lulus: s.tahun_lulus ? String(s.tahun_lulus) : '' } }) }}
                      className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                      <Pencil size={16} />
                    </button>
                    <button type="button" aria-label={`Hapus ${s.nama}`} onClick={() => setDihapus(s)}
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

      <Modal terbuka={form.terbuka} lebar="lg" judul={form.id ? 'Ubah Siswa' : 'Tambah Siswa'}
        onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangTeks label="NIS" id="s-nis" wajib nilai={form.nilai.nis} pesanError={galat.nis}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nis: v } }))} />
          <BidangTeks label="NISN" id="s-nisn" nilai={form.nilai.nisn} pesanError={galat.nisn}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nisn: v } }))} />
          <BidangTeks label="Nama" id="s-nama" wajib nilai={form.nilai.nama} pesanError={galat.nama}
            className="sm:col-span-2"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nama: v } }))} />
          <BidangPilihan label="Jenis Kelamin" id="s-jk" wajib opsi={OPSI_JENIS_KELAMIN} nilai={form.nilai.jenis_kelamin}
            kosongLabel="— Pilih —" pesanError={galat.jenis_kelamin}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, jenis_kelamin: v } }))} />
          <BidangTeks label="Tempat Lahir" id="s-tempat" nilai={form.nilai.tempat_lahir} pesanError={galat.tempat_lahir}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tempat_lahir: v } }))} />
          <BidangTeks label="Tanggal Lahir" id="s-lahir" tipe="date" nilai={form.nilai.tanggal_lahir}
            pesanError={galat.tanggal_lahir}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tanggal_lahir: v } }))} />
          <BidangTeks label="Tahun Masuk" id="s-masuk" tipe="number" nilai={form.nilai.tahun_masuk}
            pesanError={galat.tahun_masuk} placeholder="2026"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tahun_masuk: v } }))} />
          <BidangPilihan label="Status" id="s-status" wajib opsi={OPSI_STATUS_SISWA} nilai={form.nilai.status}
            kosongLabel="— Pilih —" pesanError={galat.status}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, status: v } }))} />
          {(form.nilai.status === 'lulus' || form.nilai.status === 'keluar') && (
            <BidangTeks label="Tahun Lulus" id="s-lulus" tipe="number" nilai={form.nilai.tahun_lulus}
              pesanError={galat.tahun_lulus}
              onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tahun_lulus: v } }))} />
          )}
        </div>
      </Modal>

      <Modal terbuka={impor.buka} judul="Import Data Siswa"
        keterangan="Unduh templat terlebih dahulu agar nama kolom sesuai. Baris yang gagal dilaporkan tanpa membatalkan baris yang valid."
        onTutup={() => { setImpor({ buka: false, laporan: null }); setBerkasImport(null) }}
        footer={
          <>
            <Button varian="secondary" onClick={() => unduh('/siswa/template', 'template-import-siswa.xlsx')}>
              <FileSpreadsheet size={17} /> Unduh Templat
            </Button>
            <Button memuat={jalankanImport.isPending} disabled={!berkasImport} onClick={() => jalankanImport.mutate()}>
              <Upload size={17} /> Proses Import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-strong">Berkas Excel/CSV</span>
            <input type="file" accept=".xlsx,.xls,.csv"
              onChange={(e) => setBerkasImport(e.target.files?.[0] ?? null)}
              className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-strong" />
            <span className="mt-1 block text-xs text-muted">Format xlsx, xls, atau csv. Maksimal 4 MB.</span>
          </label>
          {impor.laporan && <PeringatanImport laporan={impor.laporan} />}
        </div>
      </Modal>

      <ConfirmDialog terbuka={dihapus !== null} judul="Hapus siswa?"
        keterangan={dihapus ? `${dihapus.nama} akan dihapus. Siswa yang sudah memiliki presensi tidak dapat dihapus — ubah statusnya menjadi lulus, pindah, atau keluar.` : ''}
        labelKonfirmasi="Hapus" memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)} onTutup={() => setDihapus(null)} />
    </div>
  )
}
