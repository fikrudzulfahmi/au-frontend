import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BookOpen,
  Cake,
  Clock,
  Megaphone,
  TriangleAlert,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ApiError, pesanError } from '@/lib/api'
import { formatJamLengkap, formatTanggalDari } from '@/lib/format'
import { useServerClock } from '@/lib/waktu'
import { ambilRekapTv, ambilTampilanTv } from './api'
import {
  MAKS_BARIS_KOLOM,
  bagiKolomTv,
  durasiMarqueeDetik,
  faktorSkalaFont,
  potongTeks,
} from './logika'
import type {
  KartuPengumumanTv,
  RekapTv,
  RingkasanItem,
  SekolahRingkas,
  TampilanTv,
} from './types'

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
      const lebar = window.innerWidth
      const tinggi = window.innerHeight
      setSkala(Math.min(lebar / LEBAR_KANVAS, tinggi / TINGGI_KANVAS) || 1)
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
 * Tema gelap, tanpa gulir, tiga kolom + header jam server + panel pengumuman +
 * teks berjalan. Saat koneksi putus (KP-6.5) data terakhir tetap tampil dengan
 * indikator "terputus"; layar tidak pernah dikosongkan.
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

  const gayaKanvas = {
    transform: `scale(${skalaLayar})`,
    '--tv-skala': String(faktor),
  } as CSSProperties

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
  const rotasiMs = Math.max(3, tampilan?.rotasi_panel_detik ?? 10) * 1000

  useEffect(() => {
    if (kartu.length <= 1) return
    const id = window.setInterval(
      () => setIndeksKartu((i) => (i + 1) % kartu.length),
      rotasiMs,
    )
    return () => window.clearInterval(id)
  }, [kartu.length, rotasiMs])

  const kolom = rekap ? bagiKolomTv(rekap) : []
  const teksBerjalan = rekap?.pengumuman.teks_berjalan ?? []
  const ulangTahun = rekap?.ulang_tahun ?? { aktif: false, daftar: [] }
  const kartuAktif: KartuPengumumanTv | null = kartu.length > 0 ? (kartu[indeksKartu % kartu.length] ?? null) : null

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0B1220]">
      <div
        className="relative h-[1080px] w-[1920px] shrink-0 overflow-hidden bg-[#0B1220] text-white"
        style={gayaKanvas}
      >
        {/* FR-TV-04 — header jam server (BR-38) */}
        <header className="flex h-[104px] items-center justify-between gap-6 px-10">
          <div className="flex items-center gap-4">
            <span className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-white/10 text-[22px] font-extrabold text-white">
              TV
            </span>
            <div>
              <p className="text-[26px] font-extrabold leading-tight text-white">
                {sekolah?.nama_sekolah ?? 'SIPANDU'}
              </p>
              <p className="text-[15px] font-medium text-white/60">
                {rekap
                  ? `${rekap.server.nama_hari}, ${formatTanggalDari(rekap.server.tanggal)} · ${rekap.presensi.hari_libur ?? 'Hari kerja'}`
                  : 'Memuat rekap harian…'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <IndikatorKoneksi terputus={terputus} pesan={pesanGalat} />
            <div className="text-right">
              <p className="tnum text-[46px] font-extrabold leading-none text-white">
                {formatJamLengkap(sekarang)}
              </p>
              <p className="tnum mt-1 text-[13px] font-semibold text-white/50">
                Jam server {tersinkron ? '' : '(cadangan)'} · {rekap?.server.zona ?? 'Asia/Jakarta'}
              </p>
            </div>
          </div>
        </header>

        {/* FR-TV-06/07/08 — tiga kolom: presensi, jurnal, perizinan */}
        <main className="grid min-h-0 grid-cols-3 gap-4 px-10" style={{ height: '700px' }}>
          {rekap === null ? (
            <div className="col-span-3 flex h-full items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
              <p className="text-[20px] font-semibold text-white/70">
                {terputus ? 'Menunggu koneksi ke server…' : 'Memuat rekap hari ini…'}
              </p>
            </div>
          ) : (
            <>
              <Panel judul={kolom[0]!.judul} ikon={UserCheck} ringkasan={kolom[0]!.ringkasan} aksen="emerald">
                {rekap.presensi.belum_presensi.slice(0, MAKS_BARIS_KOLOM).map((p) => (
                  <BarisPegawai key={`${p.inisial}-${p.nama}`} inisial={p.inisial} nama={p.nama} keterangan="Belum presensi" />
                ))}
                {rekap.presensi.belum_presensi.length === 0 && <BarisKosong teks="Semua pegawai sudah presensi." />}
                <Sisa n={rekap.presensi.belum_presensi.length - MAKS_BARIS_KOLOM} satuan="pegawai" />
              </Panel>

              <Panel judul={kolom[1]!.judul} ikon={BookOpen} ringkasan={kolom[1]!.ringkasan} aksen="sky">
                {rekap.jurnal.guru_belum.slice(0, MAKS_BARIS_KOLOM).map((g, i) => (
                  <BarisPegawai
                    key={`${g.inisial}-${g.kelas}-${g.label_jam}-${i}`}
                    inisial={g.inisial}
                    nama={g.nama}
                    keterangan={`${g.kelas} · ${g.mapel} · ${g.label_jam}`}
                  />
                ))}
                {rekap.jurnal.guru_belum.length === 0 && <BarisKosong teks="Tidak ada jurnal yang tertunggak." />}
                <Sisa n={rekap.jurnal.guru_belum.length - MAKS_BARIS_KOLOM} satuan="sesi" />
                <PresensiSiswa siswa={rekap.jurnal.presensi_siswa} />
              </Panel>

              <Panel judul={kolom[2]!.judul} ikon={Users} ringkasan={kolom[2]!.ringkasan} aksen="amber">
                {rekap.perizinan.daftar.slice(0, MAKS_BARIS_KOLOM).map((z, i) => (
                  <BarisPegawai
                    key={`${z.inisial}-${z.nama}-${i}`}
                    inisial={z.inisial}
                    nama={z.nama}
                    keterangan={`${z.label_jenis}${z.sampai ? ` s.d. ${formatTanggalDari(z.sampai)}` : ''}${
                      rekap.perizinan.tampilkan_alasan && z.alasan ? ` · ${potongTeks(z.alasan, 40)}` : ''
                    }`}
                  />
                ))}
                {rekap.perizinan.daftar.length === 0 && <BarisKosong teks="Tidak ada perizinan hari ini." />}
                <Sisa n={rekap.perizinan.daftar.length - MAKS_BARIS_KOLOM} satuan="pengajuan" />
              </Panel>
            </>
          )}
        </main>

        {/* FR-TV-09/10 — panel pengumuman dan ulang tahun */}
        <section className="mt-4 flex h-[176px] items-stretch gap-4 px-10">
          <div className="flex min-w-0 flex-[3] items-center gap-5 rounded-2xl bg-white/[0.05] px-7 ring-1 ring-white/10">
            <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
              <Megaphone size={28} />
            </span>
            {kartuAktif ? (
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[22px] font-extrabold text-white">
                  {kartuAktif.penting && <TriangleAlert size={20} className="text-amber-300" />}
                  {potongTeks(kartuAktif.judul, 90)}
                </p>
                <p className="mt-1 text-[18px] leading-snug text-white/70">
                  {potongTeks(kartuAktif.isi ?? '—', 190)}
                </p>
                {kartu.length > 1 && (
                  <p className="mt-2 text-[12px] font-semibold text-white/40">
                    Pengumuman {(indeksKartu % kartu.length) + 1} dari {kartu.length}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[18px] font-semibold text-white/50">Belum ada pengumuman tayang.</p>
            )}
          </div>

          {ulangTahun.aktif && ulangTahun.daftar.length > 0 && (
            <div className="flex w-[440px] shrink-0 flex-col justify-center gap-2 rounded-2xl bg-pink-500/10 px-7 ring-1 ring-pink-400/20">
              <p className="flex items-center gap-2 text-[18px] font-extrabold text-pink-200">
                <Cake size={20} /> Selamat Ulang Tahun
              </p>
              <p className="truncate text-[17px] font-semibold text-white/80">
                {ulangTahun.daftar.map((u) => u.nama).join(' · ')}
              </p>
            </div>
          )}
        </section>

        {/* FR-TV-13 — teks berjalan */}
        <footer className="mt-4 flex h-[44px] items-center overflow-hidden bg-white/[0.05]">
          {teksBerjalan.length > 0 ? (
            <p
              className="tv-marquee text-[18px] font-semibold text-white/80"
              style={{ animationDuration: `${durasiMarqueeDetik(tampilan?.kecepatan_scroll ?? 'normal')}s` }}
            >
              {teksBerjalan.join('   •   ')}
            </p>
          ) : (
            <p className="px-10 text-[15px] font-medium text-white/40">
              Teks berjalan belum diatur admin.
            </p>
          )}
        </footer>
      </div>
    </div>
  )
}

interface IndikatorProps {
  terputus: boolean
  pesan: string | null
}

/** KP-6.5 — indikator "terputus" tanpa mengosongkan layar. */
function IndikatorKoneksi({ terputus, pesan }: IndikatorProps) {
  if (!terputus) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-[13px] font-bold text-emerald-300">
        <Wifi size={14} /> Tersambung
      </span>
    )
  }

  return (
    <span
      title={pesan ?? undefined}
      className="flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1.5 text-[13px] font-bold text-amber-200"
    >
      <WifiOff size={14} /> Terputus — data terakhir
    </span>
  )
}

