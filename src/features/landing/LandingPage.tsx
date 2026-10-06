import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarCheck,
  Download,
  Facebook,
  FileBarChart2,
  Fingerprint,
  Instagram,
  LogIn,
  Mail,
  MapPin,
  MonitorPlay,
  Phone,
  Send,
  Youtube,
} from 'lucide-react'

import ilustrasiGrup from '@/assets/ilustrasi/guru-ilustrasi.svg'
import { Logo } from '@/components/ui/Logo'
import { APP_NAME } from '@/lib/env'
import { cn } from '@/lib/cn'
import { useSekolah } from '@/features/sekolah/useSekolah'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

const FITUR = [
  {
    icon: Fingerprint,
    judul: 'Presensi GPS + Foto',
    teks: 'Absen masuk dengan titik lokasi dan swafoto langsung dari kamera.',
    warna: 'bg-pastel-green text-success',
  },
  {
    icon: CalendarCheck,
    judul: 'Presensi Pulang',
    teks: 'Catat jam pulang, hitung menit kerja, dan tandai pulang cepat.',
    warna: 'bg-pastel-blue text-primary',
  },
  {
    icon: BookOpen,
    judul: 'Jurnal & Presensi Siswa',
    teks: 'Isi materi, kegiatan, sekaligus kehadiran siswa dalam satu halaman.',
    warna: 'bg-pastel-orange text-warn-text',
  },
  {
    icon: Send,
    judul: 'Izin & Dinas Online',
    teks: 'Ajukan izin, sakit, dinas, atau cuti beserta lampiran surat.',
    warna: 'bg-pastel-yellow text-warn-text',
  },
  {
    icon: FileBarChart2,
    judul: 'Laporan Resmi PDF/Excel',
    teks: 'Rekap presensi dan jurnal lengkap dengan kop surat serta tanda tangan.',
    warna: 'bg-pastel-green text-success',
  },
  {
    icon: MonitorPlay,
    judul: 'Layar TV Rekap Harian',
    teks: 'Pantau kehadiran, jurnal, dan pengumuman pada layar TV sekolah.',
    warna: 'bg-pastel-blue text-primary',
  },
]

const LANGKAH = [
  { judul: 'Masuk ke aplikasi', teks: 'Gunakan akun dari admin sekolah pada perangkat Anda.' },
  { judul: 'Presensi di sekolah', teks: 'Absen masuk dengan GPS dan swafoto, lalu absen pulang.' },
  { judul: 'Mengajar dan isi jurnal', teks: 'Catat materi, kegiatan, dan kehadiran siswa tiap sesi.' },
  { judul: 'Pantau laporan', teks: 'Lihat rekap presensi dan jurnal dalam PDF atau Excel.' },
]

