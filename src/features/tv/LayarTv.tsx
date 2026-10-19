import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
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
  sesiKartu,
} from './logika'
import type { KartuPengumumanTv, KelasJurnalTv, RekapTv, SekolahRingkas, TampilanTv } from './types'

interface Props {
  onKeluar: () => void
}

/** Ukuran kanvas desain TV; seluruh isi digambar pada kanvas ini lalu diskalakan. */
const LEBAR_KANVAS = 1920
const TINGGI_KANVAS = 1080
const MAKS_NAMA_PANEL = 8

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
  const daftarHalaman = bagiHalamanKelas(kelasTampil)
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

                  {totalBelum > 0 ? (
                    <div className="flex shrink-0 items-center gap-3 rounded-control bg-danger-soft px-5 py-3 text-danger">
                      <TriangleAlert size={24} />
                      <span className="text-[20px] font-bold">
                        {totalBelum} jam belum diisi pada {kelasBelum} kelas
                      </span>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-3 rounded-control bg-success-soft px-5 py-3 text-success">
                      <CircleCheck size={24} />
                      <span className="text-[20px] font-bold">
                        {kelasTampil.length > 0
                          ? 'Seluruh kelas dengan jadwal sudah mengisi jurnalnya.'
                          : 'Tidak ada sesi mengajar terjadwal hari ini.'}
                      </span>
                    </div>
                  )}

                  <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-4 gap-4">
                    {kelasHalaman.map((k) => (
                      <KartuKelasTv key={k.kelas_id} kelas={k} />
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

            {/* Tambahan: presensi pegawai & perizinan */}
            <section className="grid h-[130px] shrink-0 grid-cols-2 gap-4">
              <PanelTambahan
                judul="Presensi Pegawai"
                ikon={UserCheck}
                warna="text-success"
                ringkasan={rekap.presensi.ringkasan}
                nama={rekap.presensi.belum_presensi.map((p) => p.nama)}
                labelDaftar="Belum presensi"
                kosong="Semua pegawai sudah presensi."
              />
              <PanelTambahan
                judul="Perizinan"
                ikon={Users}
                warna="text-warn-text"
                ringkasan={rekap.perizinan.ringkasan}
                nama={rekap.perizinan.daftar.map(
                  (z) =>
                    `${z.nama} (${z.label_jenis}${
                      rekap.perizinan.tampilkan_alasan && z.alasan ? ` · ${potongTeks(z.alasan, 24)}` : ''
                    })`,
                )}
                labelDaftar="Hari ini"
                kosong="Tidak ada perizinan hari ini."
              />
            </section>

            {/* FR-TV-09/10 — pengumuman dan ulang tahun */}
            <section className="flex h-[88px] shrink-0 items-stretch gap-4">
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
    <div className="rounded-control bg-app-soft px-5 py-3">
      <p className={cn('tnum text-[44px] font-extrabold leading-none', warna)}>{nilai}</p>
      <p className="mt-1 text-[15px] font-semibold text-muted">{label}</p>
    </div>
  )
}

function PersenTerisi({ persen }: { persen: number | null }) {
  const nilai = persen === null ? 0 : Math.max(0, Math.min(100, persen))

  return (
    <div className="rounded-control bg-primary-soft px-5 py-3">
      <p className="tnum text-[44px] font-extrabold leading-none text-primary">
        {persen === null ? '—' : `${persen}%`}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-muted">Keterisian jurnal</p>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-primary" style={{ width: `${nilai}%` }} />
      </div>
    </div>
  )
}

/** Satu kartu per kelas — pola sama dengan dasbor admin (KartuKelasJurnal). */
function KartuKelasTv({ kelas }: { kelas: KelasJurnalTv }) {
  const { tampil, sisa } = sesiKartu(kelas.daftar)
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
          'flex items-center justify-between gap-2 px-4 py-2.5',
          lengkap ? 'bg-success-soft' : 'bg-danger-soft',
        )}
      >
        <h2 className="truncate text-[22px] font-extrabold">{kelas.nama}</h2>
        <StatusBadge varian={lengkap ? 'sukses' : 'bahaya'} className="shrink-0 text-[14px]">
          {lengkap ? 'Lengkap' : `${kelas.belum} belum diisi`}
        </StatusBadge>
      </header>

      <ul className="min-h-0 flex-1 divide-y divide-line px-4">
        {tampil.map((s) => (
          <li key={`${s.jam_ke_mulai}-${s.mapel}`} className="flex items-center justify-between gap-3 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-bold">
                {s.label_jam} · {potongTeks(s.mapel, 22)}
              </p>
              <p className="truncate text-[14px] font-medium text-muted">{s.guru}</p>
            </div>
            <StatusBadge
              varian={s.status === 'sudah' ? 'sukses' : s.status === 'berhalangan' ? 'izin' : 'bahaya'}
              className="shrink-0 text-[13px]"
            >
              {s.status === 'sudah' ? 'Sudah' : s.status === 'berhalangan' ? 'Berhalangan' : 'Belum'}
            </StatusBadge>
          </li>
        ))}
        {sisa > 0 && <li className="py-1 text-[13px] font-semibold text-muted">+{sisa} sesi lainnya</li>}
      </ul>
    </article>
  )
}

interface PanelTambahanProps {
  judul: string
  ikon: LucideIcon
  warna: string
  ringkasan: Array<{ label: string; nilai: number }>
  nama: string[]
  labelDaftar: string
  kosong: string
}

/** Panel tambahan ringkas: angka + beberapa nama; sisanya dihitung. */
function PanelTambahan({ judul, ikon: Ikon, warna, ringkasan, nama, labelDaftar, kosong }: PanelTambahanProps) {
  const tampil = nama.slice(0, MAKS_NAMA_PANEL)
  const sisa = nama.length - tampil.length

  return (
    <div className="card flex min-w-0 flex-col justify-center gap-2 px-6">
      <div className="flex items-center gap-4">
        <h2 className="flex shrink-0 items-center gap-2 text-[20px] font-extrabold">
          <Ikon size={22} className={warna} /> {judul}
        </h2>
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-0.5">
          {ringkasan.slice(0, 5).map((r) => (
            <span key={r.label} className="text-[15px] font-semibold text-muted">
              {r.label} <b className="tnum text-[18px] text-strong">{r.nilai}</b>
            </span>
          ))}
        </div>
      </div>
      {nama.length === 0 ? (
        <p className="text-[16px] font-medium text-muted">{kosong}</p>
      ) : (
        <p className="truncate text-[16px] font-medium text-muted">
          <b className="text-strong">{labelDaftar}:</b> {tampil.join(' · ')}
          {sisa > 0 ? ` · +${sisa} lainnya` : ''}
        </p>
      )}
    </div>
  )
}
