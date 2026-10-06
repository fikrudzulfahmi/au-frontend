import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Paperclip, Send } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { pesanPerBidang } from '@/lib/crud'
import { ajukanIzin } from './api'
import { OPSI_JENIS_IZIN } from './types'

/** FR-IZN-01/02 — formulir izin, sakit, dinas, dan cuti. */
export function PengajuanIzinBaruPage() {
  const toast = useToast()
  const navigate = useNavigate()

  const hariIni = new Date().toISOString().slice(0, 10)
  const [jenis, setJenis] = useState('izin')
  const [mulai, setMulai] = useState(hariIni)
  const [selesai, setSelesai] = useState(hariIni)
  const [alasan, setAlasan] = useState('')
  const [lampiran, setLampiran] = useState<File | null>(null)
  const [luarRadius, setLuarRadius] = useState(false)
  const [galat, setGalat] = useState<Record<string, string>>({})

  const simpan = useMutation({
    mutationFn: () => ajukanIzin({
      jenis,
      tanggal_mulai: mulai,
      tanggal_selesai: selesai,
      alasan,
      lampiran,
      presensi_luar_radius: jenis === 'dinas' && luarRadius,
    }),
    onSuccess: (hasil) => {
      toast.sukses(hasil.message)
      navigate('/pengajuan')
    },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengajuan Izin / Sakit / Dinas / Cuti"
        keterangan="Pengajuan akan ditinjau admin atau kepala sekolah. Izin, sakit, dan cuti yang disetujui membebaskan presensi; dinas tidak."
      />

      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <BidangPilihan label="Jenis pengajuan" id="jenis" wajib opsi={OPSI_JENIS_IZIN} nilai={jenis}
          pesanError={galat.jenis} kosongLabel="— Pilih jenis —" onUbah={setJenis} />

        <div className="hidden sm:block" />

        <BidangTeks label="Tanggal mulai" id="mulai" tipe="date" wajib nilai={mulai}
          pesanError={galat.tanggal_mulai} onUbah={setMulai} />
        <BidangTeks label="Tanggal selesai" id="selesai" tipe="date" wajib nilai={selesai}
          pesanError={galat.tanggal_selesai} petunjuk="Boleh sama dengan tanggal mulai."
          onUbah={setSelesai} />

        <div className="sm:col-span-2">
          <BidangTeks label="Alasan" id="alasan" wajib nilai={alasan} pesanError={galat.alasan}
            onUbah={setAlasan}
            petunjuk={jenis === 'sakit' ? 'Sertakan kondisi singkat; lampiran surat dokter mempercepat persetujuan.' : undefined} />
        </div>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-strong">
            Lampiran <span className="font-normal text-muted">(opsional — surat dokter / surat tugas)</span>
          </span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => setLampiran(e.target.files?.[0] ?? null)}
            className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-strong"
          />
          {lampiran && (
            <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Paperclip size={13} /> {lampiran.name} ({(lampiran.size / 1024).toFixed(0)} KB)
            </span>
          )}
          {galat.lampiran && <span className="mt-1 block text-xs font-semibold text-danger">{galat.lampiran}</span>}
        </label>

        {jenis === 'dinas' && (
          <label className="flex items-start gap-2.5 rounded-control bg-app-soft px-3 py-3 sm:col-span-2">
            <input type="checkbox" checked={luarRadius} onChange={(e) => setLuarRadius(e.target.checked)} className="mt-0.5" />
            <span className="text-sm text-strong">
              <strong>Presensi dari luar radius</strong>
              <span className="mt-0.5 block text-xs text-muted">
                Bila disetujui, sistem otomatis menyetujui presensi luar radius untuk setiap hari kerja pada
                rentang tanggal tersebut, sehingga presensi Anda langsung sah (FR-IZN-02, BR-17).
              </span>
            </span>
          </label>
        )}

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button memuat={simpan.isPending} onClick={() => simpan.mutate()}>
            <Send size={17} /> Kirim Pengajuan
          </Button>
          <Button varian="ghost" onClick={() => navigate('/pengajuan')}>Batal</Button>
        </div>
      </div>
    </div>
  )
}
