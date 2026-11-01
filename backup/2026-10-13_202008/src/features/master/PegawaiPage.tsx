import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download, FileSpreadsheet, KeyRound, Pencil, Plus, Smartphone, Trash2, Upload, UserPlus,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { PeringatanImport } from '@/components/ui/PeringatanImport'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { aksi, master, pesanPerBidang, unduhBerkas, unggahBerkas, type LaporanImport } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import {
  OPSI_JENIS_KELAMIN, OPSI_JENIS_PEGAWAI, OPSI_STATUS_KEPEGAWAIAN, type Pegawai,
} from './types'

const KOSONG = {
  nip: '', nama: '', jenis_kelamin: 'L', jenis_pegawai: 'guru', jabatan: '',
  status_kepegawaian: 'PNS', email: '', no_hp: '', tanggal_lahir: '', is_active: true, buat_akun: true,
}

/** FR-PEG-01..06 — guru & pegawai struktural, akun, reset password, reset perangkat. */
export function PegawaiPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const qc = useQueryClient()
  const toast = useToast()

  const [cari, setCari] = useState('')
  const [jenisFilter, setJenisFilter] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({ terbuka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<Pegawai | null>(null)
  const [impor, setImpor] = useState<{ buka: boolean; laporan: LaporanImport | null }>({ buka: false, laporan: null })
  const [berkasImport, setBerkasImport] = useState<File | null>(null)
  const [hasilAksi, setHasilAksi] = useState<{ judul: string; nilai: string; petunjuk: string } | null>(null)

  const daftar = useQuery({
    queryKey: ['pegawai', { cari, jenisFilter, halaman }],
    queryFn: () => master.daftar<Pegawai>('/pegawai', { cari, jenis_pegawai: jenisFilter, page: halaman }),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      const body = {
        ...v.nilai,
        jabatan: v.nilai.jabatan === '' ? null : v.nilai.jabatan,
        email: v.nilai.email === '' ? null : v.nilai.email,
        no_hp: v.nilai.no_hp === '' ? null : v.nilai.no_hp,
        tanggal_lahir: v.nilai.tanggal_lahir === '' ? null : v.nilai.tanggal_lahir,
      }
      return v.id ? master.ubah<Pegawai>('/pegawai', v.id, body) : master.buat<Pegawai>('/pegawai', body)
    },
    onSuccess: (hasil: { message?: string; password_awal?: string | null }) => {
      toast.sukses(hasil.message ?? 'Data pegawai disimpan.')
      if (hasil.password_awal) {
        setHasilAksi({
          judul: 'Password awal akun baru',
          nilai: hasil.password_awal,
          petunjuk: 'Catat sekarang — hanya ditampilkan sekali dan wajib diganti saat login pertama (FR-SEC-04).',
        })
      }
      setForm({ terbuka: false, nilai: KOSONG })
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['pegawai'] })
    },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/pegawai', id),
    onSuccess: () => { toast.sukses('Pegawai dinonaktifkan.'); setDihapus(null); void qc.invalidateQueries({ queryKey: ['pegawai'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const resetPassword = useMutation({
    mutationFn: (id: number) => aksi<{ data: { username: string; password_baru: string } }>(`/pegawai/${id}/reset-password`),
    onSuccess: (hasil) => {
      toast.sukses('Password direset.')
      setHasilAksi({ judul: `Password baru untuk ${hasil.data.username}`, nilai: hasil.data.password_baru, petunjuk: 'Sampaikan kepada yang bersangkutan; wajib diganti saat login.' })
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const resetPerangkat = useMutation({
    mutationFn: (id: number) => aksi(`/pegawai/${id}/reset-perangkat`),
    onSuccess: () => { toast.sukses('Perangkat terdaftar dikosongkan.'); void qc.invalidateQueries({ queryKey: ['pegawai'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const buatAkun = useMutation({
    mutationFn: (id: number) => aksi<{ data: { username: string; password_awal: string | null } }>(`/pegawai/${id}/akun`),
    onSuccess: (hasil) => {
      toast.sukses('Akun dibuat.')
      if (hasil.data.password_awal) {
        setHasilAksi({ judul: `Password awal untuk ${hasil.data.username}`, nilai: hasil.data.password_awal, petunjuk: 'Hanya ditampilkan sekali; wajib diganti saat login pertama.' })
      }
      void qc.invalidateQueries({ queryKey: ['pegawai'] })
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jalankanImport = useMutation({
    mutationFn: () => unggahBerkas<{ message: string; data: LaporanImport }>('/pegawai/import', berkasImport as File, { buat_akun: 1 }),
    onSuccess: (hasil) => { setImpor((s) => ({ ...s, laporan: hasil.data })); toast.sukses(hasil.message); void qc.invalidateQueries({ queryKey: ['pegawai'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data

  async function unduh(jalur: string, nama: string) {
    try { await unduhBerkas(jalur, nama) } catch (e) { toast.gagal(pesanError(e)) }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Guru & Pegawai"
        keterangan="Guru dan pegawai struktural berada pada satu daftar. Akun dibuat otomatis sesuai jenis pegawai."
        aksi={
          bolehKelola && (
            <>
              <Button varian="secondary" onClick={() => unduh('/pegawai/ekspor', 'daftar-pegawai.xlsx')}>
                <Download size={17} /> Ekspor
              </Button>
              <Button varian="secondary" onClick={() => setImpor({ buka: true, laporan: null })}>
                <Upload size={17} /> Import
              </Button>
              <Button onClick={() => { setGalat({}); setForm({ terbuka: true, nilai: KOSONG }) }}>
                <Plus size={17} /> Tambah Pegawai
              </Button>
            </>
          )
        }
      />

      <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari NIP, nama, atau jabatan…">
        <select aria-label="Filter jenis pegawai" value={jenisFilter}
          onChange={(e) => { setJenisFilter(e.target.value); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua jenis</option>
          {OPSI_JENIS_PEGAWAI.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
        </select>
      </Toolbar>

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(p) => p.id}
        kosong="Belum ada data pegawai pada filter ini."
        kolom={[
          { kunci: 'nip', judul: 'NIP / ID', render: (p) => <span className="tnum font-bold">{p.nip}</span> },
          { kunci: 'nama', judul: 'Nama', render: (p) => p.nama },
          { kunci: 'jabatan', judul: 'Jabatan', render: (p) => p.label_jabatan },
          { kunci: 'jenis', judul: 'Jenis', render: (p) => (p.jenis_pegawai === 'guru' ? 'Guru' : 'Struktural'), sembunyiMobile: true },
          {
            kunci: 'akun', judul: 'Akun',
            render: (p) =>
              p.akun ? (
                <div className="flex flex-wrap gap-1">
                  <StatusBadge varian="izin">{p.akun.username}</StatusBadge>
                  {p.akun.wajib_ganti_password && <StatusBadge varian="menunggu">Ganti password</StatusBadge>}
                </div>
              ) : (
                <span className="text-xs text-muted">Belum ada akun</span>
              ),
          },
          ...(bolehKelola
            ? [{
                kunci: 'aksi', judul: 'Aksi', className: 'w-40',
                render: (p: Pegawai) => (
                  <div className="flex items-center gap-1">
                    {!p.akun && (
                      <button type="button" title="Buat akun" aria-label={`Buat akun ${p.nama}`}
                        onClick={() => buatAkun.mutate(p.id)}
                        className="touch-target flex items-center justify-center rounded-control text-link hover:bg-info-soft">
                        <UserPlus size={16} />
                      </button>
                    )}
                    {p.akun && (
                      <>
                        <button type="button" title="Reset password" aria-label={`Reset password ${p.nama}`}
                          onClick={() => resetPassword.mutate(p.id)}
                          className="touch-target flex items-center justify-center rounded-control text-warn-text hover:bg-warn-bg">
                          <KeyRound size={16} />
                        </button>
                        <button type="button" title="Reset perangkat" aria-label={`Reset perangkat ${p.nama}`}
                          onClick={() => resetPerangkat.mutate(p.id)}
                          className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                          <Smartphone size={16} />
                        </button>
                      </>
                    )}
                    <button type="button" aria-label={`Ubah ${p.nama}`}
                      onClick={() => { setGalat({}); setForm({ terbuka: true, id: p.id, nilai: { nip: p.nip, nama: p.nama, jenis_kelamin: p.jenis_kelamin, jenis_pegawai: p.jenis_pegawai, jabatan: p.jabatan ?? '', status_kepegawaian: p.status_kepegawaian, email: p.email ?? '', no_hp: p.no_hp ?? '', tanggal_lahir: p.tanggal_lahir ?? '', is_active: p.is_active, buat_akun: false } }) }}
                      className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                      <Pencil size={16} />
                    </button>
                    <button type="button" aria-label={`Hapus ${p.nama}`} onClick={() => setDihapus(p)}
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

      <Modal terbuka={form.terbuka} lebar="lg" judul={form.id ? 'Ubah Pegawai' : 'Tambah Pegawai'}
        onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangTeks label="NIP / NUPTK / ID Internal" id="p-nip" wajib nilai={form.nilai.nip} pesanError={galat.nip}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nip: v } }))} />
          <BidangTeks label="Nama" id="p-nama" wajib nilai={form.nilai.nama} pesanError={galat.nama}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nama: v } }))} />
          <BidangPilihan label="Jenis Kelamin" id="p-jk" wajib opsi={OPSI_JENIS_KELAMIN} nilai={form.nilai.jenis_kelamin}
            kosongLabel="— Pilih —" pesanError={galat.jenis_kelamin}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, jenis_kelamin: v } }))} />
          <BidangPilihan label="Jenis Pegawai" id="p-jenis" wajib opsi={OPSI_JENIS_PEGAWAI} nilai={form.nilai.jenis_pegawai}
            kosongLabel="— Pilih —" pesanError={galat.jenis_pegawai}
            petunjuk="Menentukan peran akun: guru atau pegawai struktural."
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, jenis_pegawai: v } }))} />
          <BidangTeks label="Jabatan" id="p-jabatan" nilai={form.nilai.jabatan} pesanError={galat.jabatan}
            placeholder="Guru TKJ / Kepala TU"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, jabatan: v } }))} />
          <BidangPilihan label="Status Kepegawaian" id="p-status" wajib opsi={OPSI_STATUS_KEPEGAWAIAN}
            nilai={form.nilai.status_kepegawaian} kosongLabel="— Pilih —" pesanError={galat.status_kepegawaian}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, status_kepegawaian: v } }))} />
          <BidangTeks label="Email" id="p-email" tipe="email" nilai={form.nilai.email} pesanError={galat.email}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, email: v } }))} />
          <BidangTeks label="No. HP" id="p-hp" tipe="tel" nilai={form.nilai.no_hp} pesanError={galat.no_hp}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, no_hp: v } }))} />
          <BidangTeks label="Tanggal Lahir" id="p-lahir" tipe="date" nilai={form.nilai.tanggal_lahir}
            pesanError={galat.tanggal_lahir}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tanggal_lahir: v } }))} />
        </div>
        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-strong">
            <input type="checkbox" checked={form.nilai.is_active}
              onChange={(e) => setForm((f) => ({ ...f, nilai: { ...f.nilai, is_active: e.target.checked } }))} />
            Pegawai aktif
          </label>
          {!form.id && (
            <label className="flex items-center gap-2 text-sm font-semibold text-strong">
              <input type="checkbox" checked={form.nilai.buat_akun}
                onChange={(e) => setForm((f) => ({ ...f, nilai: { ...f.nilai, buat_akun: e.target.checked } }))} />
              Sekaligus buatkan akun login (password awal acak, wajib diganti)
            </label>
          )}
        </div>
      </Modal>

      <Modal terbuka={impor.buka} judul="Import Data Pegawai"
        keterangan="Setiap pegawai yang berhasil diimport sekaligus dibuatkan akun dengan peran sesuai jenis pegawai."
        onTutup={() => { setImpor({ buka: false, laporan: null }); setBerkasImport(null) }}
        footer={
          <>
            <Button varian="secondary" onClick={() => unduh('/pegawai/template', 'template-import-pegawai.xlsx')}>
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
          </label>
          {impor.laporan && <PeringatanImport laporan={impor.laporan} />}
        </div>
      </Modal>

      <Modal terbuka={hasilAksi !== null} lebar="sm" judul={hasilAksi?.judul ?? ''}
        onTutup={() => setHasilAksi(null)}
        footer={<Button onClick={() => setHasilAksi(null)}>Sudah dicatat</Button>}
      >
        <p className="tnum rounded-control bg-app-soft px-4 py-3 text-center text-lg font-extrabold tracking-wider text-strong">
          {hasilAksi?.nilai}
        </p>
        <p className="mt-2 text-xs text-muted">{hasilAksi?.petunjuk}</p>
      </Modal>

      <ConfirmDialog terbuka={dihapus !== null} judul="Hapus pegawai?"
        keterangan={dihapus ? `${dihapus.nama} akan dinonaktifkan dan dihapus dari daftar aktif. Akunnya tidak dapat login lagi.` : ''}
        labelKonfirmasi="Hapus" memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)} onTutup={() => setDihapus(null)} />
    </div>
  )
}
