import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Download, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { BidangPilihan } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { get, pesanError } from '@/lib/api'
import { master, unduhBerkas } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useSemester } from '@/features/akademik/useSemester'
import type { Kelas, Pegawai } from '@/features/master/types'
import type { GridJadwal, IsiJadwal, PlottingMapel } from '@/features/akademik/types'

/** FR-JDW-01..07 — penyusunan jadwal dengan penolakan bentrok (BR-06/07/08) dan batas JP (BR-09). */
export function JadwalPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin, ROLE.wakasekKurikulum)
  const toast = useToast()
  const qc = useQueryClient()
  const { semuaSemester, semesterAktif } = useSemester()

  const [semesterId, setSemesterId] = useState<number | null>(null)
  const [kelasId, setKelasId] = useState('')
  const [guruId, setGuruId] = useState('')
  const [sel, setSel] = useState<{ hari: number; namaHari: string; slotJamId: number; jam: string; isi: IsiJadwal[] } | null>(null)
  const [plottingDipilih, setPlottingDipilih] = useState('')
  const [hapus, setHapus] = useState<IsiJadwal | null>(null)

  const semester = semesterId ?? semesterAktif?.id ?? null
  const semesterDipilih = semuaSemester.find((s) => s.id === semester)

  const kelas = useQuery({
    queryKey: ['kelas', 'jadwal', semesterDipilih?.tahun_pelajaran_id],
    queryFn: () => master.daftar<Kelas>('/kelas', { tahun_pelajaran_id: semesterDipilih?.tahun_pelajaran_id, per_page: 100 }),
    enabled: semesterDipilih !== undefined,
  })

  const guru = useQuery({
    queryKey: ['pegawai', 'guru-jadwal'],
    queryFn: () => master.daftar<Pegawai>('/pegawai', { jenis_pegawai: 'guru', is_active: true, per_page: 100 }),
  })

  const grid = useQuery({
    queryKey: ['jadwal', { semester, kelasId, guruId }],
    queryFn: () => get<{ data: GridJadwal }>('/jadwal', { semester_id: semester, kelas_id: kelasId, pegawai_id: guruId }),
    enabled: semester !== null,
  })

  const plotting = useQuery({
    queryKey: ['plotting-mapel', 'jadwal', semester, kelasId],
    queryFn: () => master.daftar<PlottingMapel>('/plotting-mapel', { semester_id: semester, kelas_id: kelasId, per_page: 200 }),
    enabled: semester !== null && sel !== null,
  })

  const segarkan = () => void qc.invalidateQueries({ queryKey: ['jadwal'] })

  const simpan = useMutation({
    mutationFn: () =>
      master.buat('/jadwal', {
        semester_id: semester,
        hari: sel?.hari,
        slot_jam_id: sel?.slotJamId,
        plotting_mapel_id: Number(plottingDipilih),
      }),
    onSuccess: () => { toast.sukses('Jadwal disimpan.'); setSel(null); setPlottingDipilih(''); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const hapusJadwal = useMutation({
    mutationFn: (id: number) => master.hapus('/jadwal', id),
    onSuccess: () => { toast.sukses('Jadwal dihapus.'); setHapus(null); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  async function unduh() {
    try { await unduhBerkas(`/jadwal/ekspor?semester_id=${semester}&kelas_id=${kelasId}&pegawai_id=${guruId}`, 'jadwal-pelajaran.xlsx') }
    catch (e) { toast.gagal(pesanError(e)) }
  }

  const data = grid.data?.data
  const peringatan = data?.peringatan ?? []

  // `data?.hari ?? []` menghasilkan array baru setiap render, sehingga harus di-memo
  // sebelum dipakai sebagai dependensi useMemo berikutnya.
  const hari = useMemo(() => data?.hari ?? [], [data])

  /** Baris grid = urutan slot terbesar di antara hari yang ada. */
  const baris = useMemo(() => {
    const semuaUrutan = hari.flatMap((h) => h.slot.filter((s) => s.dapat_dijadwalkan).map((s) => s.urutan))
    return [...new Set(semuaUrutan)].sort((a, b) => a - b)
  }, [hari])

  const opsiPlotting = (plotting.data?.data ?? []).map((p) => ({
    nilai: p.id,
    label: `${p.mapel?.nama ?? '—'} · ${p.kelas ?? '—'} · ${p.guru ?? '—'} (${p.jumlah_jadwal ?? 0}/${p.jp_per_minggu} JP)`,
  }))

  const adaFilter = kelasId !== '' || guruId !== ''

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Jadwal Pelajaran"
        keterangan="Bentrok guru (BR-06), bentrok kelas (BR-07), dan slot non-pelajaran (BR-08) ditolak di server."
        aksi={
          bolehKelola && <Button varian="secondary" onClick={unduh}><Download size={17} /> Ekspor</Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Semester" value={semester ?? ''}
          onChange={(e) => { setSemesterId(Number(e.target.value)); setKelasId(''); setGuruId('') }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          {semuaSemester.map((s) => (
            <option key={s.id} value={s.id}>{s.label}{s.is_active ? ' · aktif' : ''}</option>
          ))}
        </select>

        <select aria-label="Filter kelas" value={kelasId}
          onChange={(e) => { setKelasId(e.target.value); setGuruId('') }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua kelas</option>
          {(kelas.data?.data ?? []).map((k) => (<option key={k.id} value={k.id}>{k.nama}</option>))}
        </select>

        <select aria-label="Filter guru" value={guruId}
          onChange={(e) => { setGuruId(e.target.value); setKelasId('') }}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          <option value="">Semua guru</option>
          {(guru.data?.data ?? []).map((g) => (<option key={g.id} value={g.id}>{g.nama}</option>))}
        </select>
      </div>

      {peringatan.length > 0 && (
        <div className="rounded-card bg-warn-bg p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-warn-text">
            <AlertTriangle size={16} /> {peringatan.length} plotting belum memenuhi JP per minggu
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {peringatan.slice(0, 6).map((p) => (
              <li key={p.plotting_mapel_id} className="text-xs text-strong">
                {p.mapel} · {p.kelas} · {p.guru} — terjadwal <span className="tnum">{p.terjadwal}</span> dari{' '}
                <span className="tnum">{p.jp_per_minggu}</span> JP
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-muted">Ini peringatan, bukan penghalang (FR-JDW-07).</p>
        </div>
      )}

      {hari.length === 0 && (
        <p className="card p-5 text-sm text-muted">
          Semester ini belum memiliki pola jam, sehingga jadwal belum dapat disusun. Atur pada menu Jam Pelajaran.
        </p>
      )}

      {hari.length > 0 && (
        <div className="card overflow-x-auto p-1">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-app-soft">
                <th className="sticky left-0 z-10 bg-app-soft px-3 py-3 text-left text-xs font-bold uppercase text-muted">
                  Jam
                </th>
                {hari.map((h) => (
                  <th key={h.hari} className="min-w-[190px] px-3 py-3 text-left text-xs font-bold uppercase text-muted">
                    {h.nama_hari}
                    <span className="ml-1 font-normal normal-case text-line">({h.pola_jam ?? '—'})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.map((urutan) => (
                <tr key={urutan} className="border-t border-line">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 align-top">
                    {(() => {
                      const contoh = hari.flatMap((h) => h.slot).find((s) => s.urutan === urutan)
                      return contoh ? (
                        <span className="block">
                          <span className="tnum text-xs font-bold text-strong">Jam {contoh.jam_ke ?? urutan}</span>
                          <span className="tnum block text-[11px] text-muted">{contoh.jam_mulai}–{contoh.jam_selesai}</span>
                        </span>
                      ) : null
                    })()}
                  </td>

                  {hari.map((h) => {
                    const slot = h.slot.find((s) => s.urutan === urutan)

                    if (slot === undefined) return <td key={h.hari} className="bg-app-soft/40 px-3 py-2" />

                    return (
                      <td key={h.hari} className="px-2 py-2 align-top">
                        {slot.isi.length === 0 ? (
                          bolehKelola ? (
                            <button type="button"
                              aria-label={`Tambah jadwal ${h.nama_hari} ${slot.jam_mulai}`}
                              onClick={() => { setPlottingDipilih(''); setSel({ hari: h.hari, namaHari: h.nama_hari, slotJamId: slot.slot_jam_id, jam: `${slot.jam_mulai}–${slot.jam_selesai}`, isi: slot.isi }) }}
                              className="flex w-full items-center justify-center gap-1 rounded-control border border-dashed border-line px-2 py-2 text-xs font-semibold text-muted hover:border-primary hover:text-primary">
                              <Plus size={13} /> Tambah
                            </button>
                          ) : (
                            <span className="block px-2 py-2 text-xs text-line">Kosong</span>
                          )
                        ) : (
                          <div className="space-y-1">
                            {slot.isi.map((i) => (
                              <div key={i.id} className="rounded-control bg-info-soft px-2 py-1.5">
                                <p className="text-xs font-bold leading-tight text-strong">{i.mapel}</p>
                                <p className="text-[11px] leading-tight text-muted">
                                  {i.kelas} · {i.guru}
                                </p>
                                {bolehKelola && (
                                  <div className="mt-0.5 flex justify-end">
                                    <button type="button" aria-label={`Hapus jadwal ${i.mapel}`} onClick={() => setHapus(i)}
                                      className="flex items-center gap-0.5 text-[11px] font-semibold text-danger">
                                      <Trash2 size={11} /> Hapus
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {bolehKelola && (
                              <button type="button"
                                onClick={() => { setPlottingDipilih(''); setSel({ hari: h.hari, namaHari: h.nama_hari, slotJamId: slot.slot_jam_id, jam: `${slot.jam_mulai}–${slot.jam_selesai}`, isi: slot.isi }) }}
                                className="flex w-full items-center justify-center gap-1 rounded-control border border-dashed border-line px-2 py-1 text-[11px] font-semibold text-muted hover:border-primary hover:text-primary">
                                <Plus size={12} /> Tambah
                              </button>
                            )}
                          </div>
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

      {!adaFilter && hari.length > 0 && (
        <p className="px-1 text-xs text-muted">
          Menampilkan seluruh kelas. Pilih satu kelas atau satu guru untuk tampilan yang lebih ringkas.
        </p>
      )}

      <Modal terbuka={sel !== null} judul="Tambah Jadwal"
        keterangan={sel ? `${sel.namaHari} · ${sel.jam}` : ''}
        onTutup={() => { setSel(null); setPlottingDipilih('') }}
        footer={
          <>
            <Button varian="ghost" onClick={() => { setSel(null); setPlottingDipilih('') }}>Batal</Button>
            <Button memuat={simpan.isPending} disabled={plottingDipilih === ''} onClick={() => simpan.mutate()}>
              Simpan
            </Button>
          </>
        }
      >
        <BidangPilihan label="Mata pelajaran & kelas" id="jadwal-plotting" wajib opsi={opsiPlotting}
          nilai={plottingDipilih} kosongLabel="— Pilih plotting —" onUbah={setPlottingDipilih}
          petunjuk="Hanya plotting pada semester ini. Jumlah JP yang sudah terjadwal tampak di ujung label." />

        {kelasId === '' && guruId === '' && (
          <p className="mt-3 rounded-control bg-app-soft px-3 py-2 text-xs text-muted">
            Tips: pilih satu kelas terlebih dahulu agar daftar plotting lebih mudah dibaca.
          </p>
        )}

        <div className={cn('mt-3 rounded-control border border-line px-3 py-2 text-xs text-muted')}>
          Sistem menolak bentrok guru, bentrok kelas, slot non-pelajaran, dan jadwal yang melebihi JP per minggu.
        </div>
      </Modal>

      <ConfirmDialog terbuka={hapus !== null} judul="Hapus jadwal?"
        keterangan={hapus ? `${hapus.mapel} di ${hapus.kelas} akan dihapus dari jadwal.` : ''}
        labelKonfirmasi="Hapus" memuat={hapusJadwal.isPending}
        onKonfirmasi={() => hapus && hapusJadwal.mutate(hapus.id)} onTutup={() => setHapus(null)} />
    </div>
  )
}