/** FR-LND — Landing page publik (5.21). Tanpa data pegawai/siswa/kehadiran (BR-34). */
export function LandingPage() {
  const { data: sekolah } = useSekolah()
  const [promptPasang, setPromptPasang] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPromptPasang(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const namaSekolah = sekolah?.nama_sekolah ?? 'Sekolah'
  const judulHero =
    sekolah?.landing.judul_hero?.trim() ||
    `${APP_NAME} — Presensi & Jurnal Digital ${namaSekolah}`

  // FR-LND-05 — daftar pengumuman bertanda `tampil_landing`; diisi pada Fase 6.
  const pengumuman: Array<{ id: number; judul: string; isi: string }> = []

  return (
    <>
      {/* FR-LND-01 Navbar */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Logo ukuran="md" />
            <span className="hidden h-6 w-px bg-line sm:block" />
            <span className="hidden max-w-[240px] truncate text-sm font-semibold text-muted sm:block">
              {namaSekolah}
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <a href="#fitur" className="hover:text-primary">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-primary">
              Cara Kerja
            </a>
            <a href="#tentang" className="hover:text-primary">
              Tentang
            </a>
            <a href="#kontak" className="hover:text-primary">
              Kontak
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/tv"
              className="hidden rounded-full px-3 py-2 text-xs font-semibold text-link hover:bg-app-soft sm:block"
            >
              Layar TV
            </Link>
            <Link
              to="/masuk"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <LogIn size={16} /> Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* FR-LND-02 Hero */}
      <section className="bg-gradient-to-b from-app-soft to-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-2 md:py-16">
          <div>
            <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
              {sekolah?.tagline ?? 'Presensi & Jurnal Digital'}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-strong sm:text-4xl">
              {judulHero}
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted">
              Aplikasi presensi guru dan pegawai berbasis GPS dan swafoto, lengkap dengan jurnal
              pembelajaran, presensi siswa, perizinan online, dan laporan siap cetak.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/masuk"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
              >
                <LogIn size={18} /> Masuk Aplikasi
              </Link>
              {promptPasang && (
                <button
                  type="button"
                  onClick={() => {
                    void promptPasang.prompt()
                    setPromptPasang(null)
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-bold text-primary hover:bg-app-soft"
                >
                  <Download size={18} /> Pasang Aplikasi
                </button>
              )}
            </div>
          </div>

          <div className="relative flex items-end justify-center">
            <PhoneMockup />
            <img
              src={ilustrasiGrup}
              alt="Ilustrasi guru pria berpeci dan guru wanita berhijab"
              className="absolute -bottom-2 right-0 h-44 w-auto sm:h-56 md:h-64"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* FR-LND-03 Fitur */}
      <section id="fitur" className="bg-surface py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-strong">Fitur Utama</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted">
            Seluruh kebutuhan presensi dan dokumentasi mengajar dalam satu aplikasi.
          </p>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FITUR.map((f) => (
              <li key={f.judul} className="card p-6">
                <span className={cn('flex h-14 w-14 items-center justify-center rounded-full', f.warna)}>
                  <f.icon size={24} />
                </span>
                <h3 className="mt-4 text-base font-bold text-strong">{f.judul}</h3>
                <p className="mt-1 text-sm text-muted">{f.teks}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FR-LND-04 Cara kerja */}
      <section id="cara-kerja" className="bg-app-soft py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-strong">Cara Kerja</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LANGKAH.map((l, i) => (
              <li key={l.judul} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-sm font-bold text-strong">{l.judul}</h3>
                <p className="mt-1 text-sm text-muted">{l.teks}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FR-LND-05 Pengumuman terbaru (disembunyikan bila kosong) */}
      {pengumuman.length > 0 && (
        <section className="bg-surface py-14">
          <div className="mx-auto max-w-4xl px-5">
            <h2 className="text-2xl font-extrabold text-strong">Pengumuman Terbaru</h2>
            <div className="mt-6 space-y-3">
              {pengumuman.map((p) => (
                <article key={p.id} className="card p-5">
                  <h3 className="text-sm font-bold text-strong">{p.judul}</h3>
                  <p className="mt-1 text-sm text-muted">{p.isi}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FR-LND-06 Tentang sekolah */}
      <section id="tentang" className="bg-surface py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-2xl font-extrabold text-strong">Tentang Sekolah</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <p className="text-sm leading-relaxed text-muted">
                {sekolah?.tentang?.trim() || 'Informasi tentang sekolah belum diisi oleh admin.'}
              </p>
            </div>
            <div className="space-y-4">
              <div className="card p-6">
                <h3 className="text-sm font-bold text-strong">Visi</h3>
                <p className="mt-1 text-sm text-muted">
                  {sekolah?.visi?.trim() || 'Belum diisi.'}
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-bold text-strong">Misi</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">
                  {sekolah?.misi?.trim() || 'Belum diisi.'}
                </p>
              </div>
            </div>
          </div>
          <div className="card mt-6 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kepala Sekolah</p>
            <p className="mt-1 text-lg font-extrabold text-strong">
              {sekolah?.nama_kepala_sekolah?.trim() || 'Belum diisi'}
            </p>
            {sekolah?.nip_kepala_sekolah && (
              <p className="text-xs text-muted">NIP {sekolah.nip_kepala_sekolah}</p>
            )}
          </div>
        </div>
      </section>

      {/* FR-LND-07 Kontak & lokasi */}
      <section id="kontak" className="bg-app-soft py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-extrabold text-strong">Kontak &amp; Lokasi</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-link" />
                <dd className="text-muted">
                  {sekolah?.alamat_lengkap?.trim() || 'Alamat belum diisi.'}
                </dd>
              </div>
              <div className="flex gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-link" />
                <dd className="text-muted">{sekolah?.telepon || 'Belum diisi'}</dd>
              </div>
              <div className="flex gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-link" />
                <dd className="text-muted">{sekolah?.email || 'Belum diisi'}</dd>
              </div>
            </dl>
            <MediaSosial media={sekolah?.media_sosial} />
          </div>

          <div className="card overflow-hidden">
            {sekolah?.koordinat && sekolah.landing.tampilkan_peta ? (
              <PetaSekolah
                latitude={sekolah.koordinat.latitude}
                longitude={sekolah.koordinat.longitude}
                nama={namaSekolah}
              />
            ) : (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 bg-app-soft text-center">
                <MapPin size={28} className="text-muted" />
                <p className="text-sm font-semibold text-strong">Peta belum tersedia</p>
                <p className="max-w-xs text-xs text-muted">
                  Titik koordinat sekolah belum diisi pada pengaturan Info Sekolah.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function MediaSosial({ media }: { media?: Record<string, string | null> }) {
  const ikon: Array<[string, typeof Instagram, string]> = [
    ['instagram', Instagram, 'Instagram'],
    ['facebook', Facebook, 'Facebook'],
    ['youtube', Youtube, 'YouTube'],
  ]
  const ada = ikon.filter(([kunci]) => Boolean(media?.[kunci]))

  if (ada.length === 0) {
    return (
      <p className="mt-4 text-xs text-muted">Tautan media sosial belum diisi.</p>
    )
  }

  return (
    <div className="mt-5 flex items-center gap-2">
      {ada.map(([kunci, Icon, label]) => (
        <a
          key={kunci}
          href={media?.[kunci] ?? '#'}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-app-soft text-link hover:bg-primary-soft"
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="w-[190px] shrink-0 rounded-[32px] border-[7px] border-strong/85 bg-strong/85 shadow-pop sm:w-[220px]">
      <div className="overflow-hidden rounded-[26px] bg-app">
        <div className="bg-primary-soft/70 px-3 pb-6 pt-3">
          <div className="h-2 w-16 rounded-full bg-primary/25" />
          <div className="mt-3 h-3 w-24 rounded-full bg-primary/35" />
          <div className="mt-1.5 h-2 w-16 rounded-full bg-primary/20" />
        </div>
        <div className="-mt-4 rounded-t-[20px] bg-surface px-3 pb-4 pt-3">
          <div className="h-2 w-20 rounded-full bg-line" />
          <div className="mt-2 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3 w-14 rounded-full bg-success/50" />
              <div className="h-3 w-14 rounded-full bg-danger/50" />
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-primary/30" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {['bg-pastel-green', 'bg-pastel-blue', 'bg-pastel-orange', 'bg-pastel-yellow'].map((w) => (
              <div key={w} className={cn('h-7 w-7 rounded-full', w)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PetaSekolahProps {
  latitude: number
  longitude: number
  nama: string
}

/** FR-LND-07 — peta Leaflet/OpenStreetMap (hanya bila koordinat sekolah tersedia). */
export function PetaSekolah({ latitude, longitude, nama }: PetaSekolahProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let bersih: (() => void) | undefined
    void (async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (!containerRef.current) return
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [latitude, longitude],
        15,
      )
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      L.marker([latitude, longitude]).addTo(map).bindPopup(nama)
      bersih = () => map.remove()
    })()
    return () => bersih?.()
  }, [latitude, longitude, nama])

  return <div ref={containerRef} className="h-full min-h-[240px] w-full" aria-label={`Peta lokasi ${nama}`} />
}
