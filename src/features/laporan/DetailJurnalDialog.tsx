import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImageOff } from 'lucide-react'

import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StatusVarian } from '@/components/ui/StatusBadge'
import { pesanError, urlFotoBerpelindung } from '@/lib/api'
import { formatTanggalDari } from '@/lib/format'
import { ambilDetailJurnal } from './api'
import type { DetailJurnal, PresensiSiswaJurnal } from './types'

/** Warna status siswa mengikuti tabel presensi (H/S/I/A/B/T). */
const VARIAN_STATUS: Record<PresensiSiswaJurnal['status'], StatusVarian> = {
  H: 'hadir',
  S: 'sakit',
  I: 'izin',
  A: 'alpa',
  B: 'alpa',
  T: 'terlambat',
}

/**
 * Foto jurnal disimpan di disk privat dan hanya dapat diambil dengan token,
 * sehingga diubah menjadi object URL lebih dulu; URL dilepas saat komponen
 * dilepas agar blob tidak menumpuk di memori.
 */
function FotoJurnal({ jalur, urutan }: { jalur: string; urutan: number }) {
  const [url, setUrl] = useState<string | null>(null)
  const [gagal, setGagal] = useState(false)

  useEffect(() => {
    let dibatalkan = false
    let dibuat: string | null = null

    urlFotoBerpelindung(jalur)
      .then((hasil) => {
        if (dibatalkan) {
          URL.revokeObjectURL(hasil)
          return
        }
        dibuat = hasil
        setUrl(hasil)
      })
      .catch(() => {
        if (!dibatalkan) setGagal(true)
      })

    return () => {
      dibatalkan = true
      if (dibuat) URL.revokeObjectURL(dibuat)
    }
  }, [jalur])

  if (gagal) {
    return (
      <div className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-card bg-app-soft text-[11px] text-muted">
        <ImageOff size={16} aria-hidden />
        Tidak tersedia
      </div>
    )
  }

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="block h-24 w-32 overflow-hidden rounded-card border border-line bg-app-soft"
      title={`Foto kegiatan ${urutan}`}
    >
      {url ? (
        <img src={url} alt={`Foto kegiatan ${urutan}`} className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-[11px] text-muted">
          Memuat…
        </span>
      )}
    </a>
  )
}

/** Satu baris "label: nilai" pada ringkasan detail jurnal. */
function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 text-muted">{label}</span>
      <span className="text-strong">{nilai || '—'}</span>
    </div>
  )
}

interface DetailJurnalDialogProps {
  /** Id jurnal yang dibuka; null berarti dialog tertutup. */
  id: number | null
  onTutup: () => void
}

/**
 * FR-LAP-07 — pratinjau read-only isi jurnal untuk admin, kepala sekolah, dan
 * wakasek kurikulum: materi, kegiatan, rekap H/S/I/A/B/T, daftar siswa, foto.
 *
 * Tanpa tombol simpan: halaman laporan tidak boleh menjadi jalan pintas
 * menyunting jurnal guru (hak itu tetap milik pengampu/guru piket).
 */
export function DetailJurnalDialog({ id, onTutup }: DetailJurnalDialogProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['laporan', 'jurnal-detail', id],
    queryFn: () => ambilDetailJurnal(id as number),
    enabled: id !== null,
    staleTime: 60_000,
  })

  const detail: DetailJurnal | undefined = data

  return (
    <Modal
      terbuka={id !== null}
      judul="Detail Jurnal"
      keterangan={
        detail
          ? `${formatTanggalDari(detail.tanggal ?? '')} · Jam ke ${detail.label_jam} · ${detail.kelas ?? '—'}`
          : 'Memuat isi jurnal…'
      }
      lebar="lg"
      onTutup={onTutup}
    >
      {isLoading && <p className="p-5 text-sm text-muted">Memuat detail jurnal…</p>}

      {error !== null && error !== undefined && (
        <p className="p-5 text-sm text-danger">{pesanError(error)}</p>
      )}

      {detail && (
        <div className="space-y-5 overflow-y-auto p-5">
          <section className="space-y-1.5">
            <Baris label="Guru" nilai={detail.guru_keterangan ?? detail.guru ?? '—'} />
            {detail.nip && <Baris label="NIP" nilai={detail.nip} />}
            <Baris
              label="Mapel"
              nilai={
                detail.kode_mapel ? `${detail.kode_mapel} — ${detail.mapel ?? ''}` : (detail.mapel ?? '')
              }
            />
          </section>

          <section className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Materi</h3>
            <p className="whitespace-pre-line text-sm text-strong">{detail.materi || '—'}</p>
            <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-muted">Kegiatan</h3>
            <p className="whitespace-pre-line text-sm text-strong">{detail.kegiatan || '—'}</p>
            {detail.catatan && (
              <>
                <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-muted">Catatan</h3>
                <p className="whitespace-pre-line text-sm text-strong">{detail.catatan}</p>
              </>
            )}
          </section>

          <section className="flex flex-wrap gap-2">
            {(['H', 'S', 'I', 'A', 'B', 'T'] as const).map((kode) => (
              <StatusBadge key={kode} varian={VARIAN_STATUS[kode]}>
                {kode}: {detail.ringkasan[kode]}
              </StatusBadge>
            ))}
          </section>

          {detail.foto.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
                Foto kegiatan ({detail.foto.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.foto.map((f) => (
                  <FotoJurnal
                    key={f.id}
                    jalur={`/laporan/jurnal/${detail.id}/foto/${f.id}`}
                    urutan={f.urutan}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
              Presensi siswa ({detail.presensi_siswa.length})
            </h3>
            {detail.presensi_siswa.length === 0 ? (
              <p className="text-sm text-muted">
                Jurnal ini tidak memuat daftar presensi siswa (belum diisi saat disimpan).
              </p>
            ) : (
              <div className="overflow-x-auto rounded-card border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-app-soft text-left text-xs uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">NIS</th>
                      <th className="px-3 py-2 font-semibold">Nama</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.presensi_siswa.map((s) => (
                      <tr key={s.siswa_id} className="border-t border-line">
                        <td className="px-3 py-2 tnum text-muted">{s.nis ?? '—'}</td>
                        <td className="px-3 py-2 text-strong">{s.nama ?? '—'}</td>
                        <td className="px-3 py-2">
                          <StatusBadge varian={VARIAN_STATUS[s.status]}>{s.label_status}</StatusBadge>
                        </td>
                        <td className="px-3 py-2 text-muted">{s.keterangan ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
