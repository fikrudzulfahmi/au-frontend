import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  BookOpen,
  Cake,
  CalendarDays,
  CircleCheck,
  Megaphone,
  TriangleAlert,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Logo } from '@/components/ui/Logo'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ApiError, pesanError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatJamLengkap, formatTanggalDari } from '@/lib/format'
import { useServerClock } from '@/lib/waktu'
import { ambilRekapTv, ambilTampilanTv } from './api'
import {
  angkaJurnal,
  bagiHalamanKelas,
  durasiMarqueeDetik,
  faktorSkalaFont,
  kelasUntukTv,
  potongTeks,
  pecahKartu,
} from './logika'
import type { KartuTv } from './logika'
import type { KartuPengumumanTv, PerizinanTv, PresensiTv, RekapTv, SekolahRingkas, TampilanTv } from './types'

interface Props {
  onKeluar: () => void
}

/** Ukuran kanvas desain TV; seluruh isi digambar pada kanvas ini lalu diskalakan. */
const LEBAR_KANVAS = 1920
const TINGGI_KANVAS = 1080

/** KP-6.9 — skala seragam mengikuti ukuran jendela, sehingga tidak ada elemen terpotong. */
function useSkalaLayar(): number {
  const [skala, setSkala] = useState(1)

  useEffect(() => {
    const hitung = () => {
      setSkala(Math.min(window.innerWidth / LEBAR_KANVAS, window.innerHeight / TINGGI_KANVAS) || 1)
    }

    hitung()
    window.addEventListener('resize', hitung)
    return () => window.removeEventListener('resize', hitung)
  }, [])

  return skala
}

/**
 * FR-TV-05..15 / KP-6.1..6.9 — layar utama TV.
 *
 * Tema terang yang sama dengan aplikasi. Fokus utama: monitoring pengisian
 * jurnal per kelas (sumber data sama dengan dasbor admin). Presensi pegawai
 * dan perizinan hanya panel tambahan. Tanpa gulir; kelas yang banyak diputar
 * per halaman. Saat koneksi putus (KP-6.5) data terakhir tetap tampil.
 */
