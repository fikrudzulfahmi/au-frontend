import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeft, Download, History, Trash2, Upload, UserPlus } from 'lucide-react'

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
import { cn } from '@/lib/cn'
import { get, pesanError } from '@/lib/api'
import { master, unduhBerkas, unggahBerkas, type LaporanDetail } from '@/lib/crud'
import { formatTanggalDari } from '@/lib/format'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useSemester } from '@/features/akademik/useSemester'
import type { Kelas } from '@/features/master/types'
import type { PlottingKelas, RingkasanKelas } from '@/features/akademik/types'
import { LabStatusAkhir } from './komponen'

interface RiwayatBaris {
  plotting_kelas_id: number
  tahun_pelajaran: string | null
  kelas: string | null
  tingkat: string | null
  jurusan: string | null
  status_akhir: string
  mutasi: Array<{ tanggal: string | null; dari: string | null; ke: string | null; alasan: string }>
}

interface RiwayatSiswa {
  siswa: { id: number; nis: string; nama: string; status: string }
  riwayat: RiwayatBaris[]
}

/** FR-PLK-01..09 — penempatan siswa ke kelas per tahun pelajaran. */
export function PlottingKelasPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const toast = useToast()
  const qc = useQueryClient()
  const { daftarTahun, tahunAktif } = useSemester()

  const [tahunId, setTahunId] = useState<number | null>(null)
  const [tab, setTab] = useState<'per-kelas' | 'belum'>('per-kelas')
  const [kelasTerpilih, setKelasTerpilih] = useState<number | null>(null)
  const [cari, setCari] = useState('')
  const [halaman, setHalaman] = useState(1)

  const [pilihSiswa, setPilihSiswa] = useState<number[]>([])
  const [tujuanPlot, setTujuanPlot] = useState('')
  const [impor, setImpor] = useState<{ buka: boolean; laporan: LaporanDetail | null }>({ buka: false, laporan: null })
  const [berkasImpor, setBerkasImpor] = useState<File | null>(null)
  const [mutasi, setMutasi] = useState<{ plotting: PlottingKelas; kelas: string; tanggal: string; alasan: string } | null>(null)
  const [riwayat, setRiwayat] = useState<PlottingKelas | null>(null)
  const [hapus, setHapus] = useState<PlottingKelas | null>(null)

  const tahunDipilih = tahunId ?? tahunAktif?.id ?? null

  const kelas = useQuery({
    queryKey: ['kelas', 'plotting', tahunDipilih],
    queryFn: () => master.daftar<Kelas>('/kelas', { tahun_pelajaran_id: tahunDipilih, per_page: 100 }),
    enabled: tahunDipilih !== null,
  })

  const ringkasan = useQuery({
    queryKey: ['plotting-kelas', 'ringkasan', tahunDipilih],
    queryFn: () => get<{ data: RingkasanKelas[] }>('/plotting-kelas/ringkasan', { tahun_pelajaran_id: tahunDipilih }),
    enabled: tahunDipilih !== null && tab === 'per-kelas',
  })

  const terplot = useQuery({
    queryKey: ['plotting-kelas', { tahunDipilih, kelasTerpilih, cari, halaman }],
    queryFn: () =>
      master.daftar<PlottingKelas>('/plotting-kelas', {
        tahun_pelajaran_id: tahunDipilih,
        kelas_id: kelasTerpilih ?? '',
        cari,
        page: halaman,
        per_page: 25,
      }),
    enabled: tahunDipilih !== null && tab === 'per-kelas' && kelasTerpilih !== null,
  })

  const belum = useQuery({
    queryKey: ['plotting-kelas', 'belum', { tahunDipilih, cari, halaman }],
    queryFn: () =>
      master.daftar<{ id: number; nis: string; nama: string; jenis_kelamin: string }>('/plotting-kelas/belum-terplot', {
        tahun_pelajaran_id: tahunDipilih,
        cari,
        page: halaman,
        per_page: 25,
      }),
    enabled: tahunDipilih !== null && tab === 'belum',
  })

  const opsiKelas = useMemo(
    () => (kelas.data?.data ?? []).map((k) => ({ nilai: k.id, label: `${k.nama} (${k.jurusan?.kode ?? '—'})` })),
    [kelas.data],
  )

  const segarkan = () => void qc.invalidateQueries({ queryKey: ['plotting-kelas'] })

  const plotBaru = useMutation({
    mutationFn: () =>
      master.buat<{ dibuat: number; dilewati: Array<{ siswa_id: number; alasan: string }> }>('/plotting-kelas', {
        kelas_id: Number(tujuanPlot),
        siswa_ids: pilihSiswa,
      }),
    onSuccess: (hasil) => {
      toast.sukses(`Siswa ditempatkan: ${hasil.data.dibuat}.`)
      hasil.data.dilewati.forEach((d) => toast.tampilkan(d.alasan, 'info'))
      setPilihSiswa([])
      setTujuanPlot('')
      segarkan()
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jalankanImpor = useMutation({
    mutationFn: () =>
      unggahBerkas<{ message: string; data: LaporanDetail }>(
        `/plotting-kelas/import?tahun_pelajaran_id=${tahunDipilih}`,
        berkasImpor as File,
      ),
    onSuccess: (hasil) => { setImpor((s) => ({ ...s, laporan: hasil.data })); toast.sukses(hasil.message); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const simpanMutasi = useMutation({
    mutationFn: (v: { plotting: PlottingKelas; kelas: string; tanggal: string; alasan: string }) =>
      master.buat(`/plotting-kelas/${v.plotting.id}/mutasi`, {
        kelas_tujuan_id: Number(v.kelas),
        tanggal: v.tanggal,
        alasan: v.alasan,
      }),
    onSuccess: () => { toast.sukses('Siswa dipindahkan.'); setMutasi(null); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const hapusPlotting = useMutation({
    mutationFn: (id: number) => master.hapus('/plotting-kelas', id),
    onSuccess: () => { toast.sukses('Plotting dihapus.'); setHapus(null); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  async function unduh(jalur: string, nama: string) {
    try { await unduhBerkas(jalur, nama) } catch (e) { toast.gagal(pesanError(e)) }
  }

  const dataTerplot = terplot.data
  const dataBelum = belum.data
  const barisBelum = dataBelum?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Plotting Kelas"
        keterangan="Penempatan siswa ke kelas per tahun pelajaran. Wali kelas diatur di menu Kelas."
        aksi={
          bolehKelola && (
            <>
              <Button varian="secondary"
                onClick={() => unduh(`/plotting-kelas/ekspor?tahun_pelajaran_id=${tahunDipilih}`, 'daftar-siswa-per-kelas.xlsx')}>
                <Download size={17} /> Ekspor
              </Button>
              <Button varian="secondary" onClick={() => setImpor({ buka: true, laporan: null })}>
                <Upload size={17} /> Import
              </Button>
            </>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Tahun pelajaran" value={tahunDipilih ?? ''}
          onChange={(e) => { setTahunId(Number(e.target.value)); setKelasTerpilih(null); setHalaman(1) }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          {daftarTahun.map((t) => (
            <option key={t.id} value={t.id}>{t.nama} ({t.status})</option>
          ))}
        </select>

        <div className="flex gap-1 rounded-control bg-surface p-1 shadow-card">
          {([['per-kelas', 'Per Kelas'], ['belum', 'Belum Terplot']] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => { setTab(k); setHalaman(1); setPilihSiswa([]) }}
              className={cn('rounded-[13px] px-4 py-2 text-sm font-bold transition-colors',
                tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-app-soft')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'per-kelas' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(ringkasan.data?.data ?? []).map((r) => (
              <button key={r.kelas_id} type="button"
                onClick={() => { setKelasTerpilih(r.kelas_id === kelasTerpilih ? null : r.kelas_id); setHalaman(1) }}
                className={cn('card p-4 text-left transition-shadow hover:shadow-pop',
                  kelasTerpilih === r.kelas_id && 'ring-2 ring-primary')}>
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-strong">{r.nama}</span>
                  <StatusBadge varian="izin">{r.tingkat}</StatusBadge>
                </div>
                <p className="tnum mt-1 text-2xl font-extrabold text-primary">{r.jumlah}</p>
                <p className="text-xs text-muted">
                  L {r.jumlah_l} · P {r.jumlah_p} · {r.wali_kelas ?? 'wali belum ditetapkan'}
                </p>
              </button>
            ))}
          </div>

          {kelasTerpilih === null ? (
            <p className="px-1 text-sm text-muted">Pilih satu kelas di atas untuk melihat daftar siswanya.</p>
          ) : (
            <>
              <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari nama atau NIS…" />

              <DataTable
                data={dataTerplot?.data ?? []}
                kunciBaris={(p) => p.id}
                kosong="Belum ada siswa di kelas ini."
                kolom={[
                  { kunci: 'nis', judul: 'NIS', render: (p) => <span className="tnum font-bold">{p.siswa?.nis}</span> },
                  { kunci: 'nama', judul: 'Nama', render: (p) => p.siswa?.nama ?? '—' },
                  { kunci: 'jk', judul: 'L/P', render: (p) => p.siswa?.jenis_kelamin ?? '—', sembunyiMobile: true },
                  {
                    kunci: 'status', judul: 'Status Akhir',
                    render: (p) => <LabStatusAkhir nilai={p.status_akhir} sudahDiproses={p.sudah_diproses} />,
                  },
                  ...(bolehKelola
                    ? [{
                        kunci: 'aksi', judul: 'Aksi', className: 'w-32',
                        render: (p: PlottingKelas) => (
                          <div className="flex items-center gap-1">
                            <button type="button" title="Mutasi kelas" aria-label={`Mutasi ${p.siswa?.nama}`}
                              onClick={() => setMutasi({ plotting: p, kelas: '', tanggal: new Date().toISOString().slice(0, 10), alasan: '' })}
                              className="touch-target flex items-center justify-center rounded-control text-link hover:bg-info-soft">
                              <ArrowRightLeft size={16} />
                            </button>
                            <button type="button" title="Riwayat kelas" aria-label={`Riwayat ${p.siswa?.nama}`}
                              onClick={() => setRiwayat(p)}
                              className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                              <History size={16} />
                            </button>
                            <button type="button" title="Keluarkan dari kelas" aria-label={`Hapus plotting ${p.siswa?.nama}`}
                              onClick={() => setHapus(p)}
                              className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ),
                      }]
                    : []),
                ]}
              />

              <Pagination halaman={dataTerplot?.meta.page ?? 1} perHalaman={dataTerplot?.meta.per_page ?? 25}
                total={dataTerplot?.meta.total ?? 0} onUbah={setHalaman} />
            </>
          )}
        </>
      )}

      {tab === 'belum' && (
        <>
          <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari nama atau NIS…" />

          <div className="card flex flex-wrap items-end gap-3 p-4">
            <BidangPilihan label="Kelas tujuan" id="tujuan-plot" opsi={opsiKelas} nilai={tujuanPlot}
              onUbah={setTujuanPlot} kosongLabel="— Pilih kelas —" className="min-w-[220px] flex-1" />
            <Button memuat={plotBaru.isPending} disabled={pilihSiswa.length === 0 || tujuanPlot === ''}
              onClick={() => plotBaru.mutate()}>
              <UserPlus size={17} /> Tempatkan {pilihSiswa.length > 0 ? `(${pilihSiswa.length})` : ''}
            </Button>
            {pilihSiswa.length > 0 && (
              <Button varian="ghost" onClick={() => setPilihSiswa([])}>Kosongkan pilihan</Button>
            )}
          </div>

          <DataTable
            data={barisBelum}
            kunciBaris={(s) => s.id}
            kosong="Semua siswa aktif sudah terplot pada tahun pelajaran ini."
            pilih={{
              terpilih: pilihSiswa,
              idBaris: (s) => s.id,
              onUbah: (id, dicentang) =>
                setPilihSiswa((lama) => (dicentang ? [...lama, Number(id)] : lama.filter((x) => x !== Number(id)))),
              onSemua: (dicentang) => setPilihSiswa(dicentang ? barisBelum.map((s) => s.id) : []),
            }}
            kolom={[
              { kunci: 'nis', judul: 'NIS', render: (s) => <span className="tnum font-bold">{s.nis}</span> },
              { kunci: 'nama', judul: 'Nama', render: (s) => s.nama },
              { kunci: 'jk', judul: 'L/P', render: (s) => s.jenis_kelamin },
            ]}
          />

          <Pagination halaman={dataBelum?.meta.page ?? 1} perHalaman={dataBelum?.meta.per_page ?? 25}
            total={dataBelum?.meta.total ?? 0} onUbah={setHalaman} />
        </>
      )}

      <Modal terbuka={impor.buka} judul="Import Penempatan Siswa"
        keterangan="Kolom yang dibutuhkan: nis dan nama_kelas. Baris yang gagal dilaporkan tanpa membatalkan baris lain."
        onTutup={() => { setImpor({ buka: false, laporan: null }); setBerkasImpor(null) }}
        footer={
          <Button memuat={jalankanImpor.isPending} disabled={!berkasImpor} onClick={() => jalankanImpor.mutate()}>
            <Upload size={17} /> Proses Import
          </Button>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-strong">Berkas Excel/CSV</span>
            <input type="file" accept=".xlsx,.xls,.csv"
              onChange={(e) => setBerkasImpor(e.target.files?.[0] ?? null)}
              className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-strong" />
            <span className="mt-1 block text-xs text-muted">
              Contoh isi baris: 1234567 | X TKJ 1 — nama kelas harus sama persis dengan data Kelas.
            </span>
          </label>
          {impor.laporan && <PeringatanImport laporan={impor.laporan} />}
        </div>
      </Modal>

      <Modal terbuka={mutasi !== null} lebar="sm" judul="Mutasi Kelas"
        keterangan={mutasi ? `${mutasi.plotting.siswa?.nama} — dari ${mutasi.plotting.kelas ?? '—'}` : ''}
        onTutup={() => setMutasi(null)}
        footer={
          <>
            <Button varian="ghost" onClick={() => setMutasi(null)}>Batal</Button>
            <Button memuat={simpanMutasi.isPending} onClick={() => mutasi && simpanMutasi.mutate(mutasi)}>Pindahkan</Button>
          </>
        }
      >
        {mutasi && (
          <div className="space-y-4">
            <BidangPilihan label="Kelas tujuan" id="mutasi-tujuan" wajib opsi={opsiKelas}
              nilai={mutasi.kelas} kosongLabel="— Pilih kelas —"
              onUbah={(v) => setMutasi((s) => (s ? { ...s, kelas: v } : s))} />
            <BidangTeks label="Tanggal" id="mutasi-tanggal" tipe="date" wajib nilai={mutasi.tanggal}
              onUbah={(v) => setMutasi((s) => (s ? { ...s, tanggal: v } : s))} />
            <BidangTeks label="Alasan" id="mutasi-alasan" wajib nilai={mutasi.alasan}
              petunjuk="Wajib diisi (FR-PLK-05)."
              onUbah={(v) => setMutasi((s) => (s ? { ...s, alasan: v } : s))} />
            <p className="rounded-control bg-app-soft px-3 py-2 text-xs text-muted">
              Data presensi yang sudah tercatat tetap melekat pada kelas lamanya.
            </p>
          </div>
        )}
      </Modal>

      <RiwayatDialog plotting={riwayat} onTutup={() => setRiwayat(null)} />

      <ConfirmDialog terbuka={hapus !== null} judul="Keluarkan siswa dari kelas?"
        keterangan={hapus ? `${hapus.siswa?.nama} akan dikeluarkan dari ${hapus.kelas}. Siswa dapat diplot ulang setelahnya.` : ''}
        labelKonfirmasi="Keluarkan" memuat={hapusPlotting.isPending}
        onKonfirmasi={() => hapus && hapusPlotting.mutate(hapus.id)} onTutup={() => setHapus(null)} />
    </div>
  )
}

/** FR-PLK-08 — riwayat kelas seorang siswa dari tahun ke tahun, termasuk mutasinya. */
function RiwayatDialog({ plotting, onTutup }: { plotting: PlottingKelas | null; onTutup: () => void }) {
  const siswaId = plotting?.siswa_id ?? 0

  const riwayat = useQuery({
    queryKey: ['plotting-kelas', 'riwayat', siswaId],
    queryFn: () => get<{ data: RiwayatSiswa }>(`/siswa/${siswaId}/riwayat-kelas`),
    enabled: siswaId > 0,
  })

  const data = riwayat.data?.data

  return (
    <Modal terbuka={plotting !== null} judul="Riwayat Kelas"
      keterangan={plotting?.siswa ? `${plotting.siswa.nama} — NIS ${plotting.siswa.nis}` : ''}
      onTutup={onTutup} footer={<Button onClick={onTutup}>Tutup</Button>}
    >
      {riwayat.isLoading && <p className="text-sm text-muted">Memuat riwayat…</p>}

      {data && data.riwayat.length === 0 && (
        <p className="text-sm text-muted">Siswa ini belum pernah terplot pada kelas mana pun.</p>
      )}

      {data && data.riwayat.length > 0 && (
        <ol className="space-y-3">
          {data.riwayat.map((b) => (
            <li key={b.plotting_kelas_id} className="rounded-control border border-line px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-strong">{b.kelas ?? '—'}</span>
                <span className="tnum text-xs text-muted">{b.tahun_pelajaran ?? '—'}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge varian="izin">{b.tingkat ?? '—'}</StatusBadge>
                <span className="text-xs text-muted">Status akhir: {b.status_akhir}</span>
              </div>
              {b.mutasi.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-line pt-2">
                  {b.mutasi.map((m, i) => (
                    <li key={i} className="text-xs text-strong">
                      <span className="font-semibold">{formatTanggalDari(m.tanggal)}</span>: {m.dari} → {m.ke}
                      <span className="text-muted"> — {m.alasan}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
