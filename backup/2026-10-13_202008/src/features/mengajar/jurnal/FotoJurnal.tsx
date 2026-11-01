import { useEffect, useState } from 'react'

import { ambilFotoJurnal } from './api'

/**
 * Foto kegiatan tersimpan di disk privat, jadi diambil sebagai blob berpelindung
 * lalu dijadikan object URL. URL dilepas kembali saat komponen dilepas.
 */
export function FotoJurnal({ fotoId }: { fotoId: number }) {
  const [url, setUrl] = useState<string | null>(null)
  const [gagal, setGagal] = useState(false)

  useEffect(() => {
    let objek: string | null = null
    let batal = false

    ambilFotoJurnal(fotoId)
      .then((hasil) => {
        if (batal) {
          URL.revokeObjectURL(hasil)

          return
        }
        objek = hasil
        setUrl(hasil)
      })
      .catch(() => setGagal(true))

    return () => {
      batal = true
      if (objek) URL.revokeObjectURL(objek)
    }
  }, [fotoId])

  if (gagal) {
    return (
      <span className="flex h-24 w-24 items-center justify-center rounded-xl bg-app-soft text-xs text-muted">
        Tidak tersedia
      </span>
    )
  }

  if (url === null) {
    return <span className="h-24 w-24 animate-pulse rounded-xl bg-app-soft" />
  }

  return (
    <img
      src={url}
      alt="Foto kegiatan jurnal"
      className="h-24 w-24 rounded-xl object-cover ring-1 ring-line"
    />
  )
}
