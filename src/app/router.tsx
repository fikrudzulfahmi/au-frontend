import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from './RequireAuth'
import { AppShell } from '@/layouts/AppShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import { TvLayout } from '@/layouts/TvLayout'
import { LambangSipandu } from '@/components/ui/Logo'
import { LAPORAN } from '@/features/laporan/config'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { NotFoundPage } from '@/features/umum/NotFoundPage'

/**
 * Fase 7 (FR-LND-11 / optimasi kinerja jam sibuk) — pemecahan bundel lewat rute.
 * Bundel utama hanya memuat kerangka aplikasi, halaman masuk, beranda, dan
 * registri laporan; setiap halaman lain dimuat saat rutenya benar-benar dibuka.
 */
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const TvPage = lazy(() => import('@/features/tv/TvPage').then((m) => ({ default: m.TvPage })))

const LayananPage = lazy(() =>
  import('@/features/umum/LayananPage').then((m) => ({ default: m.LayananPage })),
)
const ProfilPage = lazy(() =>
  import('@/features/umum/ProfilPage').then((m) => ({ default: m.ProfilPage })),
)
const GantiPasswordPage = lazy(() =>
  import('@/features/umum/GantiPasswordPage').then((m) => ({ default: m.GantiPasswordPage })),
)
const PengumumanPage = lazy(() =>
  import('@/features/umum/PengumumanPage').then((m) => ({ default: m.PengumumanPage })),
)
const KelolaPengumumanPage = lazy(() =>
  import('@/features/umum/KelolaPengumumanPage').then((m) => ({ default: m.KelolaPengumumanPage })),
)

const PresensiPage = lazy(() =>
  import('@/features/presensi/PresensiPage').then((m) => ({ default: m.PresensiPage })),
)
const RiwayatPresensiPage = lazy(() =>
  import('@/features/presensi/RiwayatPresensiPage').then((m) => ({ default: m.RiwayatPresensiPage })),
)
const PengajuanPage = lazy(() =>
  import('@/features/presensi/PengajuanPage').then((m) => ({ default: m.PengajuanPage })),
)
const PengajuanIzinBaruPage = lazy(() =>
  import('@/features/presensi/PengajuanIzinBaruPage').then((m) => ({
    default: m.PengajuanIzinBaruPage,
  })),
)
const PengajuanLuarRadiusBaruPage = lazy(() =>
  import('@/features/presensi/PengajuanLuarRadiusBaruPage').then((m) => ({
    default: m.PengajuanLuarRadiusBaruPage,
  })),
)

const JadwalGuruPage = lazy(() =>
  import('@/features/mengajar/JadwalGuruPage').then((m) => ({ default: m.JadwalGuruPage })),
)
const IsiJurnalPage = lazy(() =>
  import('@/features/mengajar/jurnal/IsiJurnalPage').then((m) => ({ default: m.IsiJurnalPage })),
)
const RiwayatJurnalPage = lazy(() =>
  import('@/features/mengajar/jurnal/RiwayatJurnalPage').then((m) => ({ default: m.RiwayatJurnalPage })),
)
const RekapWaliKelasPage = lazy(() =>
  import('@/features/wali-kelas/RekapWaliKelasPage').then((m) => ({ default: m.RekapWaliKelasPage })),
)

const TahunPelajaranPage = lazy(() =>
  import('@/features/master/TahunPelajaranPage').then((m) => ({ default: m.TahunPelajaranPage })),
)
const JurusanPage = lazy(() =>
  import('@/features/master/JurusanPage').then((m) => ({ default: m.JurusanPage })),
)
const KelasPage = lazy(() =>
  import('@/features/master/KelasPage').then((m) => ({ default: m.KelasPage })),
)
const SiswaPage = lazy(() =>
  import('@/features/master/SiswaPage').then((m) => ({ default: m.SiswaPage })),
)
const PegawaiPage = lazy(() =>
  import('@/features/master/PegawaiPage').then((m) => ({ default: m.PegawaiPage })),
)
const MapelPage = lazy(() =>
  import('@/features/master/MapelPage').then((m) => ({ default: m.MapelPage })),
)
const HariLiburPage = lazy(() =>
  import('@/features/master/HariLiburPage').then((m) => ({ default: m.HariLiburPage })),
)