export function LayarTv({ onKeluar }: Props) {
  const { sekarang, tersinkron } = useServerClock()
  const [rekap, setRekap] = useState<RekapTv | null>(null)
  const [tampilan, setTampilan] = useState<TampilanTv | null>(null)
  const [sekolah, setSekolah] = useState<SekolahRingkas | null>(null)
  const [terputus, setTerputus] = useState(false)
  const [pesanGalat, setPesanGalat] = useState<string | null>(null)

  const skalaLayar = useSkalaLayar()
  const faktor = faktorSkalaFont(tampilan?.skala_font ?? 'besar')
  const intervalMs = Math.max(10, tampilan?.interval_detik ?? 30) * 1000
  const rotasiMs = Math.max(3, tampilan?.rotasi_panel_detik ?? 10) * 1000

  const gayaKanvas = { transform: `scale(${skalaLayar})`, '--tv-skala': String(faktor) } as CSSProperties

  useEffect(() => {
    let hidup = true

    const muat = async (): Promise<void> => {
      try {
        const [hasilRekap, hasilTampilan] = await Promise.all([ambilRekapTv(), ambilTampilanTv()])
        if (!hidup) return
        setRekap(hasilRekap)
        setTampilan(hasilTampilan.tampilan)
        setSekolah(hasilTampilan.sekolah)
        setTerputus(false)
        setPesanGalat(null)
      } catch (error) {
        if (!hidup) return
        // Token TV dicabut/kedaluwarsa -> kembali ke halaman kode (BR-35).
        if (error instanceof ApiError && error.status === 401) {
          onKeluar()
          return
        }
        // KP-6.5 — pertahankan data terakhir, tandai terputus saja.
        setTerputus(true)
        setPesanGalat(pesanError(error))
      }
    }

    void muat()
    const id = window.setInterval(() => void muat(), intervalMs)
    return () => {
      hidup = false
      window.clearInterval(id)
    }
  }, [intervalMs, onKeluar])

  const kartu = rekap?.pengumuman.kartu ?? []
  const [indeksKartu, setIndeksKartu] = useState(0)
  const [halaman, setHalaman] = useState(0)

  const { tampil: kelasTampil, tanpaJadwal } = kelasUntukTv(rekap?.jurnal.kelas ?? [])
  const daftarHalaman = bagiHalamanKelas(pecahKartu(kelasTampil))
  const jumlahHalaman = daftarHalaman.length

  useEffect(() => {
    if (kartu.length <= 1) return
    const id = window.setInterval(() => setIndeksKartu((i) => (i + 1) % kartu.length), rotasiMs)
    return () => window.clearInterval(id)
  }, [kartu.length, rotasiMs])

  useEffect(() => {
    if (jumlahHalaman <= 1) return
    const id = window.setInterval(() => setHalaman((h) => (h + 1) % jumlahHalaman), rotasiMs)
    return () => window.clearInterval(id)
  }, [jumlahHalaman, rotasiMs])

  const halamanAktif = jumlahHalaman > 0 ? halaman % jumlahHalaman : 0
  const kelasHalaman = daftarHalaman[halamanAktif] ?? []

  const teksBerjalan = rekap?.pengumuman.teks_berjalan ?? []
  const ulangTahun = rekap?.ulang_tahun ?? { aktif: false, daftar: [] }
  const kartuAktif: KartuPengumumanTv | null =
    kartu.length > 0 ? (kartu[indeksKartu % kartu.length] ?? null) : null
  const libur = rekap?.jurnal.libur ?? null
  const totalBelum = rekap?.jurnal.belum_terisi ?? 0
  const kelasBelum = kelasTampil.filter((k) => k.belum > 0).length
  const persenSiswa = rekap?.jurnal.presensi_siswa.persen_kehadiran ?? null

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-app">
      <div
        className="relative flex h-[1080px] w-[1920px] shrink-0 flex-col gap-4 overflow-hidden bg-app p-8 text-strong"
        style={gayaKanvas}
      >
        {/* FR-TV-04 — header jam server (BR-38) */}
        <header className="card flex h-[96px] shrink-0 items-center justify-between gap-6 px-8">
          <div className="flex items-center gap-5">
            <Logo ukuran="lg" />
            <span className="h-10 w-px bg-line" aria-hidden />
            <div>
              <p className="text-[26px] font-extrabold leading-tight">{sekolah?.nama_sekolah ?? 'SIPANDU'}</p>
              <p className="text-[15px] font-medium text-muted">
                {rekap
                  ? `${rekap.server.nama_hari}, ${formatTanggalDari(rekap.server.tanggal)}`
                  : 'Memuat rekap harian…'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <IndikatorKoneksi terputus={terputus} pesan={pesanGalat} />
            <div className="text-right">
              <p className="tnum text-[46px] font-extrabold leading-none text-primary">
                {formatJamLengkap(sekarang)}
              </p>
              <p className="tnum mt-1 text-[13px] font-semibold text-muted">
                Jam server {tersinkron ? '' : '(cadangan)'} · {rekap?.server.zona ?? 'Asia/Jakarta'}
              </p>
            </div>
          </div>
        </header>

        {rekap === null ? (
          <div className="card flex min-h-0 flex-1 items-center justify-center">
            <p className="text-[22px] font-semibold text-muted">
              {terputus ? 'Menunggu koneksi ke server…' : 'Memuat rekap hari ini…'}
            </p>
          </div>
        ) : (
          <>
            {/* FR-TV-07 — monitoring jurnal: fokus utama */}
            <section className="card flex min-h-0 flex-1 flex-col gap-4 p-6">
              <div className="flex shrink-0 items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-control bg-primary-soft text-primary">
                  <BookOpen size={26} />
                </span>
                <h1 className="text-[28px] font-extrabold">Monitoring Jurnal Mengajar Hari Ini</h1>
                <div className="ml-auto flex items-center gap-3">
                  {!libur &&
                    (totalBelum > 0 ? (
                      <span className="flex items-center gap-2 rounded-full bg-danger-soft px-4 py-1.5 text-[18px] font-bold text-danger">
                        <TriangleAlert size={20} /> {totalBelum} jam belum diisi pada {kelasBelum} kelas
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 rounded-full bg-success-soft px-4 py-1.5 text-[18px] font-bold text-success">
                        <CircleCheck size={20} />
                        {kelasTampil.length > 0 ? 'Semua jurnal sudah terisi' : 'Tidak ada sesi terjadwal'}
                      </span>
                    ))}
                  {persenSiswa !== null && (
                    <span className="tnum rounded-full bg-success-soft px-4 py-1 text-[15px] font-bold text-success">
                      Kehadiran siswa {persenSiswa}%
                    </span>
                  )}
                  {jumlahHalaman > 1 && (
                    <span className="tnum rounded-full bg-gray-soft px-4 py-1 text-[15px] font-bold text-muted">
                      Halaman {halamanAktif + 1} / {jumlahHalaman}
                    </span>
                  )}
                </div>
              </div>

              {libur ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-control bg-info-soft text-info">
                  <CalendarDays size={56} />
                  <p className="text-[34px] font-extrabold">
                    Hari libur{libur.keterangan ? `: ${libur.keterangan}` : ''}
                  </p>
                  <p className="text-[20px] font-medium">Tidak ada jurnal yang wajib diisi hari ini.</p>
                </div>
              ) : (
                <>
                  <div className="grid shrink-0 grid-cols-[repeat(4,1fr)_1.4fr] gap-4">
                    {angkaJurnal(rekap).map((r, i) => (
                      <AngkaUtama
                        key={r.label}
                        label={r.label}
                        nilai={r.nilai}
                        warna={
                          i === 1 ? 'text-success' : i === 2 ? 'text-danger' : i === 3 ? 'text-info' : 'text-strong'
                        }
                      />
                    ))}
                    <PersenTerisi persen={rekap.jurnal.persen} />
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-4 gap-4">
                    {kelasHalaman.map((k) => (
                      <KartuKelasTv key={`${k.kelas.kelas_id}-${k.bagian}`} kartu={k} />
                    ))}
                  </div>

                  {tanpaJadwal > 0 && (
                    <p className="shrink-0 text-[14px] font-medium text-muted">
                      {tanpaJadwal} kelas lain tidak memiliki jadwal hari ini.
                    </p>
                  )}
                </>
              )}
            </section>

            {/* Tambahan: presensi pegawai & perizinan (daftar bergulir otomatis) */}
            <section className="grid h-[200px] shrink-0 grid-cols-[2fr_1fr] grid-rows-1 gap-4">
              <PanelPresensi presensi={rekap.presensi} />
              <PanelPerizinan perizinan={rekap.perizinan} />
            </section>

            {/* FR-TV-09/10 — pengumuman dan ulang tahun */}
            <section className="flex h-[76px] shrink-0 items-stretch gap-4">
              <div className="card flex min-w-0 flex-[3] items-center gap-5 px-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-warn-bg text-warn-text">
                  <Megaphone size={26} />
                </span>
                {kartuAktif ? (
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-[22px] font-extrabold">
                      {kartuAktif.penting && <TriangleAlert size={20} className="shrink-0 text-warn-text" />}
                      {potongTeks(kartuAktif.judul, 90)}
                    </p>
                    <p className="truncate text-[17px] text-muted">{potongTeks(kartuAktif.isi ?? '—', 160)}</p>
                  </div>
                ) : (
                  <p className="text-[18px] font-semibold text-muted">Belum ada pengumuman tayang.</p>
                )}
              </div>

              {ulangTahun.aktif && ulangTahun.daftar.length > 0 && (
                <div className="card flex w-[440px] shrink-0 flex-col justify-center gap-1 bg-purple-soft px-6">
                  <p className="flex items-center gap-2 text-[17px] font-extrabold text-purple">
                    <Cake size={20} /> Selamat Ulang Tahun
                  </p>
                  <p className="truncate text-[17px] font-semibold">
                    {ulangTahun.daftar.map((u) => u.nama).join(' · ')}
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* FR-TV-13 — teks berjalan */}
        <footer className="-mx-8 -mb-8 flex h-[44px] shrink-0 items-center overflow-hidden bg-primary">
          {teksBerjalan.length > 0 ? (
            <p
              className="tv-marquee text-[18px] font-semibold text-white"
              style={{ animationDuration: `${durasiMarqueeDetik(tampilan?.kecepatan_scroll ?? 'normal')}s` }}
            >
              {teksBerjalan.join('   •   ')}
            </p>
          ) : (
            <p className="px-8 text-[15px] font-medium text-white/70">Teks berjalan belum diatur admin.</p>
          )}
        </footer>
      </div>
    </div>
  )
}

/** KP-6.5 — indikator "terputus" tanpa mengosongkan layar. */
function IndikatorKoneksi({ terputus, pesan }: { terputus: boolean; pesan: string | null }) {
  if (!terputus) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-4 py-2 text-[14px] font-bold text-success">
        <Wifi size={16} /> Tersambung
      </span>
    )
  }

  return (
    <span
      title={pesan ?? undefined}
      className="flex items-center gap-1.5 rounded-full bg-warn-bg px-4 py-2 text-[14px] font-bold text-warn-text"
    >
      <WifiOff size={16} /> Terputus — data terakhir
    </span>
  )
}

