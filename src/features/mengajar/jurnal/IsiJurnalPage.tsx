import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, CheckCheck, Clock, GraduationCap, ImagePlus, Info, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { kelasInput } from '@/components/ui/FormField'
import { pesanPerBidang } from '@/lib/crud'
import { tanggalLokal } from '@/lib/format'
import { pesanError } from '@/lib/api'
import { useServerClock } from '@/lib/waktu'
import { cn } from '@/lib/cn'
import { ambilSesiHariIni, ambilSiswaKelas, isiJurnal, perbaruiJurnal } from './api'
import { LABEL_STATUS_SISWA, STATUS_SISWA } from './types'
import type { BarisPresensiSiswa, StatusSiswa } from './types'

/** Warna tombol status presensi siswa. */
const GAYA_STATUS: Record<StatusSiswa, string> = {
  H: 'bg-success-soft text-success ring-success',
  S: 'bg-purple-soft text-purple ring-purple',
  I: 'bg-info-soft text-info ring-info',
  A: 'bg-danger-soft text-danger ring-danger',
}

const MAKS_FOTO = 3

/**
 * FR-JRN-02 / FR-JRN-03 — isi jurnal dan presensi siswa dalam satu halaman.
 *
 * Sesi datang dari penanda URL (`:sesi` = `plottingMapelId-jamKeMulai`) dan tanggal
 * dari query; keduanya dipakai untuk mencocokkan sesi pada jadwal server, sehingga
 * halaman ini tidak pernah mengarang sesi sendiri (FR-JRN-06).
 */
