import { useState } from 'react'
import { MonitorPlay, Tv } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { FormField, kelasInput } from '@/components/ui/FormField'
import { Logo } from '@/components/ui/Logo'
import { useSekolah } from '@/features/sekolah/useSekolah'

/**
 * FR-TV-01/02 — halaman publik /tv.
 * Fase 0: hanya kerangka (input kode TV) + kerangka tata letak 16:9.
 * Fungsi token TV, polling, dan seluruh data dibangun pada Fase 6.
 */
export function TvPage() {
  const { data: sekolah } = useSekolah()
  const [kode, setKode] = useState('')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <Logo ukuran="lg" terang />
      <div>
        <h1 className="text-2xl font-extrabold text-white">Layar TV Sekolah</h1>
        <p className="mt-1 text-sm text-white/70">
          {sekolah?.nama_sekolah ?? 'Info sekolah belum diisi'}
        </p>
      </div>

      <div className="w-full max-w-sm rounded-card bg-white/5 p-6 ring-1 ring-white/10">
        <FormField label="Kode TV" htmlFor="kode-tv" petunjuk="Masukkan kode TV atau NPSN sekolah.">
          <input
            id="kode-tv"
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="XXXXXXXX"
            className={`${kelasInput} tnum text-center text-lg tracking-[0.35em]`}
          />
        </FormField>

        <Button penuh className="mt-4" disabled={kode.length < 8}>
          <Tv size={17} /> Buka Layar TV
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/60">
          <MonitorPlay size={13} /> Tampilan rekap harian akan aktif pada Fase 6.
        </p>
      </div>
    </div>
  )
}
