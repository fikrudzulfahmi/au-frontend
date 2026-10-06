import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { BidangTeks } from '@/components/ui/Bidang'
import { formatTanggalDari } from '@/lib/format'
import { FotoJurnal } from './FotoJurnal'
import { ambilJurnal, riwayatJurnal } from './api'
import type { Jurnal } from './types'

/** FR-JRN-09 — riwayat jurnal milik sendiri dengan filter periode. */
export function RiwayatJurnalPage() {
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [detail, setDetail] = useState<Jurnal | null>(null)

  const riwayat = useQuery({
    queryKey: ['jurnal', 'riwayat', { dari, sampai, halaman }],
    queryFn: () => riwayatJurnal({ dari, sampai, page: halaman, per_halaman: 20 }),
  })

  const lengkap = useQuery({
    queryKey: ['jurnal', 'detail', detail?.id],
    queryFn: () => ambilJurnal(detail!.id),
    enabled: detail !== null,
  })

  const data = riwayat.data

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Jurnal Saya"
        keterangan="Catatan pembelajaran yang Anda isi beserta presensi siswanya."
      />

      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <BidangTeks
          label="Dari tanggal"
          id="j-dari"
          tipe="date"
          nilai={dari}
          onUbah={(v) => {
            setDari(v)
            setHalaman(1)
          }}
        />
        <BidangTeks
          label="Sampai tanggal"
          id="j-sampai"
          tipe="date"
          nilai={sampai}
          onUbah={(v) => {
            setSampai(v)
            setHalaman(1)
          }}
        />
      </div>

      {riwayat.isLoading && <p className="card p-5 text-sm text-muted">Memuat riwayat…</p>}

      {riwayat.isError && (
        <p className="card p-5 text-sm text-danger">Riwayat jurnal tidak dapat dimuat.</p>
      )}

      {data && data.data.length === 0 && (
        <EmptyState
          judul="Belum ada jurnal"
          keterangan="Jurnal yang Anda isi akan muncul di sini."
          icon={BookOpen}
        />
      )}

      {data && data.data.length > 0 && (
        <div className="card p-4">
          <DataTable
            data={data.data}
            kunciBaris={(j) => j.id}
            kolom={[
              {
                kunci: 'aksi',
                judul: '',
                className: 'w-20 text-right',
                render: (j) => (
                  <Button ukuran="sm" varian="secondary" onClick={() => setDetail(j)}>
                    Detail
                  </Button>
                ),
              },
              {
                kunci: 'tanggal',
                judul: 'Tanggal',
                render: (j) => (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-strong">
                    <CalendarDays size={14} className="text-muted" />
                    {formatTanggalDari(j.tanggal)}
                  </span>
                ),
              },
              { kunci: 'jam', judul: 'Jam', render: (j) => j.label_jam },
              { kunci: 'kelas', judul: 'Kelas', sembunyiMobile: true, render: (j) => j.kelas ?? '-' },
              {
                kunci: 'mapel',
                judul: 'Mapel',
                sembunyiMobile: true,
                render: (j) => j.mapel ?? '-',
              },
              {
                kunci: 'materi',
                judul: 'Materi',
                render: (j) => <span className="line-clamp-1">{j.materi}</span>,
              },
              {
                kunci: 'presensi',
                judul: 'H/S/I/A',
                render: (j) => (
                  <span className="whitespace-nowrap tabular-nums text-xs font-semibold">
                    {j.ringkasan.H}/{j.ringkasan.S}/{j.ringkasan.I}/{j.ringkasan.A}
                  </span>
                ),
              },
              {
                kunci: 'foto',
                judul: 'Foto',
                sembunyiMobile: true,
                render: (j) =>
                  j.jumlah_foto > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <ImageIcon size={13} /> {j.jumlah_foto}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
            ]}
          />

          <Pagination
            halaman={data.meta.page}
            perHalaman={data.meta.per_page}
            total={data.meta.total}
            onUbah={setHalaman}
          />
        </div>
      )}

      <Modal
        terbuka={detail !== null}
        onTutup={() => setDetail(null)}
        judul={detail ? `Jurnal ${detail.label_jam} — ${detail.kelas ?? ''}` : 'Jurnal'}
      >
        {lengkap.isLoading && <p className="text-sm text-muted">Memuat rincian…</p>}

        {lengkap.data && (
          <div className="space-y-4 text-sm">
            <dl className="space-y-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-muted">Tanggal</dt>
                <dd className="text-strong">
                  {formatTanggalDari(lengkap.data.data.tanggal)} · {lengkap.data.data.mapel ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-muted">Materi</dt>
                <dd className="whitespace-pre-wrap text-strong">{lengkap.data.data.materi}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-muted">Kegiatan</dt>
                <dd className="whitespace-pre-wrap text-strong">{lengkap.data.data.kegiatan}</dd>
              </div>
              {lengkap.data.data.catatan && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted">Catatan</dt>
                  <dd className="whitespace-pre-wrap text-strong">{lengkap.data.data.catatan}</dd>
                </div>
              )}
            </dl>

            {lengkap.data.data.foto.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lengkap.data.data.foto.map((f) => (
                  <FotoJurnal key={f.id} fotoId={f.id} />
                ))}
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Presensi Siswa
              </p>
              <ul className="divide-y divide-line">
                {lengkap.data.data.presensi_siswa.map((p) => (
                  <li key={p.siswa_id} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="truncate text-strong">{p.nama}</span>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                      {p.status}
                      {p.keterangan ? ` · ${p.keterangan}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
