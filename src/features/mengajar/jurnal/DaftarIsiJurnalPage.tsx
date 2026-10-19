import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, Info, PenLine, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatTanggalDari, tanggalLokal } from '@/lib/format'
import { useServerClock } from '@/lib/waktu'
import { useAuth } from '@/features/auth/AuthContext'
import { ambilSesiHariIni } from './api'

/**
 * FR-JRN-01/02/06 — memilih sesi yang akan diisi jurnalnya.
 *
 * Pengisian terikat HARI BERJALAN: tidak ada pemilih tanggal dan tidak ada
 * tautan ke tanggal lampau, karena jurnal yang terlewat tidak dapat disusulkan.
 * Jam "hari ini" mengikuti server (`useServerClock`), dan server sendiri menolak
 * tanggal selain hari ini (`HANYA_HARI_INI`) maupun hari libur (`HARI_LIBUR`) —
 * halaman ini hanya tidak menawarkan apa yang pasti ditolak.
 *
 * Guru tetap dapat MENGUBAH jurnal lama (BR-20) lewat menu Riwayat.
 */
export function DaftarIsiJurnalPage() {
  const { user } = useAuth()
  const { sekarang } = useServerClock()
  const tanggal = tanggalLokal(sekarang)

  const sesi = useQuery({
    queryKey: ['jurnal', 'sesi', tanggal],
    queryFn: () => ambilSesiHariIni(tanggal),
  })

  const data = sesi.data?.data
  const daftar = data?.sesi ?? []
  const piket = data?.piket?.bertugas === true
  // Hari libur tidak punya kewajiban jurnal; server juga menolak pengisiannya.
  const libur = data?.libur.ada === true
  const bolehIsi = data?.boleh_isi === true
  // Sesi milik guru lain: hanya muncul bagi guru piket hari itu.
  const milikOrangLain = (pegawaiId?: number) =>
    pegawaiId !== undefined && user?.pegawai_id != null && pegawaiId !== user.pegawai_id

  const gaya: Record<string, { varian: 'hadir' | 'menunggu' | 'izin'; label: string }> = {
    sudah: { varian: 'hadir', label: 'Sudah diisi' },
    belum: { varian: 'menunggu', label: 'Belum diisi' },
    berhalangan: { varian: 'izin', label: 'Berhalangan' },
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Isi Jurnal"
        keterangan="Pilih sesi mengajar hari ini yang akan diisi jurnalnya. Jurnal yang sudah ada dapat diubah kapan saja."
      />

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <CalendarDays size={16} className="text-primary" aria-hidden />
        <span className="text-sm font-semibold text-strong">{formatTanggalDari(tanggal)}</span>
        <span className="text-xs text-muted">
          Jurnal hanya dapat diisi pada hari ini — tanggal lampau tidak dapat disusulkan.
        </span>
      </div>

      {/* Hari libur: tidak ada sesi yang wajib diisi, jadi daftar sesi tidak ditampilkan. */}
      {libur && (
        <div className="card flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pastel-blue text-primary">
            <Info size={17} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-strong">
              Hari libur{data?.libur.keterangan ? `: ${data.libur.keterangan}` : ''}
            </p>
            <p className="text-xs text-muted">Tidak ada kewajiban mengisi jurnal pada hari libur.</p>
          </div>
        </div>
      )}

      {/* Guru piket hari itu menerima daftar seluruh kelas — katakan terus terang,
          karena daftar sepanjang ini di luar jadwal mengajarnya sendiri. */}
      {piket && !libur && (
        <div className="flex items-start gap-3 rounded-control bg-primary-soft px-4 py-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-strong">
              Anda bertugas piket
              {data?.piket.nama_hari ? ` hari ${data.piket.nama_hari}` : ''} — daftar di bawah
              mencakup seluruh kelas.
            </p>
            <p className="text-xs text-muted">
              Isi jurnal kelas yang pengampunya tidak masuk — izin, sakit, alpa, atau dinas luar.
              Sesi milik guru yang sudah presensi masuk diisi oleh guru tersebut, bukan oleh piket.
            </p>
            {data?.piket.catatan ? (
              <p className="text-xs text-muted">Catatan piket: {data.piket.catatan}</p>
            ) : null}
          </div>
        </div>
      )}

      {sesi.isLoading && <p className="card p-5 text-sm text-muted">Memuat sesi…</p>}

      {/* Kegagalan permintaan disajikan apa adanya, bukan sebagai "tidak ada sesi". */}
      {sesi.isError && <p className="card p-5 text-sm text-danger">Sesi mengajar tidak dapat dimuat.</p>}

      {data && !libur && daftar.length === 0 && (
        <div className="card flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pastel-blue text-primary">
            <CalendarDays size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-strong">Tidak ada sesi mengajar hari ini</p>
            <p className="text-xs text-muted">
              Sesi berasal dari jadwal pelajaran. Hari tanpa jadwal tidak perlu diisi jurnal.
            </p>
          </div>
        </div>
      )}

      {data && !libur && daftar.length > 0 && (
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
                        {milikOrangLain(s.pegawai_id)
                          ? ` · Pengampu: ${s.guru ?? 'guru lain'}`
                          : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {milikOrangLain(s.pegawai_id) && <StatusBadge varian="dinas">Piket</StatusBadge>}
                      <StatusBadge varian={tanda.varian}>{tanda.label}</StatusBadge>
                    </div>
                  </div>

                  {/* Gerbang isi datang dari server (BR-19/KP-4.6): sesi boleh diisi
                      hanya bila harinya hari ini dan bukan hari libur. */}
                  {bolehIsi && s.boleh_isi && (
                    <Link
                      to={`/mengajar/jurnal/isi/${s.plotting_mapel_id}-${s.jam_ke_mulai}`}
                      className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-link"
                    >
                      <PenLine size={14} /> Isi Jurnal
                    </Link>
                  )}

                  {/* BR-20 — jurnal guru pemilik dapat diubah tanpa batas waktu.
                      Untuk guru piket, server menutup penyuntingan (`boleh_ubah:false`)
                      begitu pengampu presensi masuk. */}
                  {!s.boleh_isi && s.status === 'sudah' && s.jurnal_id !== null && s.boleh_ubah !== false && (
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
