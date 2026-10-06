# Catatan Keputusan — SIPANDU

Dokumen ini mencatat asumsi yang dipakai dan penyimpangan dari
`spesifikasi-aplikasi-presensi-smk.md`, sesuai Petunjuk Untuk Agent butir 5.
Asumsi default yang sudah tertulis di Bagian 13 dokumen tidak diulang di sini.

Tanggal: 6 Oktober 2026 · Fase selesai: 0 (kerangka dua repo & UI) dan 1 (master data & Info Sekolah)

---

## A. Lingkungan

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-01 | PHP 8.3 dipasang **terpisah** di `C:\php83` sebagai runtime CLI proyek. XAMPP tetap memakai PHP 8.2. | Spesifikasi meminta PHP 8.3, tetapi XAMPP pada mesin ini berisi PHP 8.2 dan dipakai bersama proyek lain. Menimpa PHP XAMPP berisiko merusak proyek tersebut. Skrip penyiapan: `tools/siapkan-php83.py`. |
| K-02 | Basis data uji memakai **MySQL/MariaDB** (`sipandu_test`), bukan SQLite in-memory. | Ekstensi `pdo_sqlite` tidak aktif pada PHP XAMPP asli dan sebagian tipe kolom berbeda; menguji pada mesin yang sama dengan produksi lebih meyakinkan. |
| K-03 | Pest dipakai pada versi 3.x (phpunit 11.5), sedangkan Pest 4.x menuntut phpunit 12. | Menjaga kesesuaian dengan skeleton Laravel 12 yang mengunci `phpunit/phpunit ^11.5`. |

## B. Model data

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-04 | Tabel **`pegawai`** dibuat pada Fase 0, bersama tabel kelompok 7.1. | `users.pegawai_id` (7.1) adalah foreign key ke `pegawai` sehingga tabel induknya harus ada lebih dulu. Fase 1 tetap menambahkan CRUD, import/export, dan penetapan lokasi pegawai. |
| K-05 | Kolom `name` dan `email` tetap ada pada `users` (bawaan Laravel) walau tidak disebut di 7.1. Login memakai `username`. | `name` dipakai sebagai nama tampilan cadangan untuk akun yang tidak terhubung pegawai (mis. admin); `email` **nullable** dan tidak dipakai untuk autentikasi karena tidak semua pegawai punya email sekolah. |
| K-06 | Kolom `profil_sekolah.npsn` dan `nama_kepala_sekolah` dibuat **nullable** walau Bagian 7.6 menandainya wajib. | Bagian 10 secara eksplisit meminta kedua nilai ini **dikosongkan** pada seeder awal ("jangan diisi data karangan"). Kewajiban diisi ditegakkan pada validasi formulir admin (Fase 1, FR-SCH-04), bukan pada skema. |
| K-07 | Seeder membuat akun login untuk **seluruh 10 pegawai contoh**, bukan hanya admin/kepsek/wakasek. | FR-PEG-02 menyatakan setiap pegawai dapat dibuatkan akun; tanpa akun guru, beranda guru dan alur jurnal tidak dapat diuji. Seluruh akun memakai password awal yang wajib diganti. |
| K-08 | Baris `penandatangan` contoh memakai `nama` berisi string kosong. | Bagian 10 meminta satu penandatangan "Kepala Sekolah" dengan nama kosong sampai diisi admin, sedangkan kolom `nama` bersifat wajib (7.1). |

## C. Perilaku aplikasi

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-09 | `wajib_ganti_password` ditegakkan sebagai **gerbang lunak di UI**: pengguna melihat peringatan menonjol dan ditawarkan mengganti password, tetapi tidak dikunci dari seluruh aplikasi. | FR-SEC-04 menyatakan password awal wajib diganti, namun tidak menetapkan hukuman bila belum dilakukan. Gerbang lunak menjaga kepatuhan tanpa menghalangi peninjauan aplikasi. Ubah menjadi gerbang keras pada `RequireAuth` bila diinginkan. |
| K-10 | Data pada beranda Fase 0 (`usePresensiHariIni`, `useRingkasanHariIni`, daftar pengumuman) adalah **data contoh** di sisi frontend. | KP-0.5 memang meminta kartu *Presensi & Kinerja* dan grid layanan tampil dengan data dummy. Hook-nya sudah menyiapkan pemanggilan endpoint `GET /presensi/hari-ini` dan `GET /monitoring/presensi-harian/ringkasan` yang akan diisi pada Fase 3. |
| K-11 | Pengumuman, layar TV, pengaturan, master data, dan seluruh laporan pada Fase 0 berupa **halaman penanda fase**. | Petunjuk butir 2 dan 4: jangan membangun fitur dari fase yang belum diminta; halaman disiapkan agar navigasi lengkap sesuai Bagian 8.1. |
| K-12 | Landing page memuat bagian pengumuman hanya bila daftarnya tidak kosong (FR-LND-05). | Pengumuman baru ada pada Fase 6 (`pengumuman`), sehingga pada Fase 0 bagian ini tidak dirender — sesuai FR-LND-05 yang meminta bagian disembunyikan bila kosong. |
| K-13 | `FRONTEND_URL` menerima beberapa origin dipisah koma (bawaan memuat `localhost:5173` dan `127.0.0.1:5173`). | CORS hanya mengizinkan origin yang terdaftar (3.3); kedua bentuk alamat itu dipakai bergantian pada pengembangan dan keduanya adalah origin yang berbeda bagi peramban. |

