import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImageOff } from 'lucide-react'

import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangTeks } from '@/components/ui/Bidang'
import { formatJarak } from '@/lib/geolokasi'
import { formatTanggalDari } from '@/lib/format'
import { ambilFotoPresensi, riwayatPresensi } from './api'
import type { Presensi } from './types'

const VARIAN_VALIDASI: Record<string, 'hadir' | 'izin' | 'menunggu' | 'alpa'> = {
  valid: 'hadir',
  disetujui: 'hadir',
  menunggu: 'izin',
  ditolak: 'alpa',
}

/** FR-PRS-12 — riwayat presensi milik sendiri. */
export function RiwayatPresensiPage() {
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [detail, setDetail] = useState<Presensi | null>(null)

  const riwayat = useQuery({
    queryKey: ['presensi', 'riwayat', { dari, sampai, halaman }],
    queryFn: () => riwayatPresensi({ dari, sampai, page: halaman, per_page: 25 }),
  })

  const data = riwayat.data

  return (
    <div className="space-y-4">
      <PageHeader judul="Riwayat Presensi" keterangan="Catatan presensi masuk dan pulang Anda." />

      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <BidangTeks label="Dari tanggal" id="dari" tipe="date" nilai={dari}
          onUbah={(v) => { setDari(v); setHalaman(1) }} />
        <BidangTeks label="Sampai tanggal" id="sampai" tipe="date" nilai={sampai}
          onUbah={(v) => { setSampai(v); setHalaman(1) }} />
      </div>

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(p) => p.id}
        kosong="Belum ada catatan presensi pada rentang ini."
        kolom={[
          { kunci: 'tanggal', judul: 'Tanggal', render: (p) => formatTanggalDari(p.tanggal) },
          { kunci: 'masuk', judul: 'Masuk', render: (p) => <span className="tnum">{p.masuk.jam ?? '—'}</span> },
          { kunci: 'pulang', judul: 'Pulang', render: (p) => <span className="tnum">{p.pulang.jam ?? '—'}</span> },
          {
            kunci: 'status',
            judul: 'Status',
            render: (p) => (
              <span className="flex flex-wrap gap-1">
                {p.masuk.status === 'terlambat' && <StatusBadge varian="menunggu">Terlambat {p.masuk.menit_terlambat}′</StatusBadge>}
                {p.masuk.status === 'hadir' && <StatusBadge varian="hadir">Hadir</StatusBadge>}
                {p.pulang.status === 'pulang_cepat' && <StatusBadge varian="menunggu">Pulang cepat {p.pulang.menit_cepat}′</StatusBadge>}
                {p.belum_pulang && <StatusBadge varian="alpa">Belum pulang</StatusBadge>}
                {p.masuk.validasi && p.masuk.validasi !== 'valid' && (
                  <StatusBadge varian={VARIAN_VALIDASI[p.masuk.validasi] ?? 'izin'}>
                    {p.masuk.validasi === 'menunggu' ? 'Menunggu' : p.masuk.validasi}
                  </StatusBadge>
                )}
                {p.dikoreksi_admin && <StatusBadge varian="cuti">Dikoreksi</StatusBadge>}
              </span>
            ),
          },
          { kunci: 'jarak', judul: 'Jarak', render: (p) => <span className="tnum text-xs">{formatJarak(p.masuk.jarak_m)}</span>, sembunyiMobile: true },
          {
            kunci: 'aksi',
            judul: 'Aksi',
            className: 'w-20',
            render: (p) => (
              <button type="button" onClick={() => setDetail(p)}
                className="text-sm font-semibold text-link">
                Detail
              </button>
            ),
          },
        ]}
      />

      <Pagination halaman={data?.meta.page ?? 1} perHalaman={data?.meta.per_page ?? 25}
        total={data?.meta.total ?? 0} onUbah={setHalaman} />

      <DetailPresensi presensi={detail} onTutup={() => setDetail(null)} />
    </div>
  )
}

/** Menampilkan foto dan koordinat satu presensi. */
function DetailPresensi({ presensi, onTutup }: { presensi: Presensi | null; onTutup: () => void }) {
  return (
    <Modal terbuka={presensi !== null} judul="Detail Presensi"
      keterangan={presensi ? formatTanggalDari(presensi.tanggal) : ''} onTutup={onTutup}>
      {presensi && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {(['masuk', 'pulang'] as const).map((sisi) => (
              <div key={sisi} className="rounded-control border border-line p-3">
                <h3 className="text-sm font-bold capitalize text-strong">{sisi}</h3>
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between"><dt className="text-muted">Jam</dt><dd className="tnum font-semibold text-strong">{presensi[sisi].jam ?? '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Jarak</dt><dd className="tnum font-semibold text-strong">{formatJarak(presensi[sisi].jarak_m)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Akurasi GPS</dt><dd className="tnum font-semibold text-strong">{presensi[sisi].akurasi_m ? `± ${presensi[sisi].akurasi_m} m` : '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Lokasi</dt><dd className="font-semibold text-strong">{presensi[sisi].lokasi ?? 'Luar radius'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Validasi</dt><dd className="font-semibold text-strong">{presensi[sisi].validasi ?? '—'}</dd></div>
                </dl>
                {presensi[sisi].alasan_luar_radius && (
                  <p className="mt-2 text-xs text-muted">Alasan: {presensi[sisi].alasan_luar_radius}</p>
                )}
                <FotoPresensi presensiId={presensi.id} sisi={sisi} ada={presensi[sisi].foto} />
              </div>
            ))}
          </div>

          {presensi.catatan_penyetuju && (
            <p className="rounded-control bg-app-soft px-3 py-2 text-sm text-strong">
              Catatan penyetuju: {presensi.catatan_penyetuju}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

/** Foto diambil sebagai blob berpelindung token, lalu ditampilkan. */
function FotoPresensi({ presensiId, sisi, ada }: { presensiId: number; sisi: 'masuk' | 'pulang'; ada: boolean }) {
  const foto = useQuery({
    queryKey: ['presensi', 'foto', presensiId, sisi],
    queryFn: () => ambilFotoPresensi(presensiId, sisi),
    enabled: ada,
    staleTime: 5 * 60 * 1000,
  })

  if (!ada) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <ImageOff size={14} /> Foto tidak tersedia (mungkin sudah dihapus sesuai retensi).
      </p>
    )
  }

  if (foto.data === undefined) return <p className="mt-3 text-xs text-muted">Memuat foto…</p>

  return <img src={foto.data} alt={`Foto presensi ${sisi}`} className="mt-3 w-full rounded-control" />
}