const PlottingKelasPage = lazy(() =>
  import('@/features/plotting/PlottingKelasPage').then((m) => ({ default: m.PlottingKelasPage })),
)
const NaikKelasPage = lazy(() =>
  import('@/features/plotting/NaikKelasPage').then((m) => ({ default: m.NaikKelasPage })),
)
const PlottingMapelPage = lazy(() =>
  import('@/features/plotting/PlottingMapelPage').then((m) => ({ default: m.PlottingMapelPage })),
)
const JamPelajaranPage = lazy(() =>
  import('@/features/akademik/JamPelajaranPage').then((m) => ({ default: m.JamPelajaranPage })),
)
const JadwalPage = lazy(() =>
  import('@/features/akademik/JadwalPage').then((m) => ({ default: m.JadwalPage })),
)

const MonitoringPresensiPage = lazy(() =>
  import('@/features/monitoring/MonitoringPresensiPage').then((m) => ({
    default: m.MonitoringPresensiPage,
  })),
)
const PersetujuanLuarRadiusPage = lazy(() =>
  import('@/features/monitoring/PersetujuanPage').then((m) => ({ default: m.PersetujuanLuarRadiusPage })),
)
const PersetujuanPengajuanPage = lazy(() =>
  import('@/features/monitoring/PersetujuanPengajuanPage').then((m) => ({
    default: m.PersetujuanPengajuanPage,
  })),
)

const HubLaporanPage = lazy(() =>
  import('@/features/laporan/HubLaporanPage').then((m) => ({ default: m.HubLaporanPage })),
)
const LaporanPage = lazy(() =>
  import('@/features/laporan/LaporanPage').then((m) => ({ default: m.LaporanPage })),
)