## D. Aset & desain

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-14 | Ilustrasi guru khaki memakai **placeholder SVG** di `src/assets/ilustrasi/`. | A-18 dan FR-UI-18 memperbolehkan placeholder sampai aset resmi dibuat pemilik proyek. Berkas mudah diganti tanpa mengubah komponen. |
| K-15 | Tangkapan layar referensi SIKEPO belum tersedia, sehingga `docs/referensi/` baru berisi keterangan tempat. | FR-UI meminta salinan tangkapan layar disimpan di `docs/referensi/`; token warna pada `src/styles/tokens.css` mengikuti tabel 5.22 dan boleh disetel (A-22). |
| K-16 | Ikon PWA dibuat terprogram lewat `tools/buat-ikon.php` (GD) alih-alih berkas desain. | Menjaga repo tanpa berkas biner tambahan dan memudahkan pembuatan ulang pada ukuran lain. |

## E. Yang sengaja belum dikerjakan

Sesuai Bagian 12 (di luar cakupan) dan Bagian 11 (kerja per fase), hal berikut
belum ada dan tidak akan ditambahkan tanpa permintaan: notifikasi WhatsApp/SMS/email,
integrasi Dapodik, penilaian/keuangan, akun siswa, aplikasi native,
SSR untuk landing, layar TV interaktif, mode gelap aplikasi, multi-sekolah,
pengenalan wajah, dan guru pengganti/team teaching.

---

## F. Catatan Fase 1 (master data & Info Sekolah)

Tanggal: 6 Oktober 2026 · Status: selesai (94 uji backend, 24 uji frontend)

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-17 | Penjaga penghapusan (`App\Support\PenjagaHapus`) memeriksa **keberadaan tabel** rujukan sebelum menolak. | FR-SIS-06, FR-KLS-05, dan FR-MPL-03 mengacu ke tabel yang baru ada pada fase berikutnya (`plotting_mapel` Fase 2, `presensi_siswa`/`jurnal` Fase 4). Dengan pola ini penjaga **otomatis aktif** begitu tabelnya dibuat, tanpa mengubah controller. Selama tabelnya belum ada, penghapusan tetap berupa soft delete sehingga riwayat tidak benar-benar hilang. Mekanismenya diuji memakai tabel yang sudah ada. |
| K-18 | Validasi format berkas import memakai **ekstensi nama berkas + benar-benar dapat dibaca PhpSpreadsheet**, bukan aturan `mimes:`. | Berkas xlsx adalah arsip ZIP, sehingga deteksi tipe oleh server dapat melaporkannya sebagai `application/zip` dan menolak berkas yang sebenarnya sah. Memuat berkas dengan pembaca Excel adalah pemeriksaan yang paling kuat. |
| K-19 | FR-SCH-05 (tab Landing Page) mendapat endpoint sendiri: `GET/PUT /pengaturan/landing`. | Tab Landing berada pada halaman yang sama dengan Info Sekolah (5.18), sehingga berada dalam cakupan Fase 1. Nilainya tetap tersimpan di tabel `pengaturan` (7.6). |
| K-20 | Password awal akun pegawai dibuat **acak** (`Str::password(12)`) dan dilaporkan satu kali pada respons pembuatan/reset. | FR-PEG-02 meminta "password awal acak yang wajib diganti". Password awal tidak pernah disimpan dalam bentuk terbaca dan tidak pernah dikirim pada endpoint daftar. |
| K-21 | Export master data pada Fase 1 hanya **xlsx**. Permintaan `format=pdf` dijawab 422 dengan pesan jelas. | FR-SIS-04/FR-PEG-03 menyebut Excel; PDF master data memerlukan kop surat dan tanda tangan (FR-KOP-06) yang baru dibangun pada Fase 5. Dijawab 422, bukan 500, agar klien tahu alasannya. |
| K-22 | `DB_ENGINE=InnoDB` dipaksa pada konfigurasi `mysql` dan `mariadb`, ditambah `Schema::defaultStringLength(191)`. | Produksi berupa cPanel yang default engine/bagian row-formatnya tidak pasti; keduanya mencegah kegagalan `1071 Specified key was too long` dan memastikan foreign key benar-benar ditegakkan. |
| K-23 | Filter siswa per kelas/jurusan/tingkat belum aktif pada Fase 1. | Ketiganya bergantung pada `plotting_kelas` (Fase 2). Pola yang sama seperti K-17: filter memakai pemeriksaan keberadaan tabel sehingga langsung berfungsi pada Fase 2. Filter yang sudah aktif: pencarian (NIS/NISN/nama), status, dan tahun masuk. |
| K-24 | Tautan unduhan (export/template) memakai `fetch` + blob, bukan `<a href>` biasa. | Endpoint ekspor memerlukan header `Authorization: Bearer`, sehingga tautan biasa tidak dapat dipakai. |
| K-25 | Pembersihan buffer keluaran manual **tidak** dilakukan sebelum mengirim berkas XLSX. | Di dalam Laravel, `response()->download()` sudah menangani pengiriman berkas secara utuh. Pembersihan buffer manual justru menutup buffer milik kerangka uji dan membuat tes ditandai "risky" oleh PHPUnit. Untuk aplikasi PHP native (tanpa lapisan respons Laravel) pola itu tetap diperlukan. |

