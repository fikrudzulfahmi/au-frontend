import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, MapPin, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError } from '@/lib/api'
import { aksi } from '@/lib/crud'
import { formatJarak } from '@/lib/geolokasi'
import { formatTanggalDari } from '@/lib/format'
import type { AntreanPresensi, SisiPresensi } from '@/features/presensi/types'
import { barisAntrean, labelSisi, type BarisAntrean } from './antrean'

/** FR-PRS-11 — antrean persetujuan presensi luar radius (dengan aksi massal). */
export function PersetujuanLuarRadiusPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [tanggal, setTanggal] = useState('')
  const [pilih, setPilih] = useState<BarisAntrean | null>(null)
  const [catatan, setCatatan] = useState('')
  const [catatanMassal, setCatatanMassal] = useState('')
  const [dipilih, setDipilih] = useState<string[]>([])

  const antrean = useQuery({
    queryKey: ['monitoring', 'antrean', tanggal],
    queryFn: () => get<{ data: AntreanPresensi[] }>('/monitoring/persetujuan-presensi', { tanggal }),
  })

  const segarkan = () => void qc.invalidateQueries({ queryKey: ['monitoring'] })

  // Satu baris tabel = satu SISI (masuk/pulang), karena `sisi` wajib ikut dikirim;
  // tanpa itu baris pulang ditolak server dan tombol terlihat "rusak".
  const baris = useMemo(() => barisAntrean(antrean.data?.data ?? []), [antrean.data])

  const putuskan = useMutation({
    mutationFn: (v: { baris: BarisAntrean; keputusan: 'disetujui' | 'ditolak' }) =>
      aksi(
        `/monitoring/presensi-harian/${v.baris.presensi_id}/putuskan`,
        {
          keputusan: v.keputusan,
          sisi: v.baris.sisi,
          catatan_penyetuju: catatan.trim() === '' ? null : catatan.trim(),
        },
        'patch',
      ),
    onSuccess: () => {
      toast.sukses('Keputusan tersimpan.')
      setPilih(null)
      setCatatan('')
      segarkan()
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const massal = useMutation({
    mutationFn: async (keputusan: 'disetujui' | 'ditolak') => {
      // Satu panggilan massal hanya memutuskan satu sisi; kelompokkan dulu.
      const terpilih = baris.filter((b) => dipilih.includes(b.kunci))
      const perSisi = new Map<SisiPresensi, number[]>()

      for (const b of terpilih) {
        perSisi.set(b.sisi, [...(perSisi.get(b.sisi) ?? []), b.presensi_id])
      }

      let berhasil = 0

      for (const [sisi, id] of perSisi) {
        const hasil = await aksi<{ data: { berhasil: number } }>('/monitoring/persetujuan-presensi/massal', {
          id,
          sisi,
          keputusan,
          catatan_penyetuju: catatanMassal.trim() === '' ? null : catatanMassal.trim(),
        })
        berhasil += hasil.data.berhasil
      }

      return berhasil
    },
    onSuccess: (berhasil) => {
      toast.sukses(`Keputusan tersimpan untuk ${berhasil} presensi.`)
      setDipilih([])
      setCatatanMassal('')
      segarkan()
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const catatanMassalKosong = catatanMassal.trim() === ''

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Persetujuan Presensi Luar Radius"
        keterangan="Presensi yang dikirim dari luar zona dan menunggu keputusan Anda (BR-17 Jalur B). Baris Masuk dan Pulang diputuskan terpisah."
      />

      <div className="flex flex-wrap items-end gap-2">
        <BidangTeks label="Saring tanggal" id="tanggal-antrean" tipe="date" nilai={tanggal}
          className="w-44" onUbah={setTanggal} />
        {dipilih.length > 0 && (
          <>
            <span className="text-sm text-strong">{dipilih.length} dipilih</span>
            <BidangTeks label="Catatan penolakan" id="catatan-massal" nilai={catatanMassal}
              petunjuk="Wajib diisi bila menolak." className="w-64"
              onUbah={setCatatanMassal} />
            <Button varian="secondary" memuat={massal.isPending} disabled={catatanMassalKosong}
              onClick={() => massal.mutate('ditolak')}>
              <XCircle size={16} /> Tolak terpilih
            </Button>
            <Button memuat={massal.isPending} onClick={() => massal.mutate('disetujui')}>
              <CheckCircle2 size={16} /> Setujui terpilih
            </Button>
          </>
        )}
      </div>

      <DataTable
        data={baris}
        kunciBaris={(b) => b.kunci}
        kosong="Tidak ada presensi luar radius yang menunggu keputusan. Bagus!"
        pilih={{
          terpilih: dipilih,
          idBaris: (b) => b.kunci,
          onUbah: (id, dicentang) =>
            setDipilih((l) => (dicentang ? [...l, String(id)] : l.filter((x) => x !== String(id)))),
          onSemua: (dicentang) => setDipilih(dicentang ? baris.map((b) => b.kunci) : []),
        }}
        kolom={[
          { kunci: 'nama', judul: 'Pegawai', render: (b) => <span className="font-bold text-strong">{b.pegawai}</span> },
          { kunci: 'tanggal', judul: 'Tanggal', render: (b) => formatTanggalDari(b.tanggal) },
          {
            kunci: 'sisi', judul: 'Sisi',
            render: (b) => (
              <span className={`text-xs font-bold ${b.sisi === 'pulang' ? 'text-link' : 'text-muted'}`}>
                {labelSisi(b.sisi)}
              </span>
            ),
          },
          { kunci: 'jam', judul: 'Jam', render: (b) => <span className="tnum">{b.jam ?? '—'}</span> },
          { kunci: 'jarak', judul: 'Jarak', render: (b) => <span className="tnum text-xs">{formatJarak(b.jarak_m)}</span> },
          {
            kunci: 'alasan', judul: 'Alasan',
            render: (b) => <span className="text-xs text-muted">{b.alasan ?? '—'}</span>,
            sembunyiMobile: true,
          },
          {
            kunci: 'aksi', judul: 'Aksi', className: 'w-20',
            render: (b) => (
              <button type="button" onClick={() => { setPilih(b); setCatatan('') }}
                className="flex items-center gap-1 text-sm font-semibold text-link">
                <MapPin size={14} /> Tinjau
              </button>
            ),
          },
        ]}
      />

      <Modal terbuka={pilih !== null}
        judul={pilih ? `Tinjau Presensi ${labelSisi(pilih.sisi)}` : 'Tinjau Presensi Luar Radius'}
        keterangan={pilih ? `${pilih.pegawai} — ${formatTanggalDari(pilih.tanggal)} ${pilih.jam ?? ''}` : ''}
        onTutup={() => { setPilih(null); setCatatan('') }}
        footer={
          <>
            <Button varian="secondary" memuat={putuskan.isPending}
              disabled={catatan.trim() === ''}
              onClick={() => pilih && putuskan.mutate({ baris: pilih, keputusan: 'ditolak' })}>
              <XCircle size={17} /> Tolak
            </Button>
            <Button memuat={putuskan.isPending}
              onClick={() => pilih && putuskan.mutate({ baris: pilih, keputusan: 'disetujui' })}>
              <CheckCircle2 size={17} /> Setujui
            </Button>
          </>
        }>
        {pilih && (
          <div className="space-y-4">
            {pilih.sisi_lain.length > 0 && (
              <p className="rounded-control bg-info-soft px-3 py-2 text-xs text-strong">
                Presensi ini juga menunggu keputusan sisi {pilih.sisi_lain.map(labelSisi).join(' & ')}.
                Setelah sisi ini diputuskan, baris berikutnya muncul di antrean.
              </p>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs font-semibold text-muted">Sisi</dt><dd className="font-bold text-strong">{labelSisi(pilih.sisi)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Jam kirim</dt><dd className="tnum font-bold text-strong">{pilih.jam ?? '—'}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Jarak</dt><dd className="tnum font-bold text-strong">{formatJarak(pilih.jarak_m)}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">NIP</dt><dd className="tnum font-bold text-strong">{pilih.nip ?? '—'}</dd></div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-muted">Koordinat</dt>
                <dd className="tnum font-bold text-strong">
                  {pilih.lat?.toFixed(6) ?? '—'}, {pilih.lng?.toFixed(6) ?? '—'}
                </dd>
              </div>
            </dl>

            <p className="rounded-control bg-app-soft px-3 py-2 text-sm text-strong">
              <strong>Alasan pegawai:</strong> {pilih.alasan ?? '—'}
            </p>

            <BidangTeks label="Catatan penyetuju" id="catatan-antrean" nilai={catatan}
              petunjuk="Wajib diisi bila menolak."
              pesanError={catatan.trim() === '' ? 'Catatan wajib diisi sebelum menolak.' : undefined}
              onUbah={setCatatan} />
          </div>
        )}
      </Modal>
    </div>
  )
}