const InfoSekolahPage = lazy(() =>
  import('@/features/pengaturan/InfoSekolahPage').then((m) => ({ default: m.InfoSekolahPage })),
)
const PengaturanLokasiPage = lazy(() =>
  import('@/features/pengaturan/PengaturanLokasiPage').then((m) => ({ default: m.PengaturanLokasiPage })),
)
const PengaturanJamKerjaPage = lazy(() =>
  import('@/features/pengaturan/PengaturanJamKerjaPage').then((m) => ({
    default: m.PengaturanJamKerjaPage,
  })),
)
const PengaturanSistemPage = lazy(() =>
  import('@/features/pengaturan/PengaturanSistemPage').then((m) => ({ default: m.PengaturanSistemPage })),
)
const PengaturanDokumenPage = lazy(() =>
  import('@/features/pengaturan/PengaturanDokumenPage').then((m) => ({
    default: m.PengaturanDokumenPage,
  })),
)
const PengaturanTvPage = lazy(() =>
  import('@/features/pengaturan/PengaturanTvPage').then((m) => ({ default: m.PengaturanTvPage })),
)
const PenggunaPage = lazy(() =>
  import('@/features/pengaturan/PenggunaPage').then((m) => ({ default: m.PenggunaPage })),
)
const AuditLogPage = lazy(() =>
  import('@/features/pengaturan/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
)

function Memuat() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-app text-muted">
      <LambangSipandu size={40} />
      <p className="text-sm font-semibold">Memuat…</p>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Memuat />}>
        <Routes>
          {/* PUBLIK */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>
          <Route path="/masuk" element={<LoginPage />} />
          <Route element={<TvLayout />}>
            <Route path="/tv" element={<TvPage />} />
          </Route>

          {/* SETELAH LOGIN */}
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/layanan" element={<LayananPage />} />
            <Route path="/profil" element={<ProfilPage />} />
            <Route path="/ganti-password" element={<GantiPasswordPage />} />

            {/* Presensi saya */}
            <Route path="/presensi" element={<PresensiPage />} />
            <Route path="/presensi/riwayat" element={<RiwayatPresensiPage />} />
            <Route path="/pengajuan" element={<PengajuanPage />} />
            <Route path="/pengajuan/izin/baru" element={<PengajuanIzinBaruPage />} />
            <Route path="/pengajuan/luar-radius/baru" element={<PengajuanLuarRadiusBaruPage />} />

            {/* Mengajar */}
            <Route path="/mengajar/jadwal" element={<JadwalGuruPage />} />
            {/* FR-JRN-02/03 — isi jurnal dan presensi siswa dalam satu halaman. */}
            <Route path="/mengajar/jurnal/isi/:sesi" element={<IsiJurnalPage />} />
            <Route path="/mengajar/jurnal/riwayat" element={<RiwayatJurnalPage />} />
            {/* FR-JRN-10 — rekap presensi siswa kelas wali. */}
            <Route path="/wali-kelas/rekap" element={<RekapWaliKelasPage />} />

            {/* Pengumuman */}
            <Route path="/pengumuman" element={<PengumumanPage />} />
            <Route path="/pengumuman/kelola" element={<KelolaPengumumanPage />} />

            {/* Master data */}
            <Route path="/master/tahun-pelajaran" element={<TahunPelajaranPage />} />
            <Route path="/master/jurusan" element={<JurusanPage />} />
            <Route path="/master/kelas" element={<KelasPage />} />
            <Route path="/master/siswa" element={<SiswaPage />} />
            <Route path="/master/pegawai" element={<PegawaiPage />} />
            <Route path="/master/mapel" element={<MapelPage />} />

            {/* Penugasan & akademik */}
            <Route path="/plotting/kelas" element={<PlottingKelasPage />} />
            <Route path="/plotting/kelas/naik-kelas" element={<NaikKelasPage />} />
            <Route
              path="/plotting/kelas/mutasi"
              element={
                // Mutasi dijalankan dari daftar siswa per kelas (tombol per baris),
                // sehingga rute ini menampilkan halaman plotting yang sama.
                <PlottingKelasPage />
              }
            />
            <Route path="/plotting/mapel" element={<PlottingMapelPage />} />
            <Route path="/akademik/jam-pelajaran" element={<JamPelajaranPage />} />
            <Route path="/akademik/jadwal" element={<JadwalPage />} />

            {/* Monitoring & persetujuan */}
            <Route path="/monitoring/presensi-harian" element={<MonitoringPresensiPage />} />
            <Route path="/persetujuan/presensi-luar-radius" element={<PersetujuanLuarRadiusPage />} />
            <Route path="/persetujuan/pengajuan" element={<PersetujuanPengajuanPage />} />

            {/* Laporan */}
            {/* FR-LAP-01..09 — satu halaman generik per laporan; jalur rutenya
                diambil dari registri `LAPORAN` agar tidak ada jalur yang menyimpang. */}
            <Route path="/laporan" element={<HubLaporanPage />} />
            {LAPORAN.map((l) => (
              <Route key={l.jalur} path={l.jalur} element={<LaporanPage konfigurasi={l} />} />
            ))}

            {/* Pengaturan */}
            <Route path="/pengaturan/info-sekolah" element={<InfoSekolahPage />} />
            <Route path="/pengaturan/lokasi" element={<PengaturanLokasiPage />} />
            <Route path="/pengaturan/jam-kerja" element={<PengaturanJamKerjaPage />} />
            <Route path="/pengaturan/hari-libur" element={<HariLiburPage />} />
            <Route path="/pengaturan/sistem" element={<PengaturanSistemPage />} />
            {/* FR-KOP-02..05 — kop, penandatangan, tata letak, dan pratinjau. */}
            <Route path="/pengaturan/kop-surat" element={<PengaturanDokumenPage tabAwal="kop" />} />
            <Route
              path="/pengaturan/penandatangan"
              element={<PengaturanDokumenPage tabAwal="penandatangan" />}
            />
            <Route path="/pengaturan/tv" element={<PengaturanTvPage />} />
            <Route path="/pengaturan/pengguna" element={<PenggunaPage />} />
            <Route path="/pengaturan/audit-log" element={<AuditLogPage />} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
