import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError } from '@/lib/api'
import { aksi } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'

interface BarisJamKerja {
  hari: number
  nama_hari: string
  is_hari_kerja: boolean
  buka_presensi: string | null
  jam_masuk: string | null
  jam_pulang: string | null
}

type PerHari = Record<number, { is_hari_kerja: boolean; buka_presensi: string; jam_masuk: string; jam_pulang: string }>

const JENIS = [
  { nilai: 'guru', label: 'Guru' },
  { nilai: 'struktural', label: 'Struktural' },
]

/** FR-LOK-04 — jam kerja per jenis pegawai per hari (acuan BR-15/BR-16/BR-24). */
export function PengaturanJamKerjaPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const toast = useToast()
  const qc = useQueryClient()

  const [jenis, setJenis] = useState('guru')
  const [perHari, setPerHari] = useState<PerHari>({})

  const jamKerja = useQuery({
    queryKey: ['jam-kerja', jenis],
    queryFn: () => get<{ data: { jenis_pegawai: string; per_hari: BarisJamKerja[] } }>('/jam-kerja', { jenis_pegawai: jenis }),
  })

  // Isi formulir dari server setiap kali jenis berubah.
  useEffect(() => {
    const data = jamKerja.data?.data.per_hari
    if (data === undefined) return

    setPerHari(
      Object.fromEntries(
        data.map((b) => [
          b.hari,
          {
            is_hari_kerja: b.is_hari_kerja,
            buka_presensi: b.buka_presensi?.slice(0, 5) ?? '',
            jam_masuk: b.jam_masuk?.slice(0, 5) ?? '',
            jam_pulang: b.jam_pulang?.slice(0, 5) ?? '',
          },
        ]),
      ),
    )
  }, [jamKerja.data, jenis])

  const simpan = useMutation({
    mutationFn: () => aksi('/jam-kerja', {
      jenis_pegawai: jenis,
      per_hari: Object.fromEntries(
        Object.entries(perHari).map(([hari, v]) => [
          hari,
          {
            is_hari_kerja: v.is_hari_kerja,
            buka_presensi: v.is_hari_kerja ? v.buka_presensi || null : null,
            jam_masuk: v.is_hari_kerja ? v.jam_masuk || null : null,
            jam_pulang: v.is_hari_kerja ? v.jam_pulang || null : null,
          },
        ]),
      ),
    }),
    onSuccess: () => { toast.sukses('Jam kerja disimpan.'); void qc.invalidateQueries({ queryKey: ['jam-kerja'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const baris = jamKerja.data?.data.per_hari ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Jam Kerja"
        keterangan="Menjadi acuan keterlambatan (tanpa toleransi), pulang cepat, dan perhitungan hari kerja. Jam kosong berarti bukan hari kerja."
        aksi={
          bolehKelola && (
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate()}>
              <Save size={17} /> Simpan
            </Button>
          )
        }
      />

      <div className="flex gap-1 rounded-control bg-surface p-1 shadow-card">
        {JENIS.map((j) => (
          <button key={j.nilai} type="button" onClick={() => setJenis(j.nilai)}
            className={`rounded-[13px] px-4 py-2 text-sm font-bold transition-colors ${jenis === j.nilai ? 'bg-primary text-white' : 'text-muted hover:bg-app-soft'}`}>
            {j.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-app-soft text-left">
              <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Hari</th>
              <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Hari Kerja</th>
              <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Buka Presensi</th>
              <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Jam Masuk</th>
              <th className="px-3 py-3 text-xs font-bold uppercase text-muted">Jam Pulang</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => {
              const nilai = perHari[b.hari]
              const kerja = nilai?.is_hari_kerja ?? false
              const ubah = (kolom: 'buka_presensi' | 'jam_masuk' | 'jam_pulang', v: string) =>
                setPerHari((s) => ({ ...s, [b.hari]: { ...s[b.hari], [kolom]: v } }))

              return (
                <tr key={b.hari} className="border-t border-line">
                  <td className="px-3 py-2 font-bold text-strong">{b.nama_hari}</td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={kerja} disabled={!bolehKelola}
                      aria-label={`Hari kerja ${b.nama_hari}`}
                      onChange={(e) => setPerHari((s) => ({ ...s, [b.hari]: { ...s[b.hari], is_hari_kerja: e.target.checked } }))} />
                  </td>
                  {(['buka_presensi', 'jam_masuk', 'jam_pulang'] as const).map((kolom) => (
                    <td key={kolom} className="px-3 py-2">
                      <input
                        type="time"
                        value={nilai?.[kolom] ?? ''}
                        disabled={!bolehKelola || !kerja}
                        aria-label={`${kolom} ${b.nama_hari}`}
                        onChange={(e) => ubah(kolom, e.target.value)}
                        className="tnum min-h-[40px] rounded-control border border-line bg-surface px-2 text-sm text-strong disabled:bg-app-soft disabled:text-muted"
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="px-1 text-xs text-muted">
        Contoh standar sekolah: guru Senin–Kamis 07.00–15.00 dan Jumat 07.00–11.30. Keterlambatan dihitung
        tanpa toleransi, dan menit dibulatkan ke atas (BR-15).
      </p>
    </div>
  )
}
