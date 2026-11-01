import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, PenLine } from 'lucide-react'

import { BidangTeks } from '@/components/ui/Bidang'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatTanggalDari, tanggalLokal } from '@/lib/format'
import { ambilSesiHariIni } from './api'

/**
 * FR-JRN-01/02/06 — memilih sesi yang akan diisi jurnalnya.
 *
 * Halaman ini ada karena sebelumnya satu-satunya jalan masuk ke pengisian jurnal
 * adalah kartu "Jadwal Hari Ini" di beranda, yang HANYA menampilkan jadwal hari ini.
 * Akibatnya, pada hari tanpa jadwal mengajar — atau ketika guru lupa mengisi jurnal
 * untuk tanggal lampau padahal FR-JRN-06 mengizinkannya — tidak ada jalan sama sekali
 * untuk mencapai halaman pengisian.
 *
 * Pemilih tanggal memakai parameter `tanggal` yang sudah didukung
 * `GET /jurnal/sesi-hari-ini`. Status dan gerbang isi tetap datang dari server
 * (BR-19/BR-20), bukan dihitung di sisi klien.
 */
export function DaftarIsiJurnalPage() {
  const [tanggal, setTanggal] = useState(() => tanggalLokal(new Date()))

  const sesi = useQuery({
    queryKey: ['jurnal', 'sesi', tanggal],
    queryFn: () => ambilSesiHariIni(tanggal),
  })

  const data = sesi.data?.data
  const daftar = data?.sesi ?? []

  const gaya: Record<string, { varian: 'hadir' | 'menunggu' | 'izin'; label: string }> = {
    sudah: { varian: 'hadir', label: 'Sudah diisi' },
    belum: { varian: 'menunggu', label: 'Belum diisi' },
    berhalangan: { varian: 'izin', label: 'Berhalangan' },
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Isi Jurnal"
        keterangan="Pilih sesi mengajar yang akan diisi jurnalnya. Jurnal yang sudah ada dapat diubah kapan saja."
      />

      <div className="card p-4">
        <BidangTeks
          label="Tanggal"
          id="jurnal-tanggal"
          tipe="date"
          nilai={tanggal}
          onUbah={setTanggal}
          petunjuk="Bawaannya hari ini. Anda juga dapat mengisi jurnal untuk tanggal lampau."
        />
      </div>

      {sesi.isLoading && <p className="card p-5 text-sm text-muted">Memuat sesi…</p>}

      {/* Kegagalan permintaan disajikan apa adanya, bukan sebagai "tidak ada sesi". */}
      {sesi.isError && <p className="card p-5 text-sm text-danger">Sesi mengajar tidak dapat dimuat.</p>}

      {data && daftar.length === 0 && (
        <div className="card flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pastel-blue text-primary">
            <CalendarDays size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-strong">Tidak ada sesi mengajar pada tanggal ini</p>
            <p className="text-xs text-muted">Sesi berasal dari jadwal pelajaran. Coba pilih tanggal lain.</p>
          </div>
        </div>
      )}

      {data && daftar.length > 0 && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-strong">Sesi</h2>
            <StatusBadge varian="izin">{formatTanggalDari(data.tanggal)}</StatusBadge>
            <span className="text-xs font-semibold text-muted">
              {data.ringkasan.sudah} sudah · {data.ringkasan.belum} belum
              {data.ringkasan.berhalangan > 0 ? ` · ${data.ringkasan.berhalangan} berhalangan` : ''}
            </span>
          </div>

          <ul className="mt-3 divide-y divide-line">
            {daftar.map((s) => {
              const tanda = gaya[s.status] ?? gaya.belum

              return (
                <li key={`${s.plotting_mapel_id}-${s.jam_ke_mulai}`} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-strong">
                        {s.mapel ?? '-'} · {s.kelas ?? '-'}
                      </p>
                      <p className="text-xs text-muted">
                        {s.label_jam} · {s.jam_mulai}–{s.jam_selesai}
                      </p>
                    </div>

                    <StatusBadge varian={tanda.varian}>{tanda.label}</StatusBadge>
                  </div>

                  {/* Gerbang isi datang dari server (BR-19/KP-4.6). */}
                  {s.boleh_isi && (
                    <Link
                      to={`/mengajar/jurnal/isi/${s.plotting_mapel_id}-${s.jam_ke_mulai}?tanggal=${data.tanggal}`}
                      className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-link"
                    >
                      <PenLine size={14} /> Isi Jurnal
                    </Link>
                  )}

                  {/* BR-20 — jurnal guru pemilik dapat diubah tanpa batas waktu. */}
                  {!s.boleh_isi && s.status === 'sudah' && s.jurnal_id !== null && (
                    <Link
                      to={`/mengajar/jurnal/isi/${s.plotting_mapel_id}-${s.jam_ke_mulai}?tanggal=${data.tanggal}&jurnal=${s.jurnal_id}`}
                      className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-link"
                    >
                      <PenLine size={14} /> Ubah jurnal
                    </Link>
                  )}

                  {!s.boleh_isi && s.alasan !== null && <p className="mt-1 text-xs text-muted">{s.alasan}</p>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
