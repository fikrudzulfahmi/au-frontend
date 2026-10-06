# SIPANDU — Frontend (au-frontend)

SPA aplikasi **SIPANDU** (Sistem Presensi & Jurnal Digital) untuk
**SMK Islam Anharul Ulum**: landing page publik, aplikasi pegawai (mobile &
desktop), dan layar TV.

- Stack: **Vite** + **React 18** + **TypeScript**, React Router, TanStack Query, Axios, react-hook-form + zod (A-13).
- Gaya: Tailwind CSS v4 + token desain pada `src/styles/tokens.css` (5.22), font *Plus Jakarta Sans*, ikon `lucide-react`.
- PWA: `vite-plugin-pwa`, `start_url=/dashboard` (A-21).
- Dokumen spesifikasi: [`docs/spesifikasi-aplikasi-presensi-smk.md`](docs/spesifikasi-aplikasi-presensi-smk.md).
- Catatan keputusan: [`CATATAN-KEPUTUSAN.md`](CATATAN-KEPUTUSAN.md).

> Status: **Fase 0 dan Fase 1 selesai.**
> Fase 0 — kerangka UI, token desain, dua layout (bottom menu & sidebar), PWA, landing page, halaman masuk.
> Fase 1 — halaman master data (tahun pelajaran & semester, jurusan, kelas, siswa, guru & pegawai, mapel),
> import/export Excel, dan halaman pengaturan (Info Sekolah + tab Landing, hari libur, sistem, pengguna & peran, audit log).
> Halaman fitur fase berikutnya ditandai "dijadwalkan pada Fase N" (Bagian 11), tanpa fitur di luar spesifikasi.

---

## 1. Prasyarat

| Perangkat | Versi |
|---|---|
| Node.js | 20 LTS atau lebih baru |
| npm | 10 atau lebih baru |

Backend (`au-backend`) harus berjalan lebih dahulu pada `http://127.0.0.1:8000`.

---

## 2. Instalasi

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```
VITE_APP_NAME=SIPANDU
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Origin frontend harus terdaftar pada `FRONTEND_URL` di `.env` backend agar CORS
mengizinkan permintaan (bawaan: `http://localhost:5173,http://127.0.0.1:5173`).

---

## 3. Menjalankan

```bash
npm run dev        # http://localhost:5173
npm run build      # build produksi ke dist/ (termasuk manifest & service worker PWA)
npm run preview    # pratinjau hasil build
```

---

## 4. Menguji & kualitas kode

```bash
npm run test       # Vitest (utilitas & komponen kritis)
npm run typecheck  # tsc -b (strict)
npm run lint       # ESLint
npm run format     # Prettier
```

---

## 5. Struktur kode

```
src/
├── app/            router.tsx (seluruh rute Bagian 8.1), providers.tsx, RequireAuth.tsx
├── layouts/        AppShell, BottomNav, Sidebar, TopBar, PublicLayout, TvLayout
├── components/ui/  Logo, PresensiKinerjaCard, GaugeMenitKerja, LayananGrid, PageHeader,
│                   StatCard, StatusBadge, DataTable, EmptyState, ConfirmDialog, Toast,
│                   Carousel, ProgressRing, FormField, Button
├── features/       auth, dashboard, landing, sekolah, tv, umum
├── lib/            api.ts, auth, device.ts, waktu.ts (jam server), menu.ts, roles.ts, format.ts
├── assets/ilustrasi/  guru-khaki-grup.svg, guru-khaki-tunggal.svg
└── styles/tokens.css  token desain 5.22
public/icons/       ikon PWA (dibuat oleh tools/buat-ikon.php)
docs/               dokumen spesifikasi & folder referensi desain
```

### Layout responsif (FR-UI-01)

- **< 1024 px** — bottom menu 5 slot dengan tombol tengah melayang (lekuk cekung) dan ikon sidik jari;
  item aktif berlabel, tidak aktif tanpa label (FR-UI-09).
- **≥ 1024 px** — sidebar kiri 264 px (dapat diciutkan menjadi 76 px), top bar, kartu putih radius besar (FR-UI-12..14).
- Tombol tengah menjadi **Persetujuan** bagi admin yang tidak terhubung data pegawai (A-19).

### Aset ilustrasi

`FR-UI-16..18` meminta ilustrasi guru berseragam khaki. Sampai aset resmi dibuat pemilik proyek,
repo ini memakai **placeholder SVG** yang berfungsi penuh dan mudah diganti:

- `src/assets/ilustrasi/guru-khaki-grup.svg` (3 karakter, 3:4, latar transparan)
- `src/assets/ilustrasi/guru-khaki-tunggal.svg` (1 karakter)

Salinan tangkapan layar referensi visual (SIKEPO) diletakkan di `docs/referensi/`.

### Ikon PWA

```bash
C:\php83\php.exe tools/buat-ikon.php   # atau php apa pun dengan ekstensi GD
```

---

## 6. Rute

Seluruh rute mengikuti Bagian 8.1. Rute yang fiturnya baru dikerjakan pada fase
berikutnya tetap ada dan menampilkan halaman penanda fase (bukan fitur di luar dokumen).

| Kelompok | Contoh rute |
|---|---|
| Publik | `/`, `/masuk`, `/tv` |
| Setelah login | `/dashboard`, `/layanan`, `/profil`, `/ganti-password` |
| Presensi saya | `/presensi`, `/presensi/riwayat`, `/pengajuan/**` |
| Mengajar | `/mengajar/jadwal`, `/mengajar/jurnal/**`, `/wali-kelas/rekap` |
| Master & akademik | `/master/**`, `/plotting/**`, `/akademik/**` |
| Monitoring, laporan, pengaturan | `/monitoring/**`, `/persetujuan/**`, `/laporan/**`, `/pengaturan/**` |

---

## 7. Menambah tipe API

Kontrak API perubahan harus tercermin pada dokumentasi OpenAPI backend **dan**
tipe frontend dalam PR yang sama (3.1). Tipe bersama ada di `src/lib/`
(`roles.ts`, `features/sekolah/useSekolah.ts`, dst.); jangan menyalin bentuk
respons secara ad-hoc di komponen.
