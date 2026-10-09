import {
  Bell,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileBarChart2,
  FileText,
  Fingerprint,
  GraduationCap,
  Grid2x2,
  History,
  Home,
  Landmark,
  LayoutGrid,
  MapPin,
  MonitorPlay,
  ScrollText,
  Settings,
  ShieldCheck,
  Tv,
  User,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ROLE, adminTanpaPegawai, adalahPegawai, punyaPeran } from './roles'
import type { Pengguna } from './roles'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Predikat akses; bila tidak diisi berarti tersedia untuk semua pengguna login. */
  akses?: (user: Pengguna | null) => boolean
  /** Menandai item tombol tengah bottom menu (FR-UI-10). */
  tengah?: boolean
  /** Menampilkan lencana antrean persetujuan pada top bar/sidebar. */
  lencanaPersetujuan?: boolean
}

export interface NavGroup {
  judul: string
  items: NavItem[]
}

const semua = () => true
const guruSaja = (u: Pengguna | null) => punyaPeran(u, ROLE.guru)
const pegawaiAtauGuru = (u: Pengguna | null) => adalahPegawai(u)
const pimpinan = (u: Pengguna | null) => punyaPeran(u, ROLE.admin, ROLE.kepalaSekolah)
const pengelola = (u: Pengguna | null) => punyaPeran(u, ROLE.admin, ROLE.wakasekKurikulum)
const masterBaca = (u: Pengguna | null) =>
  punyaPeran(u, ROLE.admin, ROLE.kepalaSekolah, ROLE.wakasekKurikulum)
const hanyaAdmin = (u: Pengguna | null) => punyaPeran(u, ROLE.admin)

