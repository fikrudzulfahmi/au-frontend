import { useState } from 'react'
import { MonitorPlay, Tv } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { FormField, kelasInput } from '@/components/ui/FormField'
import { Logo } from '@/components/ui/Logo'
import { pesanError } from '@/lib/api'
import { useSekolah } from '@/features/sekolah/useSekolah'
import { masukTv } from './api'

interface Props {
  onMasuk: () => void
}

/**
 * FR-TV-01/02/03 — halaman kode TV (BR-32).
 *
 * Kode benar -> token TV disimpan perangkat (`sipandu.tv.token`), sehingga TV
 * tidak perlu memasukkan kode lagi setelah dinyalakan ulang. Kode salah
 * berulang dikunci server; pesannya ditampilkan apa adanya.
 */
export function HalamanKodeTv({ onMasuk }: Props) {
  const { data: sekolah } = useSekolah()
  const [kode, setKode] = useState('')
  const [npsn, setNpsn] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)

  const bisaKirim = !memuat && (kode.trim().length >= 4 || npsn.trim().length >= 4)

  async function kirim(): Promise<void> {
    if (!bisaKirim) return
    setMemuat(true)
    setGalat(null)

    try {
      await masukTv(kode, npsn)
      onMasuk()
    } catch (error) {
      // BR-32 — pesan penguncian/penolakan server ditampilkan apa adanya.
      setGalat(pesanError(error))
    } finally {
      setMemuat(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 py-10 text-center">
      <Logo ukuran="lg" terang />
      <div>
        <h1 className="text-2xl font-extrabold text-white">Layar TV Sekolah</h1>
        <p className="mt-1 text-sm text-white/70">
          {sekolah?.nama_sekolah ?? 'Info sekolah belum diisi'}
        </p>
      </div>

      <form
        className="w-full max-w-sm rounded-card bg-white/5 p-6 ring-1 ring-white/10"
        onSubmit={(e) => {
          e.preventDefault()
          void kirim()
        }}
      >
        <FormField
          label="Kode TV"
          htmlFor="kode-tv"
          petunjuk="Masukkan kode TV dari admin sekolah."
        >
          <input
            id="kode-tv"
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            maxLength={32}
            autoComplete="off"
            placeholder="XXXXXXXX"
            className={`${kelasInput} tnum text-center text-lg tracking-[0.35em]`}
          />
        </FormField>

        <FormField
          label="Atau NPSN Sekolah"
          htmlFor="npsn-tv"
          petunjuk="Bila admin mengizinkan, NPSN dapat dipakai sebagai ganti kode."
          className="mt-4"
        >
          <input
            id="npsn-tv"
            value={npsn}
            onChange={(e) => setNpsn(e.target.value)}
            maxLength={16}
            autoComplete="off"
            inputMode="numeric"
            placeholder="NPSN"
            className={`${kelasInput} tnum text-center`}
          />
        </FormField>

        {galat && (
          <p
            role="alert"
            className="mt-4 rounded-control bg-danger/15 px-3 py-2 text-xs font-semibold text-danger-soft"
          >
            {galat}
          </p>
        )}

        <Button penuh className="mt-4" memuat={memuat} disabled={!bisaKirim} type="submit">
          <Tv size={17} /> Buka Layar TV
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/60">
          <MonitorPlay size={13} /> Layar ini hanya menampilkan rekap; tidak perlu akun pengguna.
        </p>
      </form>
    </div>
  )
}