export function IsiJurnalPage() {
  const { sesi = '' } = useParams()
  const [cari] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const klien = useQueryClient()
  const { sekarang } = useServerClock()

  const [plottingMapelId, jamKeMulai] = useMemo(() => {
    const [a, b] = sesi.split('-')

    return [Number(a), Number(b)]
  }, [sesi])

  const tanggal = cari.get('tanggal') ?? tanggalLokal(sekarang)
  const jurnalId = cari.get('jurnal')

  const [materi, setMateri] = useState('')
  const [kegiatan, setKegiatan] = useState('')
  const [catatan, setCatatan] = useState('')
  const [foto, setFoto] = useState<File[]>([])
  const [baris, setBaris] = useState<Record<number, { status: StatusSiswa; keterangan: string }>>({})
  const [galat, setGalat] = useState<Record<string, string>>({})

  const sesiHariIni = useQuery({
    queryKey: ['jurnal', 'sesi-hari-ini', tanggal],
    queryFn: () => ambilSesiHariIni(tanggal),
  })

  const sesiTerpilih = sesiHariIni.data?.data.sesi.find(
    (s) => s.plotting_mapel_id === plottingMapelId && s.jam_ke_mulai === jamKeMulai,
  )

  const siswa = useQuery({
    queryKey: ['jurnal', 'siswa-kelas', sesiTerpilih?.kelas_id, sesiHariIni.data?.data.semester.id],
    queryFn: () => ambilSiswaKelas(sesiTerpilih!.kelas_id, sesiHariIni.data!.data.semester.id),
    enabled: sesiTerpilih !== undefined,
  })

  // Daftar siswa datang default hadir (FR-JRN-03); guru hanya mengubah yang tidak hadir.
  useEffect(() => {
    if (!siswa.data) return

    setBaris((sebelum) => {
      const berikut: Record<number, { status: StatusSiswa; keterangan: string }> = {}

      for (const s of siswa.data.data) {
        berikut[s.siswa_id] = sebelum[s.siswa_id] ?? { status: 'H', keterangan: '' }
      }

      return berikut
    })
  }, [siswa.data])

  const ringkasan = useMemo(() => {
    const hitung: Record<StatusSiswa, number> = { H: 0, S: 0, I: 0, A: 0 }
    Object.values(baris).forEach((b) => {
      hitung[b.status] += 1
    })

    return hitung
  }, [baris])

  const simpan = useMutation({
    mutationFn: async () => {
      const presensi: Record<string, { status: string; keterangan: string | null }> = {}
      Object.entries(baris).forEach(([id, isi]) => {
        presensi[id] = { status: isi.status, keterangan: isi.keterangan || null }
      })

      const badan: Record<string, unknown> = {
        materi,
        kegiatan,
        catatan: catatan || null,
        presensi,
      }

      if (jurnalId) {
        return perbaruiJurnal(Number(jurnalId), badan, foto)
      }

      return isiJurnal(
        {
          ...badan,
          semester_id: sesiHariIni.data?.data.semester.id,
          plotting_mapel_id: plottingMapelId,
          tanggal,
          jam_ke_mulai: jamKeMulai,
        },
        foto,
      )
    },
    onSuccess: (hasil) => {
      toast.sukses(hasil.message ?? 'Jurnal tersimpan.')
      void klien.invalidateQueries({ queryKey: ['jurnal'] })
      navigate('/mengajar/jurnal/riwayat')
    },
    onError: (error) => {
      setGalat(pesanPerBidang(error))
      // Pesan aturan bisnis (BR-19/KP-4.6) datang sebagai message, bukan errors.
      toast.gagal(pesanError(error))
    },
  })

  function kirim() {
    setGalat({})
    simpan.mutate()
  }

  function tambahFoto(daftar: FileList | null) {
    if (!daftar) return

    const gabung = [...foto, ...Array.from(daftar)]
    if (gabung.length > MAKS_FOTO) {
      toast.gagal(`Foto kegiatan maksimal ${MAKS_FOTO} buah.`)

      return
    }

    setFoto(gabung)
  }

  if (sesiHariIni.isLoading) {
    return <p className="card p-6 text-sm text-muted">Memuat sesi…</p>
  }

  if (sesiTerpilih === undefined) {
    return (
      <EmptyState
        judul="Sesi tidak ditemukan"
        keterangan="Sesi ini tidak ada pada jadwal mengajar Anda untuk tanggal tersebut."
      />
    )
  }

  const terkunci = !sesiTerpilih.boleh_isi && !jurnalId

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        judul={jurnalId ? 'Ubah Jurnal' : 'Isi Jurnal'}
        keterangan={`${sesiTerpilih.kelas ?? '-'} · ${sesiTerpilih.mapel ?? '-'} · ${sesiTerpilih.label_jam}`}
      />

      {/* Ringkasan sesi */}
      <div className="card flex flex-wrap items-center gap-x-5 gap-y-2 p-4 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-strong">
          <CalendarDays size={15} /> {tanggal}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Clock size={15} /> {sesiTerpilih.jam_mulai}–{sesiTerpilih.jam_selesai}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted">
          <GraduationCap size={15} /> {sesiTerpilih.kode_mapel ?? '-'}
        </span>
      </div>

      {/* KP-4.6 / BR-19 — alasan tidak boleh diisi disajikan apa adanya */}
      {terkunci && (
        <div className="card flex items-start gap-3 border-l-4 border-l-pending p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-pending" />
          <div className="text-sm">
            <p className="font-semibold text-strong">Jurnal belum dapat diisi</p>
            <p className="text-muted">{sesiTerpilih.alasan ?? 'Sesi ini tidak dapat diisi.'}</p>
          </div>
        </div>
      )}

      {/* Bidang jurnal (FR-JRN-02) */}
      <div className="card space-y-4 p-4">
        <div>
          <label htmlFor="materi" className="mb-1.5 block text-sm font-semibold text-strong">
            Materi / topik <span className="text-danger">*</span>
          </label>
          <textarea
            id="materi"
            rows={2}
            value={materi}
            disabled={terkunci}
            onChange={(e) => setMateri(e.target.value)}
            className={cn(kelasInput, 'resize-y')}
            placeholder="Mis. Konsep dasar jaringan komputer"
          />
          {galat.materi && <p className="mt-1 text-xs text-danger">{galat.materi}</p>}
        </div>

        <div>
          <label htmlFor="kegiatan" className="mb-1.5 block text-sm font-semibold text-strong">
            Kegiatan pembelajaran <span className="text-danger">*</span>
          </label>
          <textarea
            id="kegiatan"
            rows={3}
            value={kegiatan}
            disabled={terkunci}
            onChange={(e) => setKegiatan(e.target.value)}
            className={cn(kelasInput, 'resize-y')}
            placeholder="Mis. Diskusi kelompok, praktik konfigurasi, presentasi hasil"
          />
          {galat.kegiatan && <p className="mt-1 text-xs text-danger">{galat.kegiatan}</p>}
        </div>

        <div>
          <label htmlFor="catatan" className="mb-1.5 block text-sm font-semibold text-strong">
            Catatan / kendala <span className="text-muted">(opsional)</span>
          </label>
          <textarea
            id="catatan"
            rows={2}
            value={catatan}
            disabled={terkunci}
            onChange={(e) => setCatatan(e.target.value)}
            className={cn(kelasInput, 'resize-y')}
            placeholder="Mis. Proyektor ruang 3 tidak menyala"
          />
        </div>

        {/* A-12 — maksimal 3 foto */}
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-strong">
            Foto kegiatan <span className="text-muted">(opsional, maksimal {MAKS_FOTO})</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <label
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-sm font-semibold text-muted',
                (foto.length >= MAKS_FOTO || terkunci) && 'pointer-events-none opacity-50',
              )}
            >
              <ImagePlus size={16} /> Tambah foto
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  tambahFoto(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>

            {foto.map((berkas, i) => (
              <span
                key={`${berkas.name}-${i}`}
                className="inline-flex items-center gap-2 rounded-xl bg-app-soft px-3 py-2 text-xs font-semibold text-strong"
              >
                {berkas.name}
                <button
                  type="button"
                  aria-label={`Buang ${berkas.name}`}
                  className="text-danger"
                  onClick={() => setFoto(foto.filter((_, j) => j !== i))}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>

          {galat.foto && <p className="mt-1 text-xs text-danger">{galat.foto}</p>}
        </div>
      </div>

      {/* Presensi siswa (FR-JRN-03) */}
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">
            Presensi Siswa {siswa.data ? `(${siswa.data.data.length})` : ''}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_SISWA.map((s) => (
              <span
                key={s}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-bold ring-1',
                  GAYA_STATUS[s],
                )}
              >
                {s}: {ringkasan[s]}
              </span>
            ))}

            <Button
              varian="secondary"
              onClick={() => {
                const semua: typeof baris = {}
                Object.entries(baris).forEach(([id, isi]) => {
                  semua[Number(id)] = { ...isi, status: 'H', keterangan: '' }
                })
                setBaris(semua)
              }}
              disabled={terkunci}
            >
              <CheckCheck size={15} /> Semua Hadir
            </Button>
          </div>
        </div>

        {siswa.isLoading && <p className="text-sm text-muted">Memuat daftar siswa…</p>}

        {siswa.data && siswa.data.data.length === 0 && (
          <p className="text-sm text-muted">
            Belum ada siswa aktif yang terplot di kelas ini pada tahun pelajaran tersebut.
          </p>
        )}

        <ul className="divide-y divide-line">
          {siswa.data?.data.map((s: BarisPresensiSiswa, i) => {
            const isi = baris[s.siswa_id] ?? { status: 'H' as StatusSiswa, keterangan: '' }

            return (
              <li key={s.siswa_id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-6 text-xs tabular-nums text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-strong">{s.nama}</span>
                  <span className="block text-xs text-muted">{s.nis ?? '-'}</span>
                </span>

                <span className="flex gap-1">
                  {STATUS_SISWA.map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={terkunci}
                      aria-pressed={isi.status === st}
                      title={LABEL_STATUS_SISWA[st]}
                      onClick={() =>
                        setBaris({
                          ...baris,
                          [s.siswa_id]: {
                            status: st,
                            keterangan: st === 'H' ? '' : isi.keterangan,
                          },
                        })
                      }
                      className={cn(
                        'h-8 w-8 rounded-lg text-xs font-bold ring-1 transition',
                        isi.status === st
                          ? GAYA_STATUS[st]
                          : 'bg-surface text-muted ring-line hover:bg-app-soft',
                        terkunci && 'opacity-50',
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </span>

                {isi.status !== 'H' && (
                  <input
                    value={isi.keterangan}
                    disabled={terkunci}
                    onChange={(e) =>
                      setBaris({
                        ...baris,
                        [s.siswa_id]: { status: isi.status, keterangan: e.target.value },
                      })
                    }
                    placeholder="Keterangan (opsional)"
                    className={cn(kelasInput, 'h-8 w-full text-xs sm:w-56')}
                  />
                )}
              </li>
            )
          })}
        </ul>

        {galat.presensi && <p className="mt-2 text-xs text-danger">{galat.presensi}</p>}
      </div>

      {/* Aksi */}
      {!terkunci && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <p className="hidden text-xs text-muted sm:block">
              Hadir {ringkasan.H} · Sakit {ringkasan.S} · Izin {ringkasan.I} · Alpa {ringkasan.A}
            </p>

            <Button
              onClick={kirim}
              disabled={simpan.isPending || materi.trim() === '' || kegiatan.trim() === ''}
            >
              <Save size={16} /> {simpan.isPending ? 'Menyimpan…' : 'Simpan Jurnal'}
            </Button>
          </div>
        </div>
      )}

      {terkunci && (
        <div className="flex justify-center">
          <StatusBadge varian={sesiTerpilih.status === 'berhalangan' ? 'izin' : 'menunggu'}>
            {sesiTerpilih.alasan ?? 'Tidak dapat diisi'}
          </StatusBadge>
        </div>
      )}
    </div>
  )
}