/** Navigasi desktop (8.3). */
export const MENU_SIDEBAR: NavGroup[] = [
  {
    judul: 'Utama',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: Home, akses: semua },
      { to: '/pengumuman', label: 'Pengumuman', icon: Bell, akses: semua },
    ],
  },
  {
    judul: 'Presensi Saya',
    items: [
      { to: '/presensi', label: 'Presensi', icon: Fingerprint, akses: pegawaiAtauGuru, tengah: true },
      { to: '/presensi/riwayat', label: 'Riwayat Presensi', icon: History, akses: pegawaiAtauGuru },
      { to: '/pengajuan', label: 'Pengajuan', icon: FileText, akses: pegawaiAtauGuru },
    ],
  },
  {
    judul: 'Mengajar',
    items: [
      { to: '/mengajar/jadwal', label: 'Jadwal Mengajar', icon: CalendarDays, akses: guruSaja },
      { to: '/mengajar/jurnal/riwayat', label: 'Jurnal Saya', icon: BookOpen, akses: guruSaja },
      { to: '/wali-kelas/rekap', label: 'Rekap Wali Kelas', icon: Users, akses: guruSaja },
    ],
  },
  {
    judul: 'Monitoring & Persetujuan',
    items: [
      {
        to: '/monitoring/presensi-harian',
        label: 'Presensi Harian',
        icon: ClipboardCheck,
        akses: masterBaca,
      },
      {
        to: '/persetujuan/presensi-luar-radius',
        label: 'Persetujuan Luar Radius',
        icon: MapPin,
        akses: pimpinan,
        lencanaPersetujuan: true,
      },
      {
        to: '/persetujuan/pengajuan',
        label: 'Persetujuan Pengajuan',
        icon: UserCheck,
        akses: pimpinan,
        lencanaPersetujuan: true,
      },
    ],
  },
  {
    judul: 'Master Data',
    items: [
      { to: '/master/tahun-pelajaran', label: 'Tahun Pelajaran', icon: CalendarRange, akses: masterBaca },
      { to: '/master/jurusan', label: 'Jurusan', icon: GraduationCap, akses: masterBaca },
      { to: '/master/kelas', label: 'Kelas', icon: LayoutGrid, akses: masterBaca },
      { to: '/master/siswa', label: 'Siswa', icon: Users, akses: masterBaca },
      { to: '/master/pegawai', label: 'Guru & Pegawai', icon: UserCheck, akses: masterBaca },
      { to: '/master/mapel', label: 'Mata Pelajaran', icon: BookOpen, akses: masterBaca },
    ],
  },
  {
    judul: 'Penugasan & Akademik',
    items: [
      { to: '/plotting/kelas', label: 'Plotting Kelas', icon: Grid2x2, akses: pengelola },
      { to: '/plotting/mapel', label: 'Plotting Mapel', icon: ClipboardList, akses: pengelola },
      { to: '/akademik/jam-pelajaran', label: 'Jam Pelajaran', icon: Clock, akses: pengelola },
      { to: '/akademik/jadwal', label: 'Jadwal Pelajaran', icon: CalendarDays, akses: pengelola },
    ],
  },
  {
    judul: 'Laporan',
    items: [
      { to: '/laporan/presensi/rekap', label: 'Rekap Presensi', icon: FileBarChart2, akses: semua },
      { to: '/laporan/presensi-siswa', label: 'Presensi Siswa', icon: Users, akses: semua },
      { to: '/laporan/jurnal', label: 'Laporan Jurnal', icon: BookOpen, akses: semua },
      { to: '/laporan/jurnal/kepatuhan', label: 'Kepatuhan Jurnal', icon: ShieldCheck, akses: masterBaca },
      { to: '/laporan/izin', label: 'Rekap Izin', icon: FileText, akses: semua },
    ],
  },
  {
    judul: 'Pengaturan',
    items: [
      { to: '/pengaturan/info-sekolah', label: 'Info Sekolah', icon: Landmark, akses: hanyaAdmin },
      { to: '/pengaturan/lokasi', label: 'Lokasi Presensi', icon: MapPin, akses: hanyaAdmin },
      { to: '/pengaturan/jam-kerja', label: 'Jam Kerja', icon: Clock, akses: hanyaAdmin },
      { to: '/pengaturan/hari-libur', label: 'Hari Libur', icon: CalendarRange, akses: hanyaAdmin },
      { to: '/pengaturan/sistem', label: 'Pengaturan Sistem', icon: Settings, akses: hanyaAdmin },
      { to: '/pengaturan/kop-surat', label: 'Kop Surat', icon: ScrollText, akses: hanyaAdmin },
      { to: '/pengaturan/penandatangan', label: 'Penandatangan', icon: Wallet, akses: hanyaAdmin },
      { to: '/pengaturan/tv', label: 'Layar TV', icon: Tv, akses: hanyaAdmin },
      { to: '/pengumuman/kelola', label: 'Kelola Pengumuman', icon: Bell, akses: pimpinan },
      { to: '/pengaturan/pengguna', label: 'Pengguna & Peran', icon: User, akses: hanyaAdmin },
      { to: '/pengaturan/audit-log', label: 'Audit Log', icon: ShieldCheck, akses: hanyaAdmin },
    ],
  },
]

/** Bottom menu mobile, 5 slot; slot 3 = tombol tengah melayang (8.2). */
export function menuBawah(user: Pengguna | null): NavItem[] {
  const tengah: NavItem = adminTanpaPegawai(user)
    ? {
        to: '/persetujuan/pengajuan',
        label: 'Persetujuan',
        icon: ClipboardCheck,
        tengah: true,
        lencanaPersetujuan: true,
      }
    : {
        to: '/presensi',
        label: 'Presensi',
        icon: Fingerprint,
        tengah: true,
      }

  const slot2: NavItem = punyaPeran(user, ROLE.guru)
    ? { to: '/mengajar/jadwal', label: 'Jadwal', icon: CalendarDays }
    : adminTanpaPegawai(user) || pimpinan(user)
      ? { to: '/monitoring/presensi-harian', label: 'Monitoring', icon: ClipboardCheck }
      : { to: '/presensi/riwayat', label: 'Riwayat', icon: History }

  return [
    { to: '/dashboard', label: 'Beranda', icon: Home },
    slot2,
    tengah,
    { to: '/layanan', label: 'Layanan', icon: Grid2x2 },
    { to: '/profil', label: 'Profil', icon: User },
  ]
}

