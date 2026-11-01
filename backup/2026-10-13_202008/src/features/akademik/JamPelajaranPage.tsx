import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError } from '@/lib/api'
import { aksi, master, pesanPerBidang } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useSemester } from '@/features/akademik/useSemester'
import { OPSI_HARI, OPSI_TIPE_SLOT, type PolaJam, type SlotJam } from '@/features/akademik/types'

const KOSONG_POLA = { nama: '', hari: [] as number[] }
const KOSONG_SLOT = { urutan: '1', tipe: 'pelajaran', label: '', jam_mulai: '07:00', jam_selesai: '07:45', jam_ke: '1' }

/** FR-JAM-01..05 — pola jam dan slotnya per semester. */
export function JamPelajaranPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin, ROLE.wakasekKurikulum)
  const toast = useToast()
  const qc = useQueryClient()
  const { semuaSemester, semesterAktif } = useSemester()

  const [semesterId, setSemesterId] = useState<number | null>(null)
  const [pola, setPola] = useState<{ buka: boolean; id?: number; nilai: typeof KOSONG_POLA }>({ buka: false, nilai: KOSONG_POLA })
  const [galatPola, setGalatPola] = useState<Record<string, string>>({})
  const [slot, setSlot] = useState<{ buka: boolean; polaId: number; id?: number; nilai: typeof KOSONG_SLOT } | null>(null)
  const [galatSlot, setGalatSlot] = useState<Record<string, string>>({})
  const [hapusPola, setHapusPola] = useState<PolaJam | null>(null)
  const [hapusSlot, setHapusSlot] = useState<SlotJam | null>(null)
  const [salin, setSalin] = useState('')

  const semester = semesterId ?? semesterAktif?.id ?? null

  const daftar = useQuery({
    queryKey: ['jam-pelajaran', semester],
    queryFn: () => get<{ data: PolaJam[] }>('/jam-pelajaran', { semester_id: semester }),
    enabled: semester !== null,
  })

  const opsiSemester = semuaSemester.map((s) => ({ nilai: s.id, label: `${s.label}${s.is_active ? ' · aktif' : ''}` }))
  const segarkan = () => void qc.invalidateQueries({ queryKey: ['jam-pelajaran'] })

  const simpanPola = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG_POLA }) => {
      const body = { semester_id: semester, nama: v.nilai.nama, hari: v.nilai.hari }
      return v.id ? master.ubah('/jam-pelajaran', v.id, body) : master.buat('/jam-pelajaran', body)
    },
    onSuccess: () => { toast.sukses('Pola jam disimpan.'); setPola({ buka: false, nilai: KOSONG_POLA }); setGalatPola({}); segarkan() },
    onError: (e) => { setGalatPola(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const simpanSlot = useMutation({
    mutationFn: (v: { polaId: number; id?: number; nilai: typeof KOSONG_SLOT }) => {
      const body = {
        urutan: Number(v.nilai.urutan),
        tipe: v.nilai.tipe,
        label: v.nilai.label,
        jam_mulai: v.nilai.jam_mulai,
        jam_selesai: v.nilai.jam_selesai,
        jam_ke: v.nilai.tipe === 'pelajaran' ? Number(v.nilai.jam_ke) : null,
      }
      return v.id
        ? master.ubah(`/jam-pelajaran/slot`, v.id, body)
        : master.buat(`/jam-pelajaran/${v.polaId}/slot`, body)
    },
    onSuccess: () => { toast.sukses('Slot jam disimpan.'); setSlot(null); setGalatSlot({}); segarkan() },
    onError: (e) => { setGalatSlot(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const hapusPolaMut = useMutation({
    mutationFn: (id: number) => master.hapus('/jam-pelajaran', id),
    onSuccess: () => { toast.sukses('Pola jam dihapus.'); setHapusPola(null); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const hapusSlotMut = useMutation({
    mutationFn: (id: number) => master.hapus('/jam-pelajaran/slot', id),
    onSuccess: () => { toast.sukses('Slot dihapus.'); setHapusSlot(null); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jalankanSalin = useMutation({
    mutationFn: () =>
      aksi<{ message: string; data: { dibuat: number; dilewati: Array<{ nama: string; alasan: string }> } }>(
        '/jam-pelajaran/salin',
        { semester_asal_id: Number(salin), semester_tujuan_id: semester },
      ),
    onSuccess: (hasil) => {
      toast.sukses(hasil.message)
      hasil.data.dilewati.forEach((d) => toast.tampilkan(`${d.nama}: ${d.alasan}`, 'info'))
      setSalin('')
      segarkan()
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const daftarPola = daftar.data?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Jam Pelajaran"
        keterangan="Satu hari hanya boleh masuk satu pola jam dalam satu semester (BR-05)."
        aksi={
          bolehKelola && (
            <Button onClick={() => { setGalatPola({}); setPola({ buka: true, nilai: KOSONG_POLA }) }}>
              <Plus size={17} /> Tambah Pola Jam
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <select aria-label="Semester" value={semester ?? ''}
          onChange={(e) => setSemesterId(Number(e.target.value))}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
          {opsiSemester.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
        </select>

        {bolehKelola && opsiSemester.length > 1 && (
          <div className="ml-auto flex items-end gap-2">
            <BidangPilihan label="Salin dari semester" id="salin-jam" opsi={opsiSemester.filter((o) => o.nilai !== semester)}
              nilai={salin} onUbah={setSalin} kosongLabel="— Pilih —" className="min-w-[190px]" />
            <Button varian="secondary" disabled={salin === ''} memuat={jalankanSalin.isPending}
              onClick={() => jalankanSalin.mutate()}>
              <Copy size={17} /> Salin
            </Button>
          </div>
        )}
      </div>

      {daftarPola.length === 0 && (
        <p className="card p-5 text-sm text-muted">
          Belum ada pola jam pada semester ini. Pola jam diperlukan sebelum jadwal dapat disusun.
        </p>
      )}

      {daftarPola.map((p) => (
        <section key={p.id} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-strong">{p.nama}</h2>
              {(p.hari ?? []).map((h) => (<StatusBadge key={h.id} varian="izin">{h.nama_hari}</StatusBadge>))}
              <span className="tnum text-xs text-muted">{p.jumlah_jp ?? 0} JP</span>
            </div>

            {bolehKelola && (
              <div className="flex items-center gap-1">
                <Button varian="secondary"
                  onClick={() => { setGalatSlot({}); setSlot({ buka: true, polaId: p.id, nilai: { ...KOSONG_SLOT, urutan: String((p.slot?.length ?? 0) + 1) } }) }}>
                  <Plus size={16} /> Slot
                </Button>
                <button type="button" aria-label={`Ubah pola ${p.nama}`}
                  onClick={() => { setGalatPola({}); setPola({ buka: true, id: p.id, nilai: { nama: p.nama, hari: (p.hari ?? []).map((h) => h.hari) } }) }}
                  className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                  <Pencil size={16} />
                </button>
                <button type="button" aria-label={`Hapus pola ${p.nama}`} onClick={() => setHapusPola(p)}
                  className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-app-soft text-left">
                  <th className="px-3 py-2 text-xs font-bold uppercase text-muted">Urutan</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase text-muted">Label</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase text-muted">Tipe</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase text-muted">Jam</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase text-muted">Jam Ke</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase text-muted">Jadwal</th>
                  {bolehKelola && <th className="w-24 px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {(p.slot ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="tnum px-3 py-2">{s.urutan}</td>
                    <td className="px-3 py-2 font-semibold text-strong">{s.label}</td>
                    <td className="px-3 py-2">
                      <StatusBadge varian={s.tipe === 'pelajaran' ? 'hadir' : 'cuti'}>{s.tipe}</StatusBadge>
                    </td>
                    <td className="tnum px-3 py-2">{s.jam_mulai}–{s.jam_selesai}</td>
                    <td className="tnum px-3 py-2">{s.jam_ke ?? '—'}</td>
                    <td className="tnum px-3 py-2">{s.jumlah_jadwal ?? 0}</td>
                    {bolehKelola && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button type="button" aria-label={`Ubah slot ${s.label}`}
                            onClick={() => { setGalatSlot({}); setSlot({ buka: true, polaId: p.id, id: s.id, nilai: { urutan: String(s.urutan), tipe: s.tipe, label: s.label, jam_mulai: s.jam_mulai, jam_selesai: s.jam_selesai, jam_ke: s.jam_ke === null ? '' : String(s.jam_ke) } }) }}
                            className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                            <Pencil size={16} />
                          </button>
                          <button type="button" aria-label={`Hapus slot ${s.label}`} onClick={() => setHapusSlot(s)}
                            className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <Modal terbuka={pola.buka} lebar="sm" judul={pola.id ? 'Ubah Pola Jam' : 'Tambah Pola Jam'}
        keterangan="Hari yang sudah dipakai pola lain pada semester ini akan ditolak (BR-05)."
        onTutup={() => setPola({ buka: false, nilai: KOSONG_POLA })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setPola({ buka: false, nilai: KOSONG_POLA })}>Batal</Button>
            <Button memuat={simpanPola.isPending} onClick={() => simpanPola.mutate(pola)}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <BidangTeks label="Nama Pola" id="pola-nama" wajib nilai={pola.nilai.nama}
            pesanError={galatPola.nama} placeholder="Senin–Kamis"
            onUbah={(v) => setPola((s) => ({ ...s, nilai: { ...s.nilai, nama: v } }))} />

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-strong">Hari berlaku</legend>
            <div className="grid grid-cols-2 gap-2">
              {OPSI_HARI.map((h) => (
                <label key={h.nilai} className="flex items-center gap-2 text-sm text-strong">
                  <input type="checkbox" checked={pola.nilai.hari.includes(h.nilai)}
                    onChange={(e) =>
                      setPola((s) => ({
                        ...s,
                        nilai: {
                          ...s.nilai,
                          hari: e.target.checked ? [...s.nilai.hari, h.nilai] : s.nilai.hari.filter((x) => x !== h.nilai),
                        },
                      }))
                    } />
                  {h.label}
                </label>
              ))}
            </div>
            {galatPola.hari && <p className="mt-2 text-xs font-semibold text-danger">{galatPola.hari}</p>}
          </fieldset>
        </div>
      </Modal>

      <Modal terbuka={slot !== null} lebar="sm" judul={slot?.id ? 'Ubah Slot Jam' : 'Tambah Slot Jam'}
        onTutup={() => setSlot(null)}
        footer={
          <>
            <Button varian="ghost" onClick={() => setSlot(null)}>Batal</Button>
            <Button memuat={simpanSlot.isPending} onClick={() => slot && simpanSlot.mutate(slot)}>Simpan</Button>
          </>
        }
      >
        {slot && (
          <div className="grid gap-4 sm:grid-cols-2">
            <BidangTeks label="Urutan" id="s-urutan" tipe="number" wajib nilai={slot.nilai.urutan}
              pesanError={galatSlot.urutan}
              onUbah={(v) => setSlot((s) => (s ? { ...s, nilai: { ...s.nilai, urutan: v } } : s))} />
            <BidangPilihan label="Tipe" id="s-tipe" wajib opsi={OPSI_TIPE_SLOT} nilai={slot.nilai.tipe}
              pesanError={galatSlot.tipe} kosongLabel="— Pilih —"
              onUbah={(v) => setSlot((s) => (s ? { ...s, nilai: { ...s.nilai, tipe: v } } : s))} />
            <BidangTeks label="Label" id="s-label" wajib nilai={slot.nilai.label} pesanError={galatSlot.label}
              className="sm:col-span-2"
              onUbah={(v) => setSlot((s) => (s ? { ...s, nilai: { ...s.nilai, label: v } } : s))} />
            <BidangTeks label="Jam Mulai" id="s-mulai" tipe="text" wajib nilai={slot.nilai.jam_mulai}
              pesanError={galatSlot.jam_mulai} placeholder="07:00"
              onUbah={(v) => setSlot((s) => (s ? { ...s, nilai: { ...s.nilai, jam_mulai: v } } : s))} />
            <BidangTeks label="Jam Selesai" id="s-selesai" tipe="text" wajib nilai={slot.nilai.jam_selesai}
              pesanError={galatSlot.jam_selesai} placeholder="07:45"
              onUbah={(v) => setSlot((s) => (s ? { ...s, nilai: { ...s.nilai, jam_selesai: v } } : s))} />
            {slot.nilai.tipe === 'pelajaran' && (
              <BidangTeks label="Jam Ke-" id="s-jamke" tipe="number" wajib nilai={slot.nilai.jam_ke}
                pesanError={galatSlot.jam_ke} petunjuk="Harus berurutan mulai 1 tanpa bolong."
                onUbah={(v) => setSlot((s) => (s ? { ...s, nilai: { ...s.nilai, jam_ke: v } } : s))} />
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog terbuka={hapusPola !== null} judul="Hapus pola jam?"
        keterangan={hapusPola ? `Pola "${hapusPola.nama}" beserta slotnya akan dihapus.` : ''}
        labelKonfirmasi="Hapus" memuat={hapusPolaMut.isPending}
        onKonfirmasi={() => hapusPola && hapusPolaMut.mutate(hapusPola.id)} onTutup={() => setHapusPola(null)} />

      <ConfirmDialog terbuka={hapusSlot !== null} judul="Hapus slot jam?"
        keterangan={hapusSlot ? `Slot "${hapusSlot.label}" akan dihapus.` : ''}
        labelKonfirmasi="Hapus" memuat={hapusSlotMut.isPending}
        onKonfirmasi={() => hapusSlot && hapusSlotMut.mutate(hapusSlot.id)} onTutup={() => setHapusSlot(null)} />
    </div>
  )
}
