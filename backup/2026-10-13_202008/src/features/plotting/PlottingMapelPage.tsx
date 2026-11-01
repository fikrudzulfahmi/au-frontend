import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Download, Pencil, Plus, Trash2 } from 'lucide-react'

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
import { cn } from '@/lib/cn'
import { get, pesanError } from '@/lib/api'
import { aksi, master, pesanPerBidang, unduhBerkas } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useSemester } from '@/features/akademik/useSemester'
import type { Kelas, Mapel, Pegawai } from '@/features/master/types'
import type { PlottingMapel } from '@/features/akademik/types'

const KOSONG = { pegawai_id: '', mapel_id: '', kelas_id: '', jp_per_minggu: '4' }

interface BarisPerGuru {
  pegawai_id: number
  nama: string | null
  jabatan: string | null
  total_jp: number
  jumlah_kelas: number
  rincian: Array<{ plotting_mapel_id: number; mapel: string | null; kelas: string | null; jp_per_minggu: number; jp_terjadwal: number }>
}

/** FR-PLM-01..07 — guru pengampu mapel per kelas per semester. */
export function PlottingMapelPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin, ROLE.wakasekKurikulum)
  const toast = useToast()
  const qc = useQueryClient()
  const { semuaSemester, semesterAktif } = useSemester()

  const [semesterId, setSemesterId] = useState<number | null>(null)
  const [tab, setTab] = useState<'daftar' | 'matriks' | 'guru'>('daftar')
  const [cari, setCari] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ buka: boolean; id?: number; nilai: typeof KOSONG }>({ buka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<PlottingMapel | null>(null)
  const [salin, setSalin] = useState('')

  const semester = semesterId ?? semesterAktif?.id ?? null

  const guru = useQuery({
    queryKey: ['pegawai', 'guru-plotting'],
    queryFn: () => master.daftar<Pegawai>('/pegawai', { jenis_pegawai: 'guru', is_active: true, per_page: 100 }),
  })

  const mapel = useQuery({
    queryKey: ['mapel', 'plotting'],
    queryFn: () => master.daftar<Mapel>('/mapel', { is_active: true, per_page: 100 }),
  })

  const opsiSemester = semuaSemester.map((s) => ({
    nilai: s.id,
    label: `${s.label}${s.is_active ? ' · aktif' : ''}`,
  }))

  const daftar = useQuery({
    queryKey: ['plotting-mapel', { semester, cari, kelasFilter, halaman }],
    queryFn: () =>
      master.daftar<PlottingMapel>('/plotting-mapel', {
        semester_id: semester,
        cari,
        kelas_id: kelasFilter,
        page: halaman,
        per_page: 25,
      }),
    enabled: semester !== null && tab === 'daftar',
  })

  const matriks = useQuery({
    queryKey: ['plotting-mapel', 'matriks', semester],
    queryFn: () =>
      get<{ data: { kelas: Array<{ kelas_id: number; nama: string; tingkat: string; mapel: Array<{ plotting_mapel_id: number; mapel_id: number; guru: string | null; jp_per_minggu: number }> }>; mapel: Mapel[] } }>(
        '/plotting-mapel/matriks',
        { semester_id: semester },
      ),
    enabled: semester !== null && tab === 'matriks',
  })

  const perGuru = useQuery({
    queryKey: ['plotting-mapel', 'per-guru', semester],
    queryFn: () => get<{ data: BarisPerGuru[] }>('/plotting-mapel/per-guru', { semester_id: semester }),
    enabled: semester !== null && tab === 'guru',
  })

  const kelas = useQuery({
    queryKey: ['kelas', 'plotting-mapel', semester],
    queryFn: async () => {
      const s = semuaSemester.find((x) => x.id === semester)
      return master.daftar<Kelas>('/kelas', { tahun_pelajaran_id: s?.tahun_pelajaran_id, per_page: 100 })
    },
    enabled: semester !== null,
  })

  const opsiGuru = (guru.data?.data ?? []).map((g) => ({ nilai: g.id, label: g.nama }))
  const opsiMapel = (mapel.data?.data ?? []).map((m) => ({ nilai: m.id, label: `${m.kode} — ${m.nama}` }))
  const opsiKelas = (kelas.data?.data ?? []).map((k) => ({ nilai: k.id, label: k.nama }))

  const segarkan = () => void qc.invalidateQueries({ queryKey: ['plotting-mapel'] })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      if (v.id) {
        return master.ubah('/plotting-mapel', v.id, {
          pegawai_id: Number(v.nilai.pegawai_id),
          jp_per_minggu: Number(v.nilai.jp_per_minggu),
        })
      }
      return master.buat('/plotting-mapel', {
        semester_id: semester,
        pegawai_id: Number(v.nilai.pegawai_id),
        mapel_id: Number(v.nilai.mapel_id),
        kelas_id: Number(v.nilai.kelas_id),
        jp_per_minggu: Number(v.nilai.jp_per_minggu),
      })
    },
    onSuccess: () => { toast.sukses('Plotting mapel disimpan.'); setForm({ buka: false, nilai: KOSONG }); setGalat({}); segarkan() },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/plotting-mapel', id),
    onSuccess: () => { toast.sukses('Plotting dihapus.'); setDihapus(null); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jalankanSalin = useMutation({
    mutationFn: () =>
      aksi<{ message: string }>('/plotting-mapel/salin', {
        semester_asal_id: Number(salin),
        semester_tujuan_id: semester,
      }),
    onSuccess: (hasil) => { toast.sukses(hasil.message); setSalin(''); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  async function unduh() {
    try { await unduhBerkas(`/plotting-mapel/ekspor?semester_id=${semester}`, 'plotting-mapel.xlsx') }
    catch (e) { toast.gagal(pesanError(e)) }
  }

  const data = daftar.data
  const barisMatriks = matriks.data?.data.kelas ?? []
  const daftarMapel = matriks.data?.data.mapel ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Plotting Mapel"
        keterangan="Satu mapel pada satu kelas hanya boleh diampu satu guru per semester (BR-03)."
        aksi={
          bolehKelola && (
            <>
              <Button varian="secondary" onClick={unduh}><Download size={17} /> Ekspor</Button>
              <Button varian="secondary" onClick={() => { setGalat({}); setForm({ buka: true, nilai: KOSONG }) }}>
                <Plus size={17} /> Tambah Plotting
              </Button>
            </>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Semester" value={semester ?? ''}
          onChange={(e) => { setSemesterId(Number(e.target.value)); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          {opsiSemester.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
        </select>

        <div className="flex gap-1 rounded-control bg-surface p-1 shadow-card">
          {([['daftar', 'Daftar'], ['matriks', 'Matriks'], ['guru', 'Per Guru']] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={cn('rounded-[13px] px-4 py-2 text-sm font-bold transition-colors',
                tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-app-soft')}>
              {label}
            </button>
          ))}
        </div>

        {bolehKelola && opsiSemester.length > 1 && (
          <div className="ml-auto flex items-end gap-2">
            <BidangPilihan label="Salin dari semester" id="salin-semester" opsi={opsiSemester.filter((o) => o.nilai !== semester)}
              nilai={salin} onUbah={setSalin} kosongLabel="— Pilih —" className="min-w-[190px]" />
            <Button varian="secondary" disabled={salin === ''} memuat={jalankanSalin.isPending}
              onClick={() => jalankanSalin.mutate()}>
              <Copy size={17} /> Salin
            </Button>
          </div>
        )}
      </div>

      {tab === 'daftar' && (
        <>
          <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari mapel atau guru…">
            <select aria-label="Filter kelas" value={kelasFilter}
              onChange={(e) => { setKelasFilter(e.target.value); setHalaman(1) }}
              className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
              <option value="">Semua kelas</option>
              {opsiKelas.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
            </select>
          </Toolbar>

          <DataTable
            data={data?.data ?? []}
            kunciBaris={(p) => p.id}
            kosong="Belum ada plotting mapel pada semester ini."
            kolom={[
              { kunci: 'mapel', judul: 'Mata Pelajaran', render: (p) => <span className="font-bold">{p.mapel?.nama}</span> },
              { kunci: 'kelas', judul: 'Kelas', render: (p) => p.kelas ?? '—' },
              { kunci: 'guru', judul: 'Guru Pengampu', render: (p) => p.guru ?? '—' },
              {
                kunci: 'jp', judul: 'JP/Minggu',
                render: (p) => (
                  <span className="tnum">
                    {p.jp_per_minggu}
                    <span className="text-xs text-muted"> · terjadwal {p.jumlah_jadwal ?? 0}</span>
                  </span>
                ),
              },
              ...(bolehKelola
                ? [{
                    kunci: 'aksi', judul: 'Aksi', className: 'w-24',
                    render: (p: PlottingMapel) => (
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={`Ubah ${p.mapel?.nama}`}
                          onClick={() => { setGalat({}); setForm({ buka: true, id: p.id, nilai: { pegawai_id: String(p.pegawai_id), mapel_id: String(p.mapel_id), kelas_id: String(p.kelas_id), jp_per_minggu: String(p.jp_per_minggu) } }) }}
                          className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                          <Pencil size={16} />
                        </button>
                        <button type="button" aria-label={`Hapus ${p.mapel?.nama}`} onClick={() => setDihapus(p)}
                          className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  }]
                : []),
            ]}
          />

          <Pagination halaman={data?.meta.page ?? 1} perHalaman={data?.meta.per_page ?? 25} total={data?.meta.total ?? 0} onUbah={setHalaman} />
        </>
      )}

      {tab === 'matriks' && (
        <div className="card overflow-x-auto p-1">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-app-soft text-left">
                <th className="sticky left-0 bg-app-soft px-4 py-3 text-xs font-bold uppercase text-muted">Kelas</th>
                {daftarMapel.map((m) => (
                  <th key={m.id} className="px-3 py-3 text-xs font-bold uppercase text-muted">{m.kode}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {barisMatriks.map((k) => (
                <tr key={k.kelas_id} className="border-t border-line">
                  <td className="sticky left-0 bg-surface px-4 py-3 font-bold text-strong">{k.nama}</td>
                  {daftarMapel.map((m) => {
                    const isi = k.mapel.find((x) => x.mapel_id === m.id)
                    return (
                      <td key={m.id} className="px-3 py-2 text-xs">
                        {isi ? (
                          <span className="block leading-tight">
                            <span className="font-semibold text-strong">{isi.guru}</span>
                            <span className="tnum block text-muted">{isi.jp_per_minggu} JP</span>
                          </span>
                        ) : (
                          <span className="text-line">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'guru' && (
        <div className="space-y-3">
          {(perGuru.data?.data ?? []).map((g) => (
            <section key={g.pegawai_id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-strong">{g.nama}</h2>
                  <p className="text-xs text-muted">{g.jabatan}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge varian="izin">{g.jumlah_kelas} kelas</StatusBadge>
                  <StatusBadge varian="hadir">{g.total_jp} JP/minggu</StatusBadge>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-line">
                {g.rincian.map((r) => (
                  <li key={r.plotting_mapel_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-strong">{r.mapel} — <span className="text-muted">{r.kelas}</span></span>
                    <span className="tnum text-xs text-muted">{r.jp_per_minggu} JP · terjadwal {r.jp_terjadwal}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {(perGuru.data?.data ?? []).length === 0 && (
            <p className="card p-5 text-sm text-muted">Belum ada plotting pada semester ini.</p>
          )}
        </div>
      )}

      <Modal terbuka={form.buka} judul={form.id ? 'Ubah Plotting Mapel' : 'Tambah Plotting Mapel'}
        keterangan={form.id ? 'Mapel dan kelas tidak dapat diubah; hapus lalu buat baru bila salah.' : undefined}
        onTutup={() => setForm({ buka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ buka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BidangPilihan label="Guru Pengampu" id="pm-guru" wajib opsi={opsiGuru} nilai={form.nilai.pegawai_id}
            pesanError={galat.pegawai_id} kosongLabel="— Pilih guru —" petunjuk="Hanya pegawai berjenis guru (FR-PLM-03)."
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, pegawai_id: v } }))} />
          <BidangTeks label="JP per Minggu" id="pm-jp" tipe="number" wajib nilai={form.nilai.jp_per_minggu}
            pesanError={galat.jp_per_minggu}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, jp_per_minggu: v } }))} />
          {!form.id && (
            <>
              <BidangPilihan label="Mata Pelajaran" id="pm-mapel" wajib opsi={opsiMapel} nilai={form.nilai.mapel_id}
                pesanError={galat.mapel_id} kosongLabel="— Pilih mapel —"
                onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, mapel_id: v } }))} />
              <BidangPilihan label="Kelas" id="pm-kelas" wajib opsi={opsiKelas} nilai={form.nilai.kelas_id}
                pesanError={galat.kelas_id} kosongLabel="— Pilih kelas —"
                onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, kelas_id: v } }))} />
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog terbuka={dihapus !== null} judul="Hapus plotting mapel?"
        keterangan={dihapus ? `${dihapus.mapel?.nama} di ${dihapus.kelas} akan dihapus. Plotting yang sudah dipakai jadwal tidak dapat dihapus.` : ''}
        labelKonfirmasi="Hapus" memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)} onTutup={() => setDihapus(null)} />
    </div>
  )
}