### Bug yang ditemukan dan diperbaiki pada Fase 1

| Bug | Akar masalah | Perbaikan |
|---|---|---|
| Tahun 4 digit (mis. `2024`) pada import tersimpan sebagai **1905-07-18** | Nilai `2024` berada di dalam rentang serial tanggal Excel (1..2958465), sehingga dibaca sebagai serial | `ExcelService::normalisasiTanggal()` tidak lagi menafsirkan bilangan bulat 1900–2100 sebagai serial; tahun dibaca lebih dahulu, dan angka 8 digit (mis. `20240517`) diperlakukan sebagai `Ymd` |
| Password awal hasil import pegawai selalu kosong | `PegawaiService::buat()` sudah membuat akun, lalu `buatAkun()` dipanggil lagi dan mengembalikan `password_awal = null` | Akun dibuat setelah pegawai tersimpan, sehingga password awalnya dapat dilaporkan |
| Nama tahun pelajaran pada factory dapat bertabrakan | `nama` dibuat acak dari rentang tahun yang sama | Factory memakai penghitung berurutan agar `nama` selalu unik |

---

## G. Catatan keamanan dependensi (6 Oktober 2026)

### Celah yang ditutup di sisi aplikasi — open redirect setelah masuk

Halaman masuk mengalihkan pengguna ke halaman yang tadi diminta, memakai nilai
`location.state.dari` yang diisi `RequireAuth` dari `location.pathname`. Karena pathname
dapat dipengaruhi URL yang dikirim penyerang, tautan yang dibuat khusus dapat membuat
pengguna terlempar ke situs lain tepat setelah berhasil masuk.

Ini jalur yang sama dengan advisory react-router pada rentang 6.0.0 - 7.17.0 (open redirect
lewat backslash pada `<Link>`/`useNavigate`, CVE-2025-68470 bypass). Selain open redirect,
advisory itu juga mencakup `deserializeErrors()` pada SSR hydration — bagian ini tidak
berlaku di sini karena SPA tanpa SSR.

Celah ditutup di sisi aplikasi lebih dulu (`src/lib/jalur.ts` → `jalurAman()`), tanpa
mengubah dependensi, karena tidak ada patch dalam rentang v6. Lihat commit "fix(auth):
cegah open redirect pada tujuan pengalihan setelah masuk" dan 7 uji di `src/lib/jalur.test.ts`.

### Advisory yang belum ditangani

| Paket | Versi | Keparahan | Lingkup | Perbaikan yang disarankan |
|---|---|---|---|---|
| `react-router` / `react-router-dom` | 6.30.6 | sedang | **produksi** | 7.18.4 (mayor, breaking) |
| `vitest` | 3.2.7 | kritis | dev (perkakas uji) | 5.0.3 (mayor, breaking) |
| `tinypool` | 1.1.1 | kritis | dev (perkakas uji) | lewat vitest 5.0.3 |
| `@vitest/mocker` | 3.2.7 | sedang | dev (perkakas uji) | lewat vitest 5.0.3 |

Hanya `react-router-dom` yang ikut terkirim ke produksi. Jejak pemakaiannya 16 berkas,
tetapi terbatas pada API dasar (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`,
`Navigate`, `Outlet`, `useLocation`, `useNavigate`) yang namanya sama di v7, sehingga
migrasinya berisiko rendah. Empat advisory lain hanya menyentuh perkakas uji di mesin
pengembang dan tidak ikut ke bundel produksi.

### Penghalang lingkungan — npm `allow-remote = "none"`

npm 12 di mesin ini menyetel `allow-remote = "none"` (proteksi rantai pasok bawaan),
sehingga **setiap perubahan dependensi ditolak**, termasuk `npm audit fix` dan bahkan
`npm install … --dry-run`:

```
npm error code EALLOWREMOTE
npm error Fetching packages of type "remote" have been disabled
npm error Refusing to fetch "…/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.3.3.tgz"
```

Jalan keluar: `npm install --allow-remote all` (atau `root`) untuk sekali jalan, atau
menyetelnya di `.npmrc`. Ini **menurunkan proteksi rantai pasok**, sehingga keputusannya
diserahkan ke pemilik proyek. Selama belum dibuka, versi dependensi tidak dapat dinaikkan
sama sekali — jadi pembaruan keamanan apa pun di fase berikutnya juga ikut tertahan.
