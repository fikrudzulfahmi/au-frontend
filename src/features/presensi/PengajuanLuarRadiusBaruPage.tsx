import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Info, Paperclip, Send } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { pesanPerBidang } from '@/lib/crud'
import { ajukanLuarRadius } from './api'

/**
 * FR-IZN-06 / FR-PRS-07 Jalur A — pengajuan presensi di luar radius mandiri.
 * Satu pengajuan berlaku untuk satu tanggal.
 */
export function PengajuanLuarRadiusBaruPage() {
  const toast = useToast()
  const navigate = useNavigate()

  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [alasan, setAlasan] = useState('')
  const [lampiran, setLampiran] = useState<File | null>(null)
  const [galat, setGalat] = useState<Record<string, string>>({})

  const simpan = useMutation({
    mutationFn: () => ajukanLuarRadius({ tanggal, alasan, lampiran }),
    onSuccess: (hasil) => { toast.sukses(hasil.message); navigate('/pengajuan') },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengajuan Presensi Luar Radius"
        keterangan="Ajukan sebelum hari-H agar presensi Anda di luar radius langsung sah tanpa menunggu persetujuan."
      />

      <div className="card space-y-4 p-5">
        <p className="flex items-start gap-2 rounded-control bg-info-soft px-3 py-2.5 text-sm text-strong">
          <Info size={16} className="mt-0.5 shrink-0 text-link" />
          Bila Anda tidak mengajukan lebih dulu, presensi di luar radius tetap diterima tetapi berstatus
          <strong className="mx-1">menunggu</strong> sampai admin memutuskan (Jalur B).
        </p>

        <BidangTeks label="Tanggal" id="tanggal" tipe="date" wajib nilai={tanggal}
          pesanError={galat.tanggal} onUbah={setTanggal} />

        <BidangTeks label="Alasan" id="alasan" wajib nilai={alasan} pesanError={galat.alasan}
          petunjuk="Contoh: mendampingi siswa mengikuti lomba di luar kota."
          onUbah={setAlasan} />

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-strong">
            Lampiran <span className="font-normal text-muted">(opsional — mis. surat tugas)</span>
          </span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => setLampiran(e.target.files?.[0] ?? null)}
            className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-strong" />
          {lampiran && (
            <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Paperclip size={13} /> {lampiran.name}
            </span>
          )}
        </label>

        <div className="flex flex-wrap gap-2">
          <Button memuat={simpan.isPending} onClick={() => simpan.mutate()}>
            <Send size={17} /> Kirim Pengajuan
          </Button>
          <Button varian="ghost" onClick={() => navigate('/pengajuan')}>Batal</Button>
        </div>
      </div>
    </div>
  )
}