export function itemAktif(user: Pengguna | null, grup: NavGroup[]): NavItem[] {
  return grup.flatMap((g) => g.items).filter((i) => (i.akses ? i.akses(user) : true))
}

/** Layanan grid (FR-UI-07) sesuai peran. */
export interface LayananItem {
  to: string
  label: string
  icon: LucideIcon
  warna: 'hijau' | 'biru' | 'oranye' | 'kuning'
  segera?: boolean
}

export function layananPeran(user: Pengguna | null): LayananItem[] {
  const guru: LayananItem[] = [
    { to: '/mengajar/jadwal', label: 'Jadwal', icon: CalendarDays, warna: 'biru' },
    { to: '/mengajar/jurnal/riwayat', label: 'Jurnal', icon: BookOpen, warna: 'hijau' },
    { to: '/pengajuan/izin/baru', label: 'Izin', icon: FileText, warna: 'oranye' },
    { to: '/presensi/riwayat', label: 'Riwayat', icon: History, warna: 'kuning' },
  ]

  const struktural: LayananItem[] = [
    { to: '/pengajuan/izin/baru', label: 'Izin', icon: FileText, warna: 'oranye' },
    { to: '/presensi/riwayat', label: 'Riwayat', icon: History, warna: 'kuning' },
    { to: '/laporan/presensi/rekap', label: 'Rekap Saya', icon: FileBarChart2, warna: 'hijau' },
  ]

  const laporan: LayananItem[] = [
    { to: '/monitoring/presensi-harian', label: 'Monitoring', icon: ClipboardCheck, warna: 'biru' },
    { to: '/laporan/presensi/rekap', label: 'Laporan', icon: FileBarChart2, warna: 'hijau' },
  ]

  const admin: LayananItem[] = [
    { to: '/persetujuan/pengajuan', label: 'Persetujuan', icon: UserCheck, warna: 'oranye' },
    { to: '/monitoring/presensi-harian', label: 'Monitoring', icon: ClipboardCheck, warna: 'biru' },
    { to: '/laporan/presensi/rekap', label: 'Laporan', icon: FileBarChart2, warna: 'hijau' },
    { to: '/master/siswa', label: 'Master Data', icon: Users, warna: 'kuning' },
    { to: '/plotting/kelas', label: 'Plotting', icon: Grid2x2, warna: 'biru' },
    { to: '/pengaturan/info-sekolah', label: 'Pengaturan', icon: Settings, warna: 'oranye' },
  ]

  // Bagian setelah fitur aslinya (placeholder fase berikutnya ditandai "Segera").
  const umum: LayananItem[] = [
    { to: '/pengumuman', label: 'Pengumuman', icon: Bell, warna: 'kuning' },
  ]

  const luarRadius: LayananItem = {
    to: '/pengajuan/luar-radius/baru',
    label: 'Ajukan Luar Radius',
    icon: MapPin,
    warna: 'biru',
  }

  const waliKelas: LayananItem = {
    to: '/wali-kelas/rekap',
    label: 'Wali Kelas',
    icon: Users,
    warna: 'hijau',
  }

  const tv: LayananItem = { to: '/tv', label: 'Layar TV', icon: MonitorPlay, warna: 'biru' }

  if (punyaPeran(user, ROLE.admin)) return [...admin, ...laporan, ...umum, tv]
  if (punyaPeran(user, ROLE.kepalaSekolah, ROLE.wakasekKurikulum)) return [...laporan, ...umum, tv]
  if (punyaPeran(user, ROLE.guru)) {
    const rekap: LayananItem = {
      to: '/laporan/presensi/rekap',
      label: 'Rekap Saya',
      icon: FileBarChart2,
      warna: 'hijau',
    }
    const wali: LayananItem[] = user?.jenis_pegawai === 'guru' ? [waliKelas] : []
    return [...guru, rekap, luarRadius, ...umum, ...wali]
  }
  return [...struktural, ...umum]
}