function AngkaUtama({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="rounded-control bg-app-soft px-5 py-2">
      <p className={cn('tnum text-[38px] font-extrabold leading-none', warna)}>{nilai}</p>
      <p className="mt-1 text-[15px] font-semibold text-muted">{label}</p>
    </div>
  )
}

function PersenTerisi({ persen }: { persen: number | null }) {
  const nilai = persen === null ? 0 : Math.max(0, Math.min(100, persen))

  return (
    <div className="rounded-control bg-primary-soft px-5 py-2">
      <p className="tnum text-[38px] font-extrabold leading-none text-primary">
        {persen === null ? '—' : `${persen}%`}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-muted">Keterisian jurnal</p>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-primary" style={{ width: `${nilai}%` }} />
      </div>
    </div>
  )
}

/** Satu kartu per kelas — pola sama dengan dasbor admin; semua sesi tampil. */
function KartuKelasTv({ kartu }: { kartu: KartuTv }) {
  const { kelas, sesi, bagian, total } = kartu
  const lengkap = kelas.belum === 0

  return (
    <article
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-control border-2 bg-surface',
        lengkap ? 'border-success-soft' : 'border-danger',
      )}
    >
      <header
        className={cn(
          'flex items-center justify-between gap-2 px-4 py-3',
          lengkap ? 'bg-success-soft' : 'bg-danger-soft',
        )}
      >
        <h2 className="truncate text-[26px] font-extrabold">
          {kelas.nama}
          {total > 1 && <span className="ml-2 text-[16px] font-semibold text-muted">({bagian}/{total})</span>}
        </h2>
        <StatusBadge varian={lengkap ? 'sukses' : 'bahaya'} className="shrink-0 text-[15px]">
          {lengkap ? 'Lengkap' : `${kelas.belum} belum diisi`}
        </StatusBadge>
      </header>

      <ul className="min-h-0 flex-1 divide-y divide-line px-4">
        {sesi.map((s) => (
          <li key={`${s.jam_ke_mulai}-${s.mapel}`} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[18px] font-bold">
                {s.label_jam} · {potongTeks(s.mapel, 24)}
              </p>
              <p className="truncate text-[15px] font-medium text-muted">{s.guru}</p>
            </div>
            <StatusBadge
              varian={s.status === 'sudah' ? 'sukses' : s.status === 'berhalangan' ? 'izin' : 'bahaya'}
              className="shrink-0 text-[14px]"
            >
              {s.status === 'sudah' ? 'Sudah' : s.status === 'berhalangan' ? 'Berhalangan' : 'Belum'}
            </StatusBadge>
          </li>
        ))}
      </ul>
    </article>
  )
}

