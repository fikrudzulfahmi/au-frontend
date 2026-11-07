import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Search } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError } from '@/lib/api'
import { aksi } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'

/** FR-WFA — jadwal Work From Anywhere per pegawai per hari. */
interface PegawaiWfa {
  pegawai_id: number
  nip: string
  nama: string
  jenis_pegawai: string
  jabatan: string | null
  jumlah_hari_wfa: number
  hari: Array<{ hari: number; nama_hari: string; jenis: string; label_jenis: string; jam_masuk: string | null }>
}

interface HariWfa {
  hari: number
  nama_hari: string
  ada_wfa: boolean
  jenis: 'penuh' | 'sebagian' | null
  label_jenis: string | null
  jam_masuk: string | null
  keterangan: string | null
}

interface IsianHari {
  ada_wfa: boolean
  jenis: 'penuh' | 'sebagian'
  jam_masuk: string
  keterangan: string
}

type PerHari = Record<number, IsianHari>

const JENIS = [
  { nilai: '', label: 'Semua' },
  { nilai: 'guru', label: 'Guru' },
  { nilai: 'struktural', label: 'Struktural' },
]

export function PengaturanWfaPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const toast = useToast()
  const qc = useQueryClient()

  const [cari, setCari] = useState('')
  const [jenis, setJenis] = useState('')
  const [pilih, setPilih] = useState<PegawaiWfa | null>(null)
  const [perHari, setPerHari] = useState<PerHari>({})

  const daftar = useQuery({
    queryKey: ['jadwal-wfa', 'daftar', { cari, jenis }],
    queryFn: () => get<{ data: PegawaiWfa[] }>('/jadwal-wfa', { nama: cari, jenis_pegawai: jenis }),
  })

  const sepekan = useQuery({
    queryKey: ['jadwal-wfa', 'pegawai', pilih?.pegawai_id],
    queryFn: () => get<{ data: HariWfa[] }>(`/jadwal-wfa/pegawai/${pilih!.pegawai_id}`),
    enabled: pilih !== null,
  })

  useEffect(() => {
    const data = sepekan.data?.data
    if (data === undefined) return

    setPerHari(
      Object.fromEntries(
        data.map((h) => [
          h.hari,
          {
            ada_wfa: h.ada_wfa,
            jenis: (h.jenis ?? 'sebagian') as 'penuh' | 'sebagian',
            jam_masuk: h.jam_masuk?.slice(0, 5) ?? '',
            keterangan: h.keterangan ?? '',
          },
        ]),
      ),
    )
  }, [sepekan.data])

  const simpan = useMutation({
    mutationFn: () =>
      aksi('/jadwal-wfa', {
        pegawai_id: pilih?.pegawai_id,
        per_hari: Object.fromEntries(
          Object.entries(perHari).map(([hari, v]) => [
            hari,
            {
              ada_wfa: v.ada_wfa,
              jenis: v.ada_wfa ? v.jenis : null,
              jam_masuk: v.ada_wfa && v.jenis === 'sebagian' ? v.jam_masuk || null : null,
              keterangan: v.ada_wfa ? v.keterangan || null : null,
            },
          ]),
        ),
      }),
    onSuccess: () => {
      toast.sukses('Jadwal WFA disimpan.')
      void qc.invalidateQueries({ queryKey: ['jadwal-wfa'] })
      void qc.invalidateQueries({ queryKey: ['monitoring'] })
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const baris = useMemo(() => daftar.data?.data ?? [], [daftar.data])
  const hari = sepekan.data?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Jadwal WFA"
        keterangan="Work From Anywhere per pegawai per hari. WFA Penuh membebaskan presensi; WFA Sebagian menggeser batas jam masuk."
        aksi={
          bolehKelola &&
          pilih !== null && (
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate()}>
              <Save size={17} /> Simpan
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* ---------- Pemilih pegawai ---------- */}
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-strong">Cari pegawai</span>
            <span className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Nama pegawai"
                className="min-h-[44px] w-full rounded-control border border-line bg-surface pl-9 pr-3 text-sm text-strong"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-strong">Jenis pegawai</span>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="min-h-[44px] w-full rounded-control border border-line bg-surface px-3 text-sm text-strong">
              {JENIS.map((j) => (
                <option key={j.nilai} value={j.nilai}>{j.label}</option>
              ))}
            </select>
          </label>

          <div className="card max-h-[420px] divide-y divide-line overflow-y-auto p-0">
            {baris.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">
                {daftar.isLoading ? 'Memuat…' : 'Belum ada pegawai yang dijadwalkan WFA.'}
              </p>
            )}
            {baris.map((p) => (
              <button
                key={p.pegawai_id}
                type="button"
                onClick={() => setPilih(p)}
                className={`block w-full px-3 py-2.5 text-left transition-colors ${
                  pilih?.pegawai_id === p.pegawai_id ? 'bg-info-soft' : 'hover:bg-app-soft'
                }`}>
                <span className="block text-sm font-bold text-strong">{p.nama}</span>
                <span className="tnum block text-xs text-muted">
                  {p.nip} · {p.jenis_pegawai} · {p.jumlah_hari_wfa} hari WFA
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Jadwal sepekan ---------- */}
        {pilih === null ? (
          <div className="card flex items-center justify-center p-10 text-sm text-muted">
            Pilih pegawai di sebelah kiri untuk mengatur jadwal WFA.
          </div>
        ) : (
          <div className="card overflow-x-auto p-1">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-app-soft text-left">
                  <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Hari</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase text-muted">WFA</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Jenis</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Jam Masuk</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {hari.map((h) => {
                  const nilai = perHari[h.hari]
                  const aktif = nilai?.ada_wfa ?? false
                  const sebagian = nilai?.jenis === 'sebagian'
                  const ubah = (patch: Partial<IsianHari>) =>
                    setPerHari((s) => ({ ...s, [h.hari]: { ...s[h.hari], ...patch } }))

                  return (
                    <tr key={h.hari} className="border-t border-line">
                      <td className="px-3 py-2 font-bold text-strong">{h.nama_hari}</td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={aktif}
                          disabled={!bolehKelola}
                          aria-label={`WFA ${h.nama_hari}`}
                          onChange={(e) => ubah({ ada_wfa: e.target.checked })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={nilai?.jenis ?? 'sebagian'}
                          disabled={!bolehKelola || !aktif}
                          aria-label={`Jenis WFA ${h.nama_hari}`}
                          onChange={(e) => ubah({ jenis: e.target.value as 'penuh' | 'sebagian' })}
                          className="min-h-[40px] rounded-control border border-line bg-surface px-2 text-sm text-strong disabled:bg-app-soft disabled:text-muted">
                          <option value="sebagian">WFA Sebagian</option>
                          <option value="penuh">WFA Penuh</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={nilai?.jam_masuk ?? ''}
                          disabled={!bolehKelola || !aktif || !sebagian}
                          aria-label={`Jam masuk WFA ${h.nama_hari}`}
                          onChange={(e) => ubah({ jam_masuk: e.target.value })}
                          className="tnum min-h-[40px] rounded-control border border-line bg-surface px-2 text-sm text-strong disabled:bg-app-soft disabled:text-muted"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={nilai?.keterangan ?? ''}
                          disabled={!bolehKelola || !aktif}
                          maxLength={255}
                          placeholder="Opsional"
                          aria-label={`Keterangan WFA ${h.nama_hari}`}
                          onChange={(e) => ubah({ keterangan: e.target.value })}
                          className="min-h-[40px] w-full min-w-[140px] rounded-control border border-line bg-surface px-2 text-sm text-strong disabled:bg-app-soft disabled:text-muted"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="px-1 text-xs text-muted">
        WFA Penuh: presensi hari itu tidak diperlukan dan tidak dihitung alpa. WFA Sebagian: batas masuk
        memakai jam di atas (terlambat dihitung dari jam tersebut), jam pulang tetap mengikuti Jam Kerja.
      </p>
    </div>
  )
}