interface PanelProps {
  judul: string
  ikon: LucideIcon
  ringkasan: RingkasanItem[]
  aksen: 'emerald' | 'sky' | 'amber'
  children: React.ReactNode
}

function Panel({ judul, ikon: Ikon, ringkasan, aksen, children }: PanelProps) {
  const warna = {
    emerald: 'text-emerald-300',
    sky: 'text-sky-300',
    amber: 'text-amber-300',
  }[aksen]

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
      <header className="flex items-center gap-2.5 border-b border-white/10 px-6 py-3">
        <Ikon size={22} className={warna} />
        <h2 className="text-[20px] font-extrabold text-white">{judul}</h2>
      </header>

      <div className="grid grid-cols-4 gap-2 px-6 py-3">
        {ringkasan.map((r) => (
          <div key={r.label} className="rounded-xl bg-white/[0.05] px-3 py-2">
            <p className="tnum text-[22px] font-extrabold leading-none text-white">{r.nilai}</p>
            <p className="mt-1 text-[12px] font-semibold leading-tight text-white/55">{r.label}</p>
          </div>
        ))}
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-hidden px-6 pb-4">{children}</ul>
    </section>
  )
}

interface BarisPegawaiProps {
  inisial: string
  nama: string
  keterangan: string
}

/** BR-33 — avatar pegawai berupa huruf inisial, bukan foto. */
function BarisPegawai({ inisial, nama, keterangan }: BarisPegawaiProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[14px] font-extrabold text-white">
        {inisial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[16px] font-bold text-white">{nama}</p>
        <p className="truncate text-[13px] font-medium text-white/55">{keterangan}</p>
      </div>
    </li>
  )
}

