import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { get, post } from '@/lib/api'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import type { KecualiWFA } from '@/features/presensi/types'

interface BarisKecuali {
  id: number
  pegawai_nama: string
  pegawai_nip: string
  tanggal: string
  nama_hari: string
  jenis: string
  alasan: string
  dibuat_pada: string
}

const JENIS_KECUALI = [
  { nilai: 'masuk_kantor', label: 'Masuk Kantor' },
  { nilai: 'dinas', label: 'Dinas' },
  { nilai: 'izin', label: 'Izin' },
  { nilai: 'cuti', label: 'Cuti' },
]

export function PengaturanKecualiWFAPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const toast = useToast()
  const qc = useQueryClient()

  const [tanggalSekarang, setTanggalSekarang] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const [daftarKecuali, setDaftarKecuali] = useState<BarisKecuali[]>([])
  const [pegawaiId, setPegawaiId] = useState<number | null>(null)

  // Load kecualian hari ini
  const kecualiHariIni = useQuery({
    queryKey: ['kecuali-hari-ini', tanggalSekarang],
    queryFn: () =>
      get<{ data: BarisKecuali[] }>(
        `/presensi/kecuali?tanggal=${tanggalSekarang}`
      ),
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (kecualiHariIni.data?.data) {
      setDaftarKecuali(kecualiHariIni.data.data)
    } else {
      setDaftarKecuali([])
    }
  }, [kecualiHariIni.data])

  // Daftar pegawai untuk form
  const daftarPegawai = useQuery({
    queryKey: ['daftar-pegawai'],
    queryFn: () =>
      get<{ data: { id: number; nip: string; nama: string }[] }>(
        '/presensi/pegawai?aktif=true'
      ),
    refetchOnWindowFocus: false,
  })

  // Form simpan
  const [formBuka, setFormBuka] = useState<{
    pegawai_id: number
    tanggal: string
    jenis: string
    alasan: string
  }>({
    pegawai_id: 0,
    tanggal: tanggalSekarang,
    jenis: 'masuk_kantor',
    alasan: '',
  })

  const simpanKecuali = useMutation({
    mutationFn: (payload: { pegawai_id: number; tanggal: string; jenis: string; alasan: string }) =>
      post<KecualiWFA>('/presensi/kecuali', payload),
    onSuccess: () => {
      toast.sukses('Kecualian WFA disimpan.')
      void qc.invalidateQueries({ queryKey: ['kecuali-hari-ini'] })
      setFormBuka({
        pegawai_id: 0,
        tanggal: tanggalSekarang,
        jenis: 'masuk_kantor',
        alasan: '',
      })
    },
    onError: () => toast.gagal('Gagal menyimpan kecualian.'),
  })

  // Hapus kecualian
  const hapusKecuali = useMutation({
    mutationFn: (id: number) =>
      post<void>(`/presensi/kecuali/${id}/hapus`, {}),
    onSuccess: () => {
      toast.sukses('Kecualian WFA dihapus.')
      void qc.invalidateQueries({ queryKey: ['kecuali-hari-ini'] })
    },
    onError: () => toast.gagal('Gagal menghapus kecualian.'),
  })

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengaturan Kecualian WFA"
        keterangan="Atur pengecualian jadwal WFA untuk tanggal tertentu"
      />

      <div className="card p-4">
        <div className="flex gap-3 flex-wrap">
          <label className="text-sm text-muted">Tanggal</label>
          <input
            type="date"
            value={tanggalSekarang}
            onChange={(e) => {
              setTanggalSekarang(e.target.value)
              setPegawaiId(null)
            }}
            className="w-40"
          />
          <Button varian="secondary" onClick={() =>
            qc.invalidateQueries({ queryKey: ['kecuali-hari-ini'] })
          }>
            Refresh
          </Button>
        </div>
      </div>

      {bolehKelola && (
        <div className="card p-4">
          <h3 className="font-bold mb-3">
            {tanggalSekarang} — {
              daftarKecuali.length > 0
                ? daftarKecuali.length + ' kecualian aktif'
                : 'Tidak ada kecualian untuk tanggal ini'
            }
          </h3>
          {daftarKecuali.length === 0 && (
            <p className="text-sm text-muted">
              Tidak ada kecualian WFA untuk tanggal {tanggalSekarang}.
              Guru yang dijadwalkan WFA akan absen normal (hadir/terlambat).
            </p>
          )}
          {daftarKecuali.map((item) => (
            <div key={item.id} className="mt-2 p-3 bg-soft rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.pegawai_nama} ({item.pegawai_nip})</p>
                  <p className="text-xs text-muted">
                    {item.nama_hari} — {item.jenis}: {item.alasan}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    varian="ghost"
                    ukuran="sm"
                    onClick={() => hapusKecuali.mutate(item.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {bolehKelola && (
        <div className="card p-4">
          <h3 className="font-bold mb-3">Buat Kecualian WFA Baru</h3>
          <form
            className="grid gap-3"
            onSubmit={async (e: React.FormEvent) => {
              e.preventDefault()
              if (!pegawaiId) return
              await simpanKecuali.mutateAsync({
                ...formBuka,
                pegawai_id: pegawaiId,
              })
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted">Guru</label>
                <select
                  value={pegawaiId || 0}
                  onChange={(e) =>
                    setFormBuka((f) => ({ ...f, pegawai_id: Number(e.target.value) }))
                  }
                  disabled={!bolehKelola}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Pilih Guru --</option>
                  {daftarPegawai.data?.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.nip})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted">Jenis</label>
                <select
                  value={formBuka.jenis}
                  onChange={(e) =>
                    setFormBuka((f) => ({ ...f, jenis: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  {JENIS_KECUALI.map((opt) => (
                    <option key={opt.nilai} value={opt.nilai}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted">Alasan</label>
              <textarea
                value={formBuka.alasan}
                onChange={(e) =>
                  setFormBuka((f) => ({ ...f, alasan: e.target.value.trim() }))
                }
                rows={2}
                className="w-full border rounded px-3 py-2"
                placeholder="Contoh: Acara rutin sekolah..."
                disabled={!bolehKelola}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" varian="primary" disabled={!pegawaiId}>
                Simpan Kecualian
              </Button>
              <Button varian="secondary" onClick={() =>
                setFormBuka({
                  pegawai_id: 0,
                  tanggal: tanggalSekarang,
                  jenis: 'masuk_kantor',
                  alasan: '',
                })
              }>
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}