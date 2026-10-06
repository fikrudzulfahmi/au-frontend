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
            <Route path="/presensi" element={<FiturSegera judul="Presensi" fase="Fase 3" />} />
            <Route
              path="/presensi/riwayat"
              element={<FiturSegera judul="Riwayat Presensi" fase="Fase 3" />}
            />
            <Route path="/pengajuan" element={<FiturSegera judul="Pengajuan Saya" fase="Fase 3" />} />
            <Route
              path="/pengajuan/izin/baru"
              element={<FiturSegera judul="Pengajuan Izin / Sakit / Dinas / Cuti" fase="Fase 3" />}
            />
            <Route
              path="/pengajuan/luar-radius/baru"
              element={<FiturSegera judul="Pengajuan Presensi Luar Radius" fase="Fase 3" />}
            />

            {/* Mengajar */}
            <Route
              path="/mengajar/jadwal"
              element={<FiturSegera judul="Jadwal Mengajar" fase="Fase 2" />}
            />
            <Route
              path="/mengajar/jurnal/isi/:sesi"
              element={<FiturSegera judul="Isi Jurnal & Presensi Siswa" fase="Fase 4" />}
            />
            <Route
              path="/mengajar/jurnal/riwayat"
              element={<FiturSegera judul="Riwayat Jurnal" fase="Fase 4" />}
            />
            <Route
              path="/wali-kelas/rekap"
              element={<FiturSegera judul="Rekap Presensi Siswa Kelas Wali" fase="Fase 4" />}
            />

            {/* Pengumuman */}
            <Route path="/pengumuman" element={<PengumumanPage />} />
            <Route
              path="/pengumuman/kelola"
              element={<FiturSegera judul="Kelola Pengumuman" fase="Fase 6" />}
            />

            {/* Master data */}
            <Route
              path="/master/tahun-pelajaran"
              element={<FiturSegera judul="Tahun Pelajaran & Semester" fase="Fase 1" />}
            />
            <Route
              path="/master/jurusan"
              element={<FiturSegera judul="Jurusan" fase="Fase 1" />}
            />
            <Route path="/master/kelas" element={<FiturSegera judul="Kelas" fase="Fase 1" />} />
            <Route path="/master/siswa" element={<FiturSegera judul="Siswa" fase="Fase 1" />} />
            <Route
              path="/master/pegawai"
              element={<FiturSegera judul="Guru & Pegawai" fase="Fase 1" />}
            />
            <Route path="/master/mapel" element={<FiturSegera judul="Mata Pelajaran" fase="Fase 1" />} />

            {/* Penugasan & akademik */}
            <Route
              path="/plotting/kelas"
              element={<FiturSegera judul="Plotting Kelas" fase="Fase 2" />}
            />
            <Route
              path="/plotting/kelas/naik-kelas"
              element={<FiturSegera judul="Wizard Naik Kelas & Kelulusan" fase="Fase 2" />}
            />
            <Route
              path="/plotting/kelas/mutasi"
              element={<FiturSegera judul="Mutasi Kelas" fase="Fase 2" />}
            />
            <Route
              path="/plotting/mapel"
              element={<FiturSegera judul="Plotting Mapel" fase="Fase 2" />}
            />
            <Route
              path="/akademik/jam-pelajaran"
              element={<FiturSegera judul="Jam Pelajaran" fase="Fase 2" />}
            />
            <Route
              path="/akademik/jadwal"
              element={<FiturSegera judul="Jadwal Pelajaran" fase="Fase 2" />}
            />

            {/* Monitoring & persetujuan */}
            <Route
              path="/monitoring/presensi-harian"
              element={<FiturSegera judul="Monitoring Presensi Harian" fase="Fase 3" />}
            />
            <Route
              path="/persetujuan/presensi-luar-radius"
              element={<FiturSegera judul="Persetujuan Presensi Luar Radius" fase="Fase 3" />}
            />
            <Route
              path="/persetujuan/pengajuan"
              element={<FiturSegera judul="Persetujuan Pengajuan" fase="Fase 3" />}
            />

            {/* Laporan */}
            <Route
              path="/laporan/presensi/rekap"
              element={<FiturSegera judul="Rekap Presensi Pegawai" fase="Fase 5" />}
            />
            <Route
              path="/laporan/presensi/detail"
              element={<FiturSegera judul="Detail Presensi Pegawai" fase="Fase 5" />}
            />
            <Route
              path="/laporan/presensi/harian"
              element={<FiturSegera judul="Presensi Harian Semua Pegawai" fase="Fase 5" />}
            />
            <Route
              path="/laporan/izin"
              element={<FiturSegera judul="Rekap Izin / Sakit / Dinas / Cuti" fase="Fase 5" />}
            />
            <Route
              path="/laporan/luar-radius"
              element={<FiturSegera judul="Rekap Presensi Luar Radius" fase="Fase 5" />}
            />
            <Route
              path="/laporan/presensi-siswa"
              element={<FiturSegera judul="Rekap Presensi Siswa" fase="Fase 5" />}
            />
            <Route
              path="/laporan/jurnal"
              element={<FiturSegera judul="Daftar Jurnal" fase="Fase 5" />}
            />
            <Route
              path="/laporan/jurnal/kepatuhan"
              element={<FiturSegera judul="Kepatuhan Jurnal per Guru" fase="Fase 5" />}
            />
            <Route
              path="/laporan/jam-mengajar"
              element={<FiturSegera judul="Rekap Jam Mengajar Terlaksana" fase="Fase 5" />}
            />

            {/* Pengaturan */}
            <Route
              path="/pengaturan/info-sekolah"
              element={<FiturSegera judul="Info Sekolah" fase="Fase 1" />}
            />
            <Route
              path="/pengaturan/lokasi"
              element={<FiturSegera judul="Lokasi Presensi" fase="Fase 3" />}
            />
            <Route
              path="/pengaturan/jam-kerja"
              element={<FiturSegera judul="Jam Kerja" fase="Fase 3" />}
            />
            <Route
              path="/pengaturan/hari-libur"
              element={<FiturSegera judul="Hari Libur" fase="Fase 1" />}
            />
            <Route
              path="/pengaturan/sistem"
              element={<FiturSegera judul="Pengaturan Sistem" fase="Fase 3" />}
            />
            <Route
              path="/pengaturan/kop-surat"
              element={<FiturSegera judul="Kop Surat" fase="Fase 5" />}
            />
            <Route
              path="/pengaturan/penandatangan"
              element={<FiturSegera judul="Penandatangan" fase="Fase 5" />}
            />
            <Route
              path="/pengaturan/tv"
              element={<FiturSegera judul="Pengaturan Layar TV" fase="Fase 6" />}
            />
            <Route
              path="/pengaturan/pengguna"
              element={<FiturSegera judul="Pengguna & Peran" fase="Fase 1" />}
            />
            <Route
              path="/pengaturan/audit-log"
              element={<FiturSegera judul="Audit Log" fase="Fase 1" />}
            />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
