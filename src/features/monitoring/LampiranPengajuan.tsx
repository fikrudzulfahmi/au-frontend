import { useEffect, useState } from 'react'
import { AlertTriangle, ExternalLink, FileText, ImageOff, Loader2 } from 'lucide-react'

import { urlFotoBerpelindung } from '@/lib/api'
import type { PengajuanIzin } from '@/features/presensi/types'

/**
 * Menampilkan lampiran pengajuan izin.
 *
 * Endpoint lampiran menuntut header `Authorization`, jadi `<a href>` biasa
 * dijawab 401 (`TIDAK_TERAUTENTIKASI`). Berkas diambil lewat instance `api`
 * (blob) lalu ditampilkan sebagai object URL.
 *
 * - Gambar  → pratinjau inline.
 * - Dokumen → tombol buka di tab baru.
 * - Kosong / berkas hilang di server → kotak peringatan, bukan area kosong.
 */
/**
 * Tautan ringkas untuk tabel: membuka lampiran lewat blob ber-token.
 * `<a href>` langsung akan dijawab 401 karena endpoint butuh header Authorization.
 */
export function TombolLampiran({ pengajuan }: { pengajuan: PengajuanIzin }) {
  const [memuat, setMemuat] = useState(false)

  if (!pengajuan.ada_lampiran) return <span className="text-xs text-muted">—</span>

  if (!pengajuan.berkas_ada) {
    return (
      <span className="text-xs font-semibold text-warn-text" title="Berkas tidak ditemukan di server">
        Hilang
      </span>
    )
  }

  const buka = async () => {
    if (!pengajuan.lampiran_url) return
    setMemuat(true)
    try {
      const hasil = await urlFotoBerpelindung(pengajuan.lampiran_url)
      window.open(hasil, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(hasil), 60_000)
    } finally {
      setMemuat(false)
    }
  }

  return (
    <button type="button" onClick={buka} disabled={memuat}
      className="text-xs font-semibold text-link hover:underline disabled:opacity-60">
      {memuat ? 'Memuat…' : 'Lihat'}
    </button>
  )
}

export function LampiranPengajuan({ pengajuan }: { pengajuan: PengajuanIzin }) {
  const [url, setUrl] = useState<string | null>(null)
  const [memuat, setMemuat] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)

  const mime = pengajuan.lampiran_mime ?? ''
  const gambar = mime.startsWith('image/')
  const adaBerkas = !!pengajuan.berkas_ada && !!pengajuan.lampiran_url

  useEffect(() => {
    if (!adaBerkas || !gambar || !pengajuan.lampiran_url) {
      setUrl(null)
      return
    }

    let hidup = true
    let objek: string | null = null
    setMemuat(true)
    setGalat(null)

    urlFotoBerpelindung(pengajuan.lampiran_url)
      .then((hasil) => {
        if (!hidup) {
          URL.revokeObjectURL(hasil)
          return
        }
        objek = hasil
        setUrl(hasil)
      })
      .catch(() => {
        if (hidup) setGalat('Gambar lampiran gagal dimuat.')
      })
      .finally(() => {
        if (hidup) setMemuat(false)
      })

    return () => {
      hidup = false
      if (objek) URL.revokeObjectURL(objek)
    }
  }, [pengajuan.id, pengajuan.lampiran_url, adaBerkas, gambar])

  const bukaDokumen = async () => {
    if (!pengajuan.lampiran_url) return

    setMemuat(true)
    setGalat(null)
    try {
      const hasil = await urlFotoBerpelindung(pengajuan.lampiran_url)
      window.open(hasil, '_blank', 'noopener,noreferrer')
      // Jangan langsung dicabut: tab baru masih memuat berkas.
      setTimeout(() => URL.revokeObjectURL(hasil), 60_000)
    } catch {
      setGalat('Lampiran gagal dibuka.')
    } finally {
      setMemuat(false)
    }
  }

  if (!pengajuan.ada_lampiran) {
    return (
      <div className="flex items-center gap-2 rounded-control border border-dashed border-line bg-surface px-3 py-3 text-sm text-muted">
        <ImageOff size={18} />
        Tidak ada lampiran yang diunggah.
      </div>
    )
  }

  if (!adaBerkas) {
    return (
      <div className="flex items-start gap-2 rounded-control border border-line bg-warn-bg px-3 py-3 text-sm text-warn-text">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <span>
          Lampiran tercatat ada, tetapi berkasnya tidak ditemukan di server. Minta pegawai mengunggah ulang.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {galat && (
        <div className="flex items-start gap-2 rounded-control border border-line bg-danger-soft px-3 py-2 text-sm text-strong">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {galat}
        </div>
      )}

      {gambar ? (
        memuat ? (
          <div className="flex h-40 items-center justify-center rounded-control border border-line bg-surface text-sm text-muted">
            <Loader2 size={18} className="mr-2 animate-spin" /> Memuat gambar…
          </div>
        ) : url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={url}
              alt="Lampiran pengajuan"
              className="max-h-80 w-auto max-w-full rounded-control border border-line object-contain"
            />
          </a>
        ) : (
          <div className="flex items-center gap-2 rounded-control border border-dashed border-line bg-surface px-3 py-3 text-sm text-muted">
            <ImageOff size={18} />
            Pratinjau gambar tidak tersedia.
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={bukaDokumen}
          disabled={memuat}
          className="inline-flex items-center gap-1.5 rounded-control bg-info-soft px-3 py-2 text-sm font-semibold text-link hover:bg-info disabled:opacity-60"
        >
          {memuat ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          Lihat Lampiran
        </button>
      )}

      {url && gambar && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-link"
        >
          <ExternalLink size={13} /> Buka ukuran penuh
        </a>
      )}
    </div>
  )
}
