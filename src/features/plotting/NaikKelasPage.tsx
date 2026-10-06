import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, GraduationCap, StepBack } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { pesanError } from '@/lib/api'
import { aksi, master } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useSemester } from '@/features/akademik/useSemester'
import type { Kelas, TahunPelajaran } from '@/features/master/types'
import {
  LABEL_STATUS_AKHIR,
  type KeputusanWizard,
  type PratinjauWizard,
  type StatusAkhir,
} from '@/features/akademik/types'
import { LabStatusAkhir } from './komponen'

const SEMUA_STATUS: StatusAkhir[] = ['naik_kelas', 'tinggal_kelas', 'lulus', 'pindah', 'keluar']

interface HasilEksekusi {
  diproses: number
  dilewati: Array<{ siswa_id: number; alasan: string }>
  ringkasan: Record<string, number>
}

/** FR-PLK-02/03 — wizard naik kelas & kelulusan (pratinjau → konfirmasi → eksekusi). */
export function NaikKelasPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const toast = useToast()
  const { daftarTahun, tahunAktif } = useSemester()

  const [langkah, setLangkah] = useState<1 | 2 | 3>(1)
  const [asalId, setAsalId] = useState<number | null>(null)
  const [tujuanId, setTujuanId] = useState<number | null>(null)
  const [kelasAsal, setKelasAsal] = useState<number[]>([])
  const [pratinjau, setPratinjau] = useState<PratinjauWizard | null>(null)
  const [keputusan, setKeputusan] = useState<Record<number, { status_akhir: StatusAkhir; kelas_tujuan_id: number | null }>>({})
  const [hasil, setHasil] = useState<HasilEksekusi | null>(null)

  const tahunAsal = asalId ?? tahunAktif?.id ?? null

  const kelasAsalQuery = useQuery({
    queryKey: ['kelas', 'wizard-asal', tahunAsal],
    queryFn: () => master.daftar<Kelas>('/kelas', { tahun_pelajaran_id: tahunAsal, per_page: 100 }),
    enabled: tahunAsal !== null,
  })

  const kelasTujuanQuery = useQuery({
    queryKey: ['kelas', 'wizard-tujuan', tujuanId],
    queryFn: () => master.daftar<Kelas>('/kelas', { tahun_pelajaran_id: tujuanId, per_page: 100 }),
    enabled: tujuanId !== null,
  })

  const opsiTahun = (daftarTahun as TahunPelajaran[]).map((t) => ({ nilai: t.id, label: `${t.nama} (${t.status})` }))
  const kelasTujuan = kelasTujuanQuery.data?.data ?? []

  const buatPratinjau = useMutation({
    mutationFn: () =>
      aksi<{ data: PratinjauWizard }>('/plotting-kelas/wizard/pratinjau', {
        tahun_pelajaran_asal_id: tahunAsal,
        tahun_pelajaran_tujuan_id: tujuanId,
        kelas_asal_ids: kelasAsal,
      }),
    onSuccess: (respons) => {
      setPratinjau(respons.data)

      // Keputusan awal mengikuti status akhir bawaan dan saran kelas tujuan dari server.
      const awal: Record<number, { status_akhir: StatusAkhir; kelas_tujuan_id: number | null }> = {}
      respons.data.kelas.forEach((k) =>
        k.siswa.forEach((s) => {
          if (s.sudah_diproses) return
          awal[s.siswa_id] = { status_akhir: s.status_akhir_bawaan, kelas_tujuan_id: s.kelas_tujuan_saran }
        }),
      )
      setKeputusan(awal)
      setLangkah(2)
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jalankanWizard = useMutation({
    mutationFn: () => {
      const daftar: KeputusanWizard[] = Object.entries(keputusan).map(([siswaId, v]) => ({
        siswa_id: Number(siswaId),
        status_akhir: v.status_akhir,
        kelas_tujuan_id: v.kelas_tujuan_id,
      }))

      return aksi<{ message: string; data: HasilEksekusi }>('/plotting-kelas/wizard/eksekusi', {
        tahun_pelajaran_asal_id: tahunAsal,
        tahun_pelajaran_tujuan_id: tujuanId,
        kelas_asal_ids: kelasAsal,
        keputusan: daftar,
      })
    },
    onSuccess: (respons) => { setHasil(respons.data); setLangkah(3); toast.sukses(respons.message) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  /** Kelas tujuan yang layak untuk sebuah keputusan (mengikuti aturan tingkat). */
  function opsiKelasTujuan(tingkatAsal: string, status: StatusAkhir) {
    if (status === 'naik_kelas') {
      const berikut = tingkatAsal === 'X' ? 'XI' : tingkatAsal === 'XI' ? 'XII' : null
      if (berikut === null) return []
      return kelasTujuan.filter((k) => k.tingkat === berikut)
    }
    if (status === 'tinggal_kelas') return kelasTujuan.filter((k) => k.tingkat === tingkatAsal)
    return []
  }

  const ringkasanPilihan = useMemo(() => {
    const hitung: Record<string, number> = {}
    Object.values(keputusan).forEach((v) => { hitung[v.status_akhir] = (hitung[v.status_akhir] ?? 0) + 1 })
    return hitung
  }, [keputusan])

  const belumDipetakan = useMemo(
    () =>
      Object.entries(keputusan).filter(([, v]) => {
        const perluKelas = v.status_akhir === 'naik_kelas' || v.status_akhir === 'tinggal_kelas'
        return perluKelas && v.kelas_tujuan_id === null
      }).length,
    [keputusan],
  )

  if (!bolehKelola) {
    return (
      <div className="space-y-4">
        <PageHeader judul="Wizard Naik Kelas & Kelulusan" />
        <p className="card p-5 text-sm text-muted">
          Proses naik kelas hanya dapat dijalankan oleh admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Wizard Naik Kelas & Kelulusan"
        keterangan="Proses akhir tahun. Dapat dijalankan bertahap per kelas dan aman diulang — siswa yang sudah diproses tidak diproses ulang."
      />

      {/* Penanda langkah */}
      <ol className="flex flex-wrap items-center gap-2 text-xs font-bold">
        {([[1, 'Pilih Kelas'], [2, 'Tentukan Status'], [3, 'Selesai']] as const).map(([n, label]) => (
          <li key={n} className={cn('flex items-center gap-2 rounded-full px-3 py-1.5',
            langkah === n ? 'bg-primary text-white' : langkah > n ? 'bg-success-soft text-success' : 'bg-surface text-muted')}>
            <span className="tnum">{n}</span> {label}
          </li>
        ))}
      </ol>

      {langkah === 1 && (
        <>
          <div className="card grid gap-4 p-5 sm:grid-cols-2">
            <BidangTahun label="Tahun pelajaran asal (yang selesai)" id="asal" opsi={opsiTahun}
              nilai={tahunAsal ?? ''} onUbah={(v) => { setAsalId(Number(v)); setKelasAsal([]) }} />

            <BidangTahun label="Tahun pelajaran tujuan" id="tujuan" opsi={opsiTahun}
              nilai={tujuanId ?? ''} onUbah={(v) => setTujuanId(Number(v))} />
          </div>

          <section className="card p-5">
            <h2 className="text-base font-bold text-strong">Pilih kelas asal</h2>
            <p className="mt-1 text-xs text-muted">
              Kelas sudah selesai diproses ditandai. Boleh dipilih sebagian — tinggi kelas lain dapat dikerjakan kemudian.
            </p>

            <div className="mt-3 space-y-2">
              {(kelasAsalQuery.data?.data ?? []).map((k) => (
                <label key={k.id} className="flex items-center gap-3 rounded-control border border-line px-3 py-2.5">
                  <input type="checkbox" checked={kelasAsal.includes(k.id)}
                    onChange={(e) => setKelasAsal((l) => (e.target.checked ? [...l, k.id] : l.filter((x) => x !== k.id)))} />
                  <span className="font-semibold text-strong">{k.nama}</span>
                  <StatusBadge varian="izin">{k.tingkat}</StatusBadge>
                  <span className="text-xs text-muted">{k.jurusan?.kode ?? '—'}</span>
                </label>
              ))}
              {(kelasAsalQuery.data?.data ?? []).length === 0 && (
                <p className="text-sm text-muted">Tahun pelajaran ini belum memiliki kelas.</p>
              )}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button memuat={buatPratinjau.isPending}
              disabled={kelasAsal.length === 0 || tujuanId === null || tujuanId === tahunAsal}
              onClick={() => buatPratinjau.mutate()}>
              <GraduationCap size={17} /> Lanjut ke Pratinjau
            </Button>
            {tujuanId !== null && tujuanId === tahunAsal && (
              <p className="flex items-center gap-1.5 text-sm text-danger">
                <AlertTriangle size={15} /> Tahun pelajaran asal dan tujuan tidak boleh sama.
              </p>
            )}
          </div>
        </>
      )}

      {langkah === 2 && pratinjau && (
        <>
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm text-strong">
              Tujuan: <strong>{pratinjau.tahun_pelajaran_tujuan.nama}</strong>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ringkasanPilihan).map(([status, jumlah]) => (
                <StatusBadge key={status} varian="izin">
                  {LABEL_STATUS_AKHIR[status as StatusAkhir]}: {jumlah}
                </StatusBadge>
              ))}
            </div>
            {pratinjau.ringkasan.sudah_diproses > 0 && (
              <StatusBadge varian="menunggu">{pratinjau.ringkasan.sudah_diproses} sudah diproses — dilewati</StatusBadge>
            )}
          </div>

          {pratinjau.kelas.map((k) => (
            <section key={k.kelas_id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-strong">{k.nama}</h2>
                <StatusBadge varian="izin">{k.tingkat}</StatusBadge>
                <span className="tnum text-xs text-muted">{k.jumlah} siswa (L {k.jumlah_l} · P {k.jumlah_p})</span>
                {k.selesai && <StatusBadge varian="hadir">Kelas sudah selesai</StatusBadge>}
              </div>

              <DataTable
                data={k.siswa}
                kunciBaris={(s) => s.siswa_id}
                kolom={[
                  { kunci: 'nis', judul: 'NIS', render: (s) => <span className="tnum font-bold">{s.nis}</span> },
                  { kunci: 'nama', judul: 'Nama', render: (s) => s.nama ?? '—' },
                  {
                    kunci: 'sekarang', judul: 'Status Sekarang',
                    render: (s) => <LabStatusAkhir nilai={s.status_akhir} sudahDiproses={s.sudah_diproses} />,
                    sembunyiMobile: true,
                  },
                  {
                    kunci: 'status', judul: 'Status Akhir',
                    render: (s) =>
                      s.sudah_diproses ? (
                        <span className="text-xs text-muted">Sudah diproses — dilewati</span>
                      ) : (
                        <select
                          aria-label={`Status akhir ${s.nama}`}
                          value={keputusan[s.siswa_id]?.status_akhir ?? s.status_akhir_bawaan}
                          onChange={(e) =>
                            setKeputusan((lama) => ({
                              ...lama,
                              [s.siswa_id]: {
                                status_akhir: e.target.value as StatusAkhir,
                                kelas_tujuan_id:
                                  e.target.value === 'naik_kelas' || e.target.value === 'tinggal_kelas'
                                    ? lama[s.siswa_id]?.kelas_tujuan_id ?? null
                                    : null,
                              },
                            }))
                          }
                          className="min-h-[40px] rounded-control border border-line bg-surface px-2 text-sm text-strong"
                        >
                          {SEMUA_STATUS.filter((st) => !(k.tingkat === 'XII' && st === 'naik_kelas')).map((st) => (
                            <option key={st} value={st}>{LABEL_STATUS_AKHIR[st]}</option>
                          ))}
                        </select>
                      ),
                  },
                  {
                    kunci: 'tujuan', judul: 'Kelas Tujuan',
                    render: (s) => {
                      if (s.sudah_diproses) return <span className="text-xs text-muted">—</span>

                      const pilihan = opsiKelasTujuan(k.tingkat, keputusan[s.siswa_id]?.status_akhir ?? s.status_akhir_bawaan)

                      if (pilihan.length === 0) return <span className="text-xs text-muted">Tidak diperlukan</span>

                      return (
                        <select
                          aria-label={`Kelas tujuan ${s.nama}`}
                          value={keputusan[s.siswa_id]?.kelas_tujuan_id ?? ''}
                          onChange={(e) =>
                            setKeputusan((lama) => ({
                              ...lama,
                              [s.siswa_id]: {
                                status_akhir: lama[s.siswa_id]?.status_akhir ?? s.status_akhir_bawaan,
                                kelas_tujuan_id: e.target.value === '' ? null : Number(e.target.value),
                              },
                            }))
                          }
                          className="min-h-[40px] rounded-control border border-line bg-surface px-2 text-sm text-strong"
                        >
                          <option value="">— Pilih kelas —</option>
                          {pilihan.map((p) => (<option key={p.id} value={p.id}>{p.nama}</option>))}
                        </select>
                      )
                    },
                  },
                ]}
              />
            </section>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button varian="ghost" onClick={() => setLangkah(1)}>
              <StepBack size={17} /> Kembali
            </Button>
            <Button memuat={jalankanWizard.isPending} disabled={belumDipetakan > 0}
              onClick={() => jalankanWizard.mutate()}>
              <CheckCircle2 size={17} /> Konfirmasi & Jalankan
            </Button>
            {belumDipetakan > 0 && (
              <p className="text-sm text-danger">
                {belumDipetakan} siswa belum dipilihkan kelas tujuannya.
              </p>
            )}
          </div>
        </>
      )}

      {langkah === 3 && hasil && (
        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-success">
            <CheckCircle2 size={18} /> Proses selesai
          </h2>

          <p className="text-sm text-strong">
            <strong className="tnum">{hasil.diproses}</strong> siswa diproses.
          </p>

          {Object.keys(hasil.ringkasan).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(hasil.ringkasan).map(([status, jumlah]) => (
                <StatusBadge key={status} varian="hadir">
                  {LABEL_STATUS_AKHIR[status as StatusAkhir]}: {jumlah}
                </StatusBadge>
              ))}
            </div>
          )}

          {hasil.dilewati.length > 0 && (
            <div className="rounded-control bg-warn-bg p-3">
              <p className="text-sm font-bold text-warn-text">
                {hasil.dilewati.length} siswa dilewati (sudah diproses sebelumnya)
              </p>
              <ul className="mt-1 space-y-0.5">
                {hasil.dilewati.map((d) => (
                  <li key={d.siswa_id} className="text-xs text-strong">Siswa #{d.siswa_id}: {d.alasan}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => { setLangkah(1); setPratinjau(null); setHasil(null); setKelasAsal([]) }}>
              Proses kelas lain
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

/** Pemilih tahun pelajaran ringkas (label + select). */
function BidangTahun({
  label, id, opsi, nilai, onUbah,
}: {
  label: string
  id: string
  opsi: Array<{ nilai: number; label: string }>
  nilai: number | ''
  onUbah: (nilai: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-strong">{label}</span>
      <select id={id} value={nilai} onChange={(e) => onUbah(e.target.value)}
        className="min-h-[44px] w-full rounded-control border border-line bg-surface px-3 text-sm text-strong">
        <option value="">— Pilih tahun pelajaran —</option>
        {opsi.map((o) => (<option key={o.nilai} value={o.nilai}>{o.label}</option>))}
      </select>
    </label>
  )
}
