import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { aksi, master, pesanPerBidang } from '@/lib/crud'
import { formatTanggalDari } from '@/lib/format'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import type { Semester, TahunPelajaran } from './types'

const KOSONG = { nama: '', tanggal_mulai: '', tanggal_selesai: '' }

const VARIAN_STATUS: Record<TahunPelajaran['status'], 'hadir' | 'menunggu' | 'cuti'> = {
  aktif: 'hadir',
  draft: 'menunggu',
  selesai: 'cuti',
}

/** FR-TP-01..06 — tahun pelajaran, semester, aktifkan, tandai selesai, salin. */
export function TahunPelajaranPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const qc = useQueryClient()
  const toast = useToast()

  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({ terbuka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [semester, setSemester] = useState<{ tahun: TahunPelajaran; data: Semester } | null>(null)
  const [aktifkan, setAktifkan] = useState<TahunPelajaran | null>(null)
  const [jenisSemester, setJenisSemester] = useState('ganjil')
  const [dihapus, setDihapus] = useState<TahunPelajaran | null>(null)
  const [selesai, setSelesai] = useState<TahunPelajaran | null>(null)

  const daftar = useQuery({
    queryKey: ['tahun-pelajaran', { halaman }],
    queryFn: () => master.daftar<TahunPelajaran>('/tahun-pelajaran', { page: halaman }),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) =>
      v.id ? master.ubah<TahunPelajaran>('/tahun-pelajaran', v.id, v.nilai) : master.buat<TahunPelajaran>('/tahun-pelajaran', v.nilai),
    onSuccess: () => {
      toast.sukses('Tahun pelajaran disimpan beserta dua semesternya.')
      setForm({ terbuka: false, nilai: KOSONG })
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['tahun-pelajaran'] })
    },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const simpanSemester = useMutation({
    mutationFn: (v: { id: number; nilai: { tanggal_mulai: string; tanggal_selesai: string } }) =>
      master.ubah<Semester>(`/semester`, v.id, v.nilai),
    onSuccess: () => { toast.sukses('Tanggal semester disimpan.'); setSemester(null); void qc.invalidateQueries({ queryKey: ['tahun-pelajaran'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jadikanAktif = useMutation({
    mutationFn: (v: { id: number; jenis: string }) => aksi(`/tahun-pelajaran/${v.id}/aktifkan`, { jenis_semester: v.jenis }),
    onSuccess: () => { toast.sukses('Tahun pelajaran dan semester diaktifkan.'); setAktifkan(null); void qc.invalidateQueries({ queryKey: ['tahun-pelajaran'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const tandaiSelesai = useMutation({
    mutationFn: (id: number) => aksi(`/tahun-pelajaran/${id}/selesai`),
    onSuccess: () => { toast.sukses('Tahun pelajaran ditandai selesai.'); setSelesai(null); void qc.invalidateQueries({ queryKey: ['tahun-pelajaran'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/tahun-pelajaran', id),
    onSuccess: () => { toast.sukses('Tahun pelajaran dihapus.'); setDihapus(null); void qc.invalidateQueries({ queryKey: ['tahun-pelajaran'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Tahun Pelajaran"
        keterangan="Hanya satu tahun pelajaran dan satu semester yang aktif (BR-01)."
        aksi={
          bolehKelola && (
            <Button onClick={() => { setGalat({}); setForm({ terbuka: true, nilai: KOSONG }) }}>
              <Plus size={17} /> Tambah Tahun Pelajaran
            </Button>
          )
        }
      />

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(t) => t.id}
        kosong="Belum ada tahun pelajaran."
        kolom={[
          { kunci: 'nama', judul: 'Tahun Pelajaran', render: (t) => <span className="font-bold">{t.nama}</span> },
          { kunci: 'periode', judul: 'Periode', render: (t) => `${formatTanggalDari(t.tanggal_mulai)} — ${formatTanggalDari(t.tanggal_selesai)}` },
          { kunci: 'status', judul: 'Status', render: (t) => <StatusBadge varian={VARIAN_STATUS[t.status]}>{t.status.toUpperCase()}</StatusBadge> },
          {
            kunci: 'semester', judul: 'Semester',
            render: (t) => (
              <div className="flex flex-wrap gap-1">
                {(t.semester ?? []).map((s) => (
                  <button key={s.id} type="button" disabled={!bolehKelola}
                    onClick={() => setSemester({ tahun: t, data: s })}
                    title={bolehKelola ? 'Ubah tanggal semester' : undefined}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.is_active ? 'bg-success-soft text-success' : 'bg-gray-soft text-gray'}`}>
                    {s.label}
                    {s.is_active && ' · aktif'}
                  </button>
                ))}
              </div>
            ),
          },
          ...(bolehKelola
            ? [{
                kunci: 'aksi', judul: 'Aksi', className: 'w-40',
                render: (t: TahunPelajaran) => (
                  <div className="flex items-center gap-1">
                    {t.status !== 'aktif' && t.status !== 'selesai' && (
                      <button type="button" aria-label={`Aktifkan ${t.nama}`}
                        onClick={() => { setJenisSemester('ganjil'); setAktifkan(t) }}
                        className="touch-target flex items-center justify-center rounded-control text-success hover:bg-success-soft">
                        <CalendarCheck size={16} />
                      </button>
                    )}
                    {t.status === 'aktif' && (
                      <button type="button" aria-label={`Tandai selesai ${t.nama}`} onClick={() => setSelesai(t)}
                        className="touch-target flex items-center justify-center rounded-control text-warn-text hover:bg-warn-bg">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button type="button" aria-label={`Ubah ${t.nama}`}
                      onClick={() => { setGalat({}); setForm({ terbuka: true, id: t.id, nilai: { nama: t.nama, tanggal_mulai: t.tanggal_mulai ?? '', tanggal_selesai: t.tanggal_selesai ?? '' } }) }}
                      className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                      <Pencil size={16} />
                    </button>
                    <button type="button" aria-label={`Hapus ${t.nama}`} onClick={() => setDihapus(t)}
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

      {(data?.data ?? []).length === 0 && (
        <EmptyState judul="Belum ada tahun pelajaran"
          keterangan="Tahun pelajaran wajib dibuat lebih dulu karena kelas, plotting, dan jadwal mengacu ke sana." />
      )}

      <Modal
        terbuka={form.terbuka}
        judul={form.id ? 'Ubah Tahun Pelajaran' : 'Tambah Tahun Pelajaran'}
        keterangan="Dua semester (Ganjil & Genap) dibuat otomatis. Tanggalnya dapat diubah kemudian."
        onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangTeks label="Nama" id="nama" wajib nilai={form.nilai.nama} pesanError={galat.nama}
            placeholder="2026/2027" petunjuk="Format YYYY/YYYY."
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nama: v } }))} />
          <div className="hidden sm:block" />
          <BidangTeks label="Tanggal Mulai" id="tanggal_mulai" tipe="date" wajib
            nilai={form.nilai.tanggal_mulai} pesanError={galat.tanggal_mulai}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tanggal_mulai: v } }))} />
          <BidangTeks label="Tanggal Selesai" id="tanggal_selesai" tipe="date" wajib
            nilai={form.nilai.tanggal_selesai} pesanError={galat.tanggal_selesai}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, tanggal_selesai: v } }))} />
        </div>
      </Modal>

      <Modal terbuka={semester !== null} lebar="sm"
        judul="Ubah Tanggal Semester"
        keterangan={semester ? `${semester.tahun.nama} · ${semester.data.label}` : ''}
        onTutup={() => setSemester(null)}
        footer={
          <>
            <Button varian="ghost" onClick={() => setSemester(null)}>Batal</Button>
            <Button memuat={simpanSemester.isPending}
              onClick={() => semester && simpanSemester.mutate({ id: semester.data.id, nilai: { tanggal_mulai: semester.data.tanggal_mulai ?? '', tanggal_selesai: semester.data.tanggal_selesai ?? '' } })}>
              Simpan
            </Button>
          </>
        }
      >
        {semester && (
          <div className="grid gap-4 sm:grid-cols-2">
            <BidangTeks label="Tanggal Mulai" id="sem-mulai" tipe="date" nilai={semester.data.tanggal_mulai ?? ''}
              onUbah={(v) => setSemester((s) => (s ? { ...s, data: { ...s.data, tanggal_mulai: v } } : s))} />
            <BidangTeks label="Tanggal Selesai" id="sem-selesai" tipe="date" nilai={semester.data.tanggal_selesai ?? ''}
              onUbah={(v) => setSemester((s) => (s ? { ...s, data: { ...s.data, tanggal_selesai: v } } : s))} />
          </div>
        )}
      </Modal>

      <Modal terbuka={aktifkan !== null} lebar="sm"
        judul="Aktifkan Tahun Pelajaran"
        keterangan={aktifkan ? `${aktifkan.nama} — tahun pelajaran dan semester lain akan dinonaktifkan (BR-01).` : ''}
        onTutup={() => setAktifkan(null)}
        footer={
          <>
            <Button varian="ghost" onClick={() => setAktifkan(null)}>Batal</Button>
            <Button memuat={jadikanAktif.isPending}
              onClick={() => aktifkan && jadikanAktif.mutate({ id: aktifkan.id, jenis: jenisSemester })}>
              Aktifkan
            </Button>
          </>
        }
      >
        <BidangPilihan label="Semester yang aktif" id="jenis-semester" wajib nilai={jenisSemester}
          kosongLabel="— Pilih —" onUbah={setJenisSemester}
          opsi={[{ nilai: 'ganjil', label: 'Ganjil' }, { nilai: 'genap', label: 'Genap' }]} />
      </Modal>

      <ConfirmDialog terbuka={selesai !== null} varian="primary" labelKonfirmasi="Tandai Selesai"
        judul="Tandai tahun pelajaran selesai?"
        keterangan={selesai ? `Data transaksi ${selesai.nama} menjadi read-only dan foto presensi tahun ini memenuhi aturan retensi (BR-30).` : ''}
        memuat={tandaiSelesai.isPending}
        onKonfirmasi={() => selesai && tandaiSelesai.mutate(selesai.id)}
        onTutup={() => setSelesai(null)} />

      <ConfirmDialog terbuka={dihapus !== null} judul="Hapus tahun pelajaran?"
        keterangan={dihapus ? `${dihapus.nama} beserta semesternya akan dihapus. Tahun pelajaran yang sudah memiliki kelas tidak dapat dihapus.` : ''}
        labelKonfirmasi="Hapus" memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)} onTutup={() => setDihapus(null)} />
    </div>
  )
}
