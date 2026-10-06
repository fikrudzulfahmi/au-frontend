import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from './RequireAuth'
import { AppShell } from '@/layouts/AppShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import { TvLayout } from '@/layouts/TvLayout'
import { LambangSipandu } from '@/components/ui/Logo'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { FiturSegera } from '@/features/umum/FiturSegera'
import { JadwalPage } from '@/features/akademik/JadwalPage'
import { MonitoringPresensiPage } from '@/features/monitoring/MonitoringPresensiPage'
import { PersetujuanLuarRadiusPage } from '@/features/monitoring/PersetujuanPage'
import { PersetujuanPengajuanPage } from '@/features/monitoring/PersetujuanPengajuanPage'
import { PengaturanJamKerjaPage } from '@/features/pengaturan/PengaturanJamKerjaPage'
import { PengaturanLokasiPage } from '@/features/pengaturan/PengaturanLokasiPage'
import { PengajuanIzinBaruPage } from '@/features/presensi/PengajuanIzinBaruPage'
import { PengajuanLuarRadiusBaruPage } from '@/features/presensi/PengajuanLuarRadiusBaruPage'
import { PengajuanPage } from '@/features/presensi/PengajuanPage'
import { PresensiPage } from '@/features/presensi/PresensiPage'
import { RiwayatPresensiPage } from '@/features/presensi/RiwayatPresensiPage'
import { JamPelajaranPage } from '@/features/akademik/JamPelajaranPage'
import { JadwalGuruPage } from '@/features/mengajar/JadwalGuruPage'
import { IsiJurnalPage } from '@/features/mengajar/jurnal/IsiJurnalPage'
import { RiwayatJurnalPage } from '@/features/mengajar/jurnal/RiwayatJurnalPage'
import { RekapWaliKelasPage } from '@/features/wali-kelas/RekapWaliKelasPage'
import { NaikKelasPage } from '@/features/plotting/NaikKelasPage'
import { PlottingKelasPage } from '@/features/plotting/PlottingKelasPage'
import { PlottingMapelPage } from '@/features/plotting/PlottingMapelPage'
import { HariLiburPage } from '@/features/master/HariLiburPage'
import { LAPORAN } from '@/features/laporan/config'
import { HubLaporanPage } from '@/features/laporan/HubLaporanPage'
import { LaporanPage } from '@/features/laporan/LaporanPage'
import { PengaturanDokumenPage } from '@/features/pengaturan/PengaturanDokumenPage'
import { JurusanPage } from '@/features/master/JurusanPage'
import { KelasPage } from '@/features/master/KelasPage'
import { MapelPage } from '@/features/master/MapelPage'
import { PegawaiPage } from '@/features/master/PegawaiPage'
import { SiswaPage } from '@/features/master/SiswaPage'
import { TahunPelajaranPage } from '@/features/master/TahunPelajaranPage'
import { AuditLogPage } from '@/features/pengaturan/AuditLogPage'
import { InfoSekolahPage } from '@/features/pengaturan/InfoSekolahPage'
import { PengaturanSistemPage } from '@/features/pengaturan/PengaturanSistemPage'
import { PenggunaPage } from '@/features/pengaturan/PenggunaPage'
import { GantiPasswordPage } from '@/features/umum/GantiPasswordPage'
import { LayananPage } from '@/features/umum/LayananPage'
import { NotFoundPage } from '@/features/umum/NotFoundPage'
import { PengumumanPage } from '@/features/umum/PengumumanPage'
import { ProfilPage } from '@/features/umum/ProfilPage'
import { TvPage } from '@/features/tv/TvPage'

// FR-LND-11 — landing dipisah (route-based code splitting) agar JS awal ringan.
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })),
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
            <Route
              path="/pengumuman/kelola"
              element={<FiturSegera judul="Kelola Pengumuman" fase="Fase 6" />}
            />

            {/* Master data */}
            <Route path="/master/tahun-pelajaran" element={<TahunPelajaranPage />} />
            <Route path="/master/jurusan" element={<JurusanPage />} />
            <Route path="/master/kelas" element={<KelasPage />} />
            <Route path="/master/siswa" element={<SiswaPage />} />
            <Route path="/master/pegawai" element={<PegawaiPage />} />
            <Route path="/master/mapel" element={<MapelPage />} />

            {/* Penugasan & akademik */}
            <Route
              path="/plotting/kelas"
              element={<PlottingKelasPage />}
            />
            <Route
              path="/plotting/kelas/naik-kelas"
              element={<NaikKelasPage />}
            />
            <Route
              path="/plotting/kelas/mutasi"
              element={
                // Mutasi dijalankan dari daftar siswa per kelas (tombol per baris),
                // sehingga rute ini menampilkan halaman plotting yang sama.
                <PlottingKelasPage />
              }
            />
            <Route
              path="/plotting/mapel"
              element={<PlottingMapelPage />}
            />
            <Route
              path="/akademik/jam-pelajaran"
              element={<JamPelajaranPage />}
            />
            <Route
              path="/akademik/jadwal"
              element={<JadwalPage />}
            />

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
            <Route
              path="/pengaturan/kop-surat"
              element={<PengaturanDokumenPage tabAwal="kop" />}
            />
            <Route
              path="/pengaturan/penandatangan"
              element={<PengaturanDokumenPage tabAwal="penandatangan" />}
            />
            <Route
              path="/pengaturan/tv"
              element={<FiturSegera judul="Pengaturan Layar TV" fase="Fase 6" />}
            />
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
