# SERAH-TERIMA — Fase 6 frontend (Pengumuman, Layar TV & Landing Page)

Status: **Fase 0–5 frontend selesai.** Uji 49 lulus / 7 berkas, typecheck & lint bersih, build sukses.

---

## 1. Yang sudah siap dan TIDAK perlu dibangun ulang

| Fondasi | Letak | Dipakai untuk |
|---|---|---|
| Kerangka laporan + ekspor | `src/features/laporan/` (`config.ts`, `LaporanPage.tsx`, `HubLaporanPage.tsx`) | Contoh pola filter + tabel + ekspor yang bisa ditiru halaman pengumuman |
| Unduhan berpelindung | `src/lib/unduhan.ts` (`unduhBerkasApi`) | Bila pengumuman/TV perlu mengunduh berkas |
| Interceptor respons sadar-Blob | `src/lib/api.ts` | Pesan galat tetap sampai saat memakai `responseType:'blob'` |
| Periode | `src/lib/periode.ts` | Rentang tanggal pengumuman, jika perlu pemilih serupa |
| Tanggal aman | `formatTanggalDari()`, `tanggalLokal()` di `src/lib/format.ts` | Rentang tayang pengumuman & header jam TV |
| Jam server | `useServerClock()` di `src/lib/waktu.ts` | **Header jam TV wajib memakai ini** (BR-38), bukan jam perangkat |
| Peran | `src/lib/roles.ts` (`punyaPeran`, `ROLE`) | Menu pengaturan TV hanya untuk admin |
| Komponen | `Button` (`varian`), `DataTable` (`sembunyiMobile`), `Pagination` (`halaman/perHalaman/total/onUbah`), `Modal`, `BidangTeks`/`BidangPilihan`, `StatusBadge`, `useToast` (`tampilkan/sukses/gagal` — **tidak ada `info`**) | Semua halaman baru |

**Placeholder rute yang harus diisi** (lihat `src/app/router.tsx`): `/tv`, serta menu "Layar TV" dan "Kelola Pengumuman" yang sudah ada di sidebar.

---

## 2. Cakupan Fase 6 frontend

### 2.1 Layar TV (5.19) — tampilan **baca saja**

- **Halaman `/tv`**: meminta kode TV (BR-32). Kode benar → token TV disimpan perangkat → tidak perlu memasukkan kode lagi setelah dinyalakan ulang. Kode salah 5×/menit dikunci.
- **Tata letak tiga kolom**: presensi, jurnal, perizinan + **header jam server** (`useServerClock`) + **panel pengumuman** + **teks berjalan**.
- **Tema gelap** — satu-satunya bagian aplikasi yang bertema gelap (mode gelap aplikasi di luar cakupan).
- **KP-6.5**: saat koneksi putus, data terakhir **tetap tampil** dengan indikator "terputus", lalu pulih otomatis. Jangan mengosongkan layar saat galat.
- **KP-6.9**: diuji pada **1920×1080 dan 1366×768** tanpa elemen terpotong. TV adalah layar tetap — jangan mengandalkan gulir.
- **BR-33/KP-6.4**: layar tidak boleh menampilkan foto selfie, koordinat, NIP, nomor HP, alasan sakit (kecuali opsi aktif), atau data pribadi siswa. Siswa **hanya agregat**. Avatar pegawai = **huruf inisial**.
- **Interval refresh** mengikuti pengaturan; angka harus **sama dengan laporan** untuk tanggal yang sama (BR-37) — ambil dari endpoint TV, jangan hitung sendiri di frontend.
- Pengaturan TV (FR-TV-16): aktif/nonaktif, lihat + buat ulang kode, izinkan NPSN, interval, tema, skala font, tampilkan alasan izin, tampilkan ulang tahun, durasi rotasi panel, masa berlaku token, **daftar sesi TV aktif** + cabut, **pratinjau**.

### 2.2 Pengumuman (5.20)

- CRUD pengumuman (admin) + pengaturan target tayang (app/TV/landing) dan rentang tanggal/jam.
- **BR-36**: tayang hanya bila aktif DAN dalam rentang DAN target cocok. Yang kedaluwarsa tidak tampil tetapi tidak dihapus.

### 2.3 Landing page (5.21)

- Lengkapi bagian 5.21 yang belum ada. **BR-34**: tidak menampilkan data pegawai, siswa, atau angka kehadiran. **FR-LND-11**: target performa.

---

## 3. Jebakan yang sudah terbukti menggigit

1. **Hati-hati memakai `useToast`**: hanya `tampilkan`/`sukses`/`gagal`.
2. **Nama prop komponen**: `Button` memakai `varian` (bukan `tipe`), `DataTable` memakai `sembunyiMobile` (bukan `sembunyikanKecil`) dan **tidak punya `onKlikBaris`**, `Pagination` memakai `halaman/perHalaman/total/onUbah`.
3. **Jangan `new Date()` pada string `YYYY-MM-DD`** — harinya bergeser. Pakai `formatTanggalDari()`.
4. **Jangan `toISOString().slice(0,10)`** — pakai `tanggalLokal()`.
5. **Jangan menambah impor dinamis ke `@/lib/api`/`@/lib/crud`** — `api.ts` sudah diimpor statis dan dinamis sehingga impor dinamis tidak memecah bundel (bundel kini ~815 kB). Ini juga pekerjaan code-splitting yang masih tertunda.
6. **Wajib jalankan typecheck sebelum commit.** Subagen Fase 5 kehabisan batas sebelum menjalankan typecheck, dan menyisakan satu berkas yang tidak bisa di-parse.
7. **Peramban otomasi membatasi hal tertentu** (mis. `application/pdf` lintas-asal) — jangan menyimpulkan kode rusak hanya dari satu kegagalan acak; periksa dulu apakah ada proses lain yang sedang menyunting backend.