/** Daftar yang bergulir pelan dan berulang bila isinya melebihi tinggi panel (tanpa gulir manual). */
function DaftarGulir({ jumlah, children }: { jumlah: number; children: ReactNode }) {
  const wadah = useRef<HTMLDivElement>(null)
  const satu = useRef<HTMLDivElement>(null)
  const [gulir, setGulir] = useState(false)

  useLayoutEffect(() => {
    const tinggiIsi = satu.current?.offsetHeight ?? 0
    const tinggiWadah = wadah.current?.clientHeight ?? 0
    setGulir(tinggiIsi > tinggiWadah + 1)
  }, [jumlah, children])

  return (
    <div ref={wadah} className="min-h-0 flex-1 overflow-hidden">
      <div className={gulir ? 'tv-gulir' : undefined} style={{ animationDuration: `${Math.max(10, jumlah * 3)}s` }}>
        <div ref={satu}>{children}</div>
        {gulir && <div aria-hidden>{children}</div>}
      </div>
    </div>
  )
}

function RingkasanChip({ ringkasan }: { ringkasan: Array<{ label: string; nilai: number }> }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-0.5">
      {ringkasan.slice(0, 5).map((r) => (
        <span key={r.label} className="text-[15px] font-semibold text-muted">
          {r.label} <b className="tnum text-[18px] text-strong">{r.nilai}</b>
        </span>
      ))}
    </div>
  )
}