function BarisKosong({ teks }: { teks: string }) {
  return <li className="px-3 py-2 text-[15px] font-medium text-white/45">{teks}</li>
}

function Sisa({ n, satuan }: { n: number; satuan: string }) {
  if (n <= 0) return null
  return (
    <li className="px-3 pt-1 text-[13px] font-semibold text-white/45">+{n} {satuan} lainnya</li>
  )
}

function PresensiSiswa({ siswa }: { siswa: RekapTv['jurnal']['presensi_siswa'] }) {
  const item = [
    { label: 'Hadir', nilai: siswa.hadir },
    { label: 'Sakit', nilai: siswa.sakit },
    { label: 'Izin', nilai: siswa.izin },
    { label: 'Alpa', nilai: siswa.alpa },
  ]

  return (
    <li className="mt-2 rounded-xl bg-white/[0.05] px-3 py-2">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-white/45">
        <Clock size={12} /> Presensi Siswa (agregat)
      </p>
      <div className="mt-1.5 grid grid-cols-4 gap-2">
        {item.map((i) => (
          <div key={i.label}>
            <p className="tnum text-[18px] font-extrabold leading-none text-white">{i.nilai}</p>
            <p className="text-[11px] font-semibold text-white/50">{i.label}</p>
          </div>
        ))}
      </div>
    </li>
  )
}
