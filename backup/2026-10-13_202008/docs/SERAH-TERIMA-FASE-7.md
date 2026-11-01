# Serah Terima Fase 7 (Penutup) — SIPANDU Frontend

Tanggal: 6 Oktober 2026
Repo: `au-frontend` (Vite + React 18 SPA)
Status: **Fase 0–7 SELESAI.** Dokumen ini adalah penutup rangkaian serah-terima.

---

## 1. Angka akhir (terverifikasi)

| Ukuran | Nilai |
|---|---|
| Uji Vitest | **65 lulus / 10 berkas** |
| typecheck | bersih |
| lint | nol masalah |
| build | sukses (`vite v6.4.3`, 22,90 s) |
| Bundel utama | **452,50 kB (gzip 139,99)** — turun dari 878,26 kB |
| precache | 113 entri / 1.202,27 KiB |
| Rute | 42 rute berat dimuat malas (`React.lazy`) |

Backend pendamping: 355 uji lulus / 1.449 assertion, Pint bersih 304 berkas, 175+ rute API.

---

## 2. Yang dikerjakan di Fase 7

### 2.1 Code-splitting (K-83)
Akar masalahnya bukan konfigurasi build, melainkan **impor statis + dinamis bercampur** pada
`@/lib/api`: `src/features/presensi/api.ts` memakainya lewat `await import()` sementara ~36
berkas lain mengimpornya statis. Selama keduanya ada, Vite tidak akan pernah memecah chunk.
Impor dinamis dihapus, lalu 42 rute berat dipindah ke `React.lazy` di dalam `Suspense`.

Hasil terukur: **878,26 kB → 452,50 kB** (turun 48,5%), peringatan Vite "chunks larger than
500 kB" hilang. `chunkSizeWarningLimit` **tidak** dipakai — itu hanya membungkam gejalanya.

### 2.2 Dashboard 5.17
`useDashboardRingkas.ts` + `BagianDashboard.tsx`: ringkasan bulan ini (hadir, terlambat,
izin/sakit/cuti/dinas, bar persentase kehadiran) dan pengajuan terakhir. Angkanya diambil
dari **endpoint laporan yang sudah ada**, bukan dihitung ulang di klien, sehingga tidak
mungkin berbeda dari halaman laporan.

### 2.3 PWA
Ikon PNG 192/512 + satu maskable, `display: standalone`, `theme_color` `#1E2A8A`, shortcuts
(Presensi, Beranda, Riwayat), plus ajakan pasang lewat `KartuPasangPwa`. Manifest dihasilkan
`vite-plugin-pwa`.

---

## 3. Kewajiban sebelum menyebar ke produksi

1. **`FRONTEND_URL` di backend harus menunjuk domain frontend produksi.** CORS dibatasi ketat
   ke nilai itu; salah isi berarti seluruh permintaan dari peramban ditolak.
2. **Uji di perangkat sungguhan.** Beranda mobile **belum** diverifikasi secara visual — alat
   peramban otomasi di lingkungan ini tidak dapat menyetel lebar viewport. Mohon diperiksa
   dari ponsel pada 360–414 px.
3. **Uji layar TV pada resolusi aslinya** (1920×1080 dan 1366×768). Kanvasnya berskala
   seragam dan tidak menggulir, jadi yang perlu dipastikan adalah tidak ada elemen terpotong.

---

## 4. Utang teknis yang jujur diserahkan

| Utang | Keadaan | Langkah berikutnya |
|---|---|---|
| **Suite backend sesekali flaky** | Uji `LaporanEksporTest` (ekstraksi teks PDF) pernah gagal sekali lalu lulus pada run berikutnya tanpa kode berubah; pernah juga muncul di CI. Tiga run suite penuh lokal berturut-turut hijau, jadi tidak dapat direproduksi dengan andal. | Parsing sudah diganti dari regex-atas-data-biner menjadi penelusuran offset byte, tetapi **penyebab pastinya belum terbukti**. Anotasi CI sekarang memancarkan nama uji yang gagal sehingga kejadian berikutnya akan langsung menunjuk sasaran. |
| **Verifikasi visual mobile** | Belum dapat dilakukan dengan alat yang ada. | Periksa manual dari ponsel. |
| **Advisory npm** | 3 peringatan pada `vitest`/`tinypool`/`@vitest/mocker` — hanya perkakas uji, tidak ikut ke produksi. | Ikut hilang saat vitest dinaikkan versinya. |

---

## 5. Cara menjalankan

```bash
# Backend (terminal 1)
cd au-backend
php artisan migrate --seed
php artisan serve                # http://127.0.0.1:8000

# Frontend (terminal 2)
cd au-frontend
npm install
npm run dev                      # http://127.0.0.1:5173
```

Akun: `admin` / `Sipandu#2026`; guru: NIP `197801012006041002`.

Pemeriksaan mutu sebelum menyerahkan perubahan:

```bash
# Frontend
npm run typecheck && npm run lint && npm run test && npm run build

# Backend
vendor/bin/pint --test
php artisan test
```

---

## 6. Berkas yang jadi rujukan berikutnya

- `docs/SERAH-TERIMA-FASE-5.md` — laporan, kop/TTD, ekspor PDF/Excel.
- `docs/SERAH-TERIMA-FASE-6.md` — layar TV, pengumuman, landing.
- `CATATAN-KEPUTUSAN.md` (bagian K–M) — seluruh keputusan beserta alasannya.
- `../spesifikasi-aplikasi-presensi-smk.md` — **sumber kebenaran** bila ada pertentangan.