function JudulPanel({ ikon: Ikon, warna, judul }: { ikon: LucideIcon; warna: string; judul: string }) {
  return (
    <h2 className="flex shrink-0 items-center gap-2 text-[20px] font-extrabold">
      <Ikon size={22} className={warna} /> {judul}
    </h2>
  )
}

function jamPendek(jam: string | null | undefined): string {
  return jam ? jam.slice(0, 5) : '—'
}

/** Presensi pegawai: kiri yang belum presensi, kanan yang sudah (jam + tepat waktu/terlambat). */
function PanelPresensi({ presensi }: { presensi: PresensiTv }) {
  const { belum_presensi: belum, sudah_presensi: sudah } = presensi

  return (
    <div className="card flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden px-6 py-3">
      <div className="flex shrink-0 items-center gap-4">
        <JudulPanel ikon={UserCheck} warna="text-success" judul="Presensi Pegawai" />
        <RingkasanChip ringkasan={presensi.ringkasan} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-1 gap-6">
        <div className="flex min-h-0 flex-col">
          <p className="shrink-0 pb-1 text-[15px] font-extrabold text-danger">Belum presensi ({belum.length})</p>
          {belum.length === 0 ? (
            <p className="text-[16px] font-medium text-muted">Semua pegawai sudah presensi.</p>
          ) : (
            <DaftarGulir jumlah={belum.length}>
              {belum.map((p) => (
                <p key={p.nama} className="truncate py-0.5 text-[16px] font-semibold">
                  {p.nama}
                  {p.jenis_pegawai && <span className="ml-2 text-[13px] font-medium text-muted">{p.jenis_pegawai}</span>}
                </p>
              ))}
            </DaftarGulir>
          )}
        </div>

        <div className="flex min-h-0 flex-col">
          <p className="shrink-0 pb-1 text-[15px] font-extrabold text-success">Sudah presensi ({sudah.length})</p>
          {sudah.length === 0 ? (
            <p className="text-[16px] font-medium text-muted">Belum ada yang presensi.</p>
          ) : (
            <DaftarGulir jumlah={sudah.length}>
              {sudah.map((p) => {
                const telat = p.status === 'terlambat' || (p.menit_terlambat ?? 0) > 0

                return (
                  <div key={p.nama} className="flex items-center gap-3 py-0.5">
                    <span className="tnum w-[52px] shrink-0 text-[16px] font-bold text-primary">
                      {jamPendek(p.jam_masuk)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">{p.nama}</span>
                    <StatusBadge varian={telat ? 'terlambat' : 'hadir'} className="shrink-0 text-[13px]">
                      {telat
                        ? `Terlambat${(p.menit_terlambat ?? 0) > 0 ? ` ${p.menit_terlambat} mnt` : ''}`
                        : 'Tepat waktu'}
                    </StatusBadge>
                  </div>
                )
              })}
            </DaftarGulir>
          )}
        </div>
      </div>
    </div>
  )
}

function PanelPerizinan({ perizinan }: { perizinan: PerizinanTv }) {
  const daftar = perizinan.daftar

  return (
    <div className="card flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden px-6 py-3">
      <div className="flex shrink-0 items-center gap-4">
        <JudulPanel ikon={Users} warna="text-warn-text" judul="Perizinan" />
        <RingkasanChip ringkasan={perizinan.ringkasan} />
      </div>
      {daftar.length === 0 ? (
        <p className="text-[16px] font-medium text-muted">Tidak ada perizinan hari ini.</p>
      ) : (
        <DaftarGulir jumlah={daftar.length}>
          {daftar.map((z) => (
            <p key={`${z.nama}-${z.label_jenis}`} className="truncate py-0.5 text-[16px] font-semibold">
              {z.nama}
              <span className="ml-2 text-[13px] font-medium text-muted">
                {z.label_jenis}
                {perizinan.tampilkan_alasan && z.alasan ? ` · ${potongTeks(z.alasan, 30)}` : ''}
              </span>
            </p>
          ))}
        </DaftarGulir>
      )}
    </div>
  )
}
