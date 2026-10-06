import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Settings } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError, put } from '@/lib/api'
import { pesanPerBidang } from '@/lib/crud'

interface Sistem {
  gps_max_akurasi_m: number
  foto_max_sisi_px: number
  foto_kualitas_jpeg: number
  foto_target_maks_kb: number
}

const AWAL: Record<keyof Sistem, string> = {
  gps_max_akurasi_m: '50', foto_max_sisi_px: '800', foto_kualitas_jpeg: '65', foto_target_maks_kb: '150',
}

/** FR-LOK-05 / FR-LOK-06 — parameter teknis presensi; tidak di-hardcode di kode. */
export function PengaturanSistemPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [nilai, setNilai] = useState({ ...AWAL })
  const [galat, setGalat] = useState<Record<string, string>>({})

  const data = useQuery({
    queryKey: ['pengaturan', 'sistem'],
    queryFn: () => get<{ data: Sistem }>('/pengaturan/sistem'),
  })

  useEffect(() => {
    const s = data.data?.data
    if (!s) return
    setNilai({
      gps_max_akurasi_m: String(s.gps_max_akurasi_m),
      foto_max_sisi_px: String(s.foto_max_sisi_px),
      foto_kualitas_jpeg: String(s.foto_kualitas_jpeg),
      foto_target_maks_kb: String(s.foto_target_maks_kb),
    })
  }, [data.data])

  const simpan = useMutation({
    mutationFn: () =>
      put('/pengaturan/sistem', {
        gps_max_akurasi_m: Number(nilai.gps_max_akurasi_m),
        foto_max_sisi_px: Number(nilai.foto_max_sisi_px),
        foto_kualitas_jpeg: Number(nilai.foto_kualitas_jpeg),
        foto_target_maks_kb: Number(nilai.foto_target_maks_kb),
      }),
    onSuccess: () => { toast.sukses('Pengaturan sistem disimpan.'); setGalat({}); void qc.invalidateQueries({ queryKey: ['pengaturan', 'sistem'] }) },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengaturan Sistem"
        keterangan="Parameter teknis presensi. Nilai ini berlaku tanpa perlu deploy ulang."
        aksi={<Button memuat={simpan.isPending} onClick={() => simpan.mutate()}><Save size={17} /> Simpan</Button>}
      />

      <section className="card max-w-2xl p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-strong">
          <Settings size={18} /> Presensi & Foto
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <BidangTeks label="Akurasi GPS maksimal (meter)" id="gps" tipe="number" wajib
            nilai={nilai.gps_max_akurasi_m} pesanError={galat.gps_max_akurasi_m}
            petunjuk="Presensi ditolak bila akurasi lebih buruk dari nilai ini (FR-PRS-06)."
            onUbah={(v) => setNilai((s) => ({ ...s, gps_max_akurasi_m: v }))} />
          <BidangTeks label="Sisi terpanjang foto (piksel)" id="sisi" tipe="number" wajib
            nilai={nilai.foto_max_sisi_px} pesanError={galat.foto_max_sisi_px}
            onUbah={(v) => setNilai((s) => ({ ...s, foto_max_sisi_px: v }))} />
          <BidangTeks label="Kualitas JPEG" id="kualitas" tipe="number" wajib
            nilai={nilai.foto_kualitas_jpeg} pesanError={galat.foto_kualitas_jpeg}
            onUbah={(v) => setNilai((s) => ({ ...s, foto_kualitas_jpeg: v }))} />
          <BidangTeks label="Target ukuran foto maksimal (KB)" id="target" tipe="number" wajib
            nilai={nilai.foto_target_maks_kb} pesanError={galat.foto_target_maks_kb}
            onUbah={(v) => setNilai((s) => ({ ...s, foto_target_maks_kb: v }))} />
        </div>
      </section>
    </div>
  )
}
