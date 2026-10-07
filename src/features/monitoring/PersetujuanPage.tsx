import { useState } from 'react'
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
import type { AntreanPresensi } from '@/features/presensi/types'

/** FR-PRS-11 — antrean persetujuan presensi luar radius (dengan aksi massal). */
export function PersetujuanLuarRadiusPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [tanggal, setTanggal] = useState('')
  const [pilih, setPilih] = useState<AntreanPresensi | null>(null)
  const [catatan, setCatatan] = useState('')
  const [dipilih, setDipilih] = useState<number[]>([])

  const antrean = useQuery({
    queryKey: ['monitoring', 'antrean', tanggal],
    queryFn: () => get<{ data: AntreanPresensi[] }>('/monitoring/persetujuan-presensi', { tanggal }),
  })

  const segarkan = () => void qc.invalidateQueries({ queryKey: ['monitoring'] })

  const putuskan = useMutation({
    mutationFn: (v: { id: number; keputusan: 'disetujui' | 'ditolak' }) =>
      aksi(
        `/monitoring/presensi-harian/${v.id}/putuskan`,
        { keputusan: v.keputusan, catatan_penyetuju: catatan || null },
        'patch',
      ),
    onSuccess: () => { toast.sukses('Keputusan tersimpan.'); setPilih(null); setCatatan(''); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const massal = useMutation({
    mutationFn: (keputusan: 'disetujui' | 'ditolak') =>
      aksi<{ message: string }>('/monitoring/persetujuan-presensi/massal', {
        id: dipilih, keputusan, catatan_penyetuju: catatan || null,
      }),
    onSuccess: (hasil) => { toast.sukses(hasil.message); setDipilih([]); setCatatan(''); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const baris = antrean.data?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Persetujuan Presensi Luar Radius"
        keterangan="Presensi yang dikirim dari luar radius dan menunggu keputusan Anda (BR-17 Jalur B)."
      />

      <div className="flex flex-wrap items-end gap-2">
        <BidangTeks label="Saring tanggal" id="tanggal-antrean" tipe="date" nilai={tanggal}
          className="w-44" onUbah={setTanggal} />
        {dipilih.length > 0 && (
          <>
            <span className="text-sm text-strong">{dipilih.length} dipilih</span>
            <Button varian="secondary" memuat={massal.isPending} onClick={() => massal.mutate('ditolak')}>
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
        kunciBaris={(b) => b.presensi_id}
        kosong="Tidak ada presensi luar radius yang menunggu keputusan. Bagus!"
        pilih={{
          terpilih: dipilih,
          idBaris: (b) => b.presensi_id,
          onUbah: (id, dicentang) => setDipilih((l) => (dicentang ? [...l, Number(id)] : l.filter((x) => x !== Number(id)))),
          onSemua: (dicentang) => setDipilih(dicentang ? baris.map((b) => b.presensi_id) : []),
        }}
        kolom={[
          { kunci: 'nama', judul: 'Pegawai', render: (b) => <span className="font-bold text-strong">{b.pegawai}</span> },
          { kunci: 'tanggal', judul: 'Tanggal', render: (b) => formatTanggalDari(b.tanggal) },
          { kunci: 'jam', judul: 'Jam', render: (b) => <span className="tnum">{b.masuk_jam ?? '—'}</span> },
          { kunci: 'jarak', judul: 'Jarak', render: (b) => <span className="tnum text-xs">{formatJarak(b.masuk_jarak_m)}</span> },
          {
            kunci: 'alasan', judul: 'Alasan',
            render: (b) => <span className="text-xs text-muted">{b.masuk_alasan_luar_radius ?? '—'}</span>,
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

      <Modal terbuka={pilih !== null} judul="Tinjau Presensi Luar Radius"
        keterangan={pilih ? `${pilih.pegawai} — ${formatTanggalDari(pilih.tanggal)} ${pilih.masuk_jam ?? ''}` : ''}
        onTutup={() => setPilih(null)}
        footer={
          <>
            <Button varian="secondary" memuat={putuskan.isPending}
              onClick={() => pilih && putuskan.mutate({ id: pilih.presensi_id, keputusan: 'ditolak' })}>
              <XCircle size={17} /> Tolak
            </Button>
            <Button memuat={putuskan.isPending}
              onClick={() => pilih && putuskan.mutate({ id: pilih.presensi_id, keputusan: 'disetujui' })}>
              <CheckCircle2 size={17} /> Setujui
            </Button>
          </>
        }>
        {pilih && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs font-semibold text-muted">Jam kirim</dt><dd className="tnum font-bold text-strong">{pilih.masuk_jam ?? '—'}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Jarak</dt><dd className="tnum font-bold text-strong">{formatJarak(pilih.masuk_jarak_m)}</dd></div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-muted">Koordinat</dt>
                <dd className="tnum font-bold text-strong">
                  {pilih.masuk_lat?.toFixed(6) ?? '—'}, {pilih.masuk_lng?.toFixed(6) ?? '—'}
                </dd>
              </div>
            </dl>

            <p className="rounded-control bg-app-soft px-3 py-2 text-sm text-strong">
              <strong>Alasan pegawai:</strong> {pilih.masuk_alasan_luar_radius ?? '—'}
            </p>

            <BidangTeks label="Catatan penyetuju" id="catatan-antrean" nilai={catatan}
              petunjuk="Wajib diisi bila menolak."
              onUbah={setCatatan} />
          </div>
        )}
      </Modal>
    </div>
  )
}
