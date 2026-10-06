# Catatan Keputusan — SIPANDU

Dokumen ini mencatat asumsi yang dipakai dan penyimpangan dari
`spesifikasi-aplikasi-presensi-smk.md`, sesuai Petunjuk Untuk Agent butir 5.
Asumsi default yang sudah tertulis di Bagian 13 dokumen tidak diulang di sini.

Tanggal: 6 Oktober 2026 · Fase selesai: 0 (kerangka dua repo & UI), 1 (master data & Info Sekolah), 2 (plotting & jadwal), 3 (presensi & pengajuan)

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

### Advisory dependensi

| Paket | Versi | Keparahan | Lingkup | Status |
|---|---|---|---|---|
| `react-router` / `react-router-dom` | 6.30.6 → **7.18.4** | sedang | **produksi** | **SELESAI** — dinaikkan ke v7.18.4 |
| `vitest` | 3.2.7 | kritis | dev (perkakas uji) | belum — menuntut vitest 5.x |
| `tinypool` | 1.1.1 | kritis | dev (perkakas uji) | belum — lewat vitest 5.x |
| `@vitest/mocker` | 3.2.7 | sedang | dev (perkakas uji) | belum — lewat vitest 5.x |

`react-router-dom` 6.30.6 → **7.18.4** (commit "chore(deps): naikkan react-router-dom ke
v7.18.4"). Jejak pemakaiannya 16 berkas tetapi terbatas pada API dasar
(`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `Navigate`, `Outlet`,
`useLocation`, `useNavigate`) yang namanya sama di v7, sehingga migrasinya hanya
menuntut penyesuaian versi. Diverifikasi: typecheck & lint bersih, 31 uji lulus, build
sukses, ditambah uji asap peramban — masuk, enam navigasi klien-sisi tanpa reload penuh
(penanda `window` bertahan), catch-all 404, dan pengalihan sah (`/master/pegawai` →
masuk → kembali ke `/master/pegawai`) tetap bekerja.

Tiga advisory sisanya hanya menyentuh perkakas uji di mesin pengembang — tidak ikut ke
bundel produksi. Perbaikannya menuntut vitest 5.x (breaking) dan belum dikerjakan.

### Penghalang lingkungan — npm `allow-remote = "none"`

npm 12 di mesin ini menyetel `allow-remote = "none"` (proteksi rantai pasok bawaan),
sehingga **setiap perubahan dependensi ditolak**, termasuk `npm audit fix` dan bahkan
`npm install … --dry-run`:

```
npm error code EALLOWREMOTE
npm error Fetching packages of type "remote" have been disabled
npm error Refusing to fetch "…/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.3.3.tgz"
```

Jalan keluar: `allow-remote=root` **tidak cukup** — pesannya berubah menjadi
"Fetching non-root packages of type \"remote\" have been disabled", karena
`@tailwindcss/oxide-wasm32-wasi` adalah dependensi turunan (bukan akar).

Keputusan pemilik proyek: menyetel `allow-remote=all` di `.npmrc` **proyek** (ikut
ter-commit) agar pembaruan keamanan berikutnya tidak tertahan. Berkas itu memuat
komentar yang menjelaskan alasan dan rambunya: izin ini hanya untuk memasang paket yang
sudah ada di `package-lock.json`; menambah dependensi baru tetap harus meninjau
asal-usulnya. Rambu lain yang masih aktif dan sengaja tidak dibuka:
`allow-scripts` (skrip pemasangan tetap diblokir) dan `allow-git=none`.

---

## H. Catatan Fase 2 (plotting & jadwal)

Tanggal: 6 Oktober 2026 · Status: selesai (154 uji backend, 31 uji frontend)

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-26 | Aturan bentrok ditegakkan **berlapis**: validasi aplikasi + indeks unik database. | Aplikasi menghasilkan pesan yang menyebut pelaku bentroknya ("Bentrok guru: X sudah mengajar Y di Z"), sedangkan indeks unik menutup celah balapan dua permintaan bersamaan. `QueryException` duplikat tetap diterjemahkan menjadi pesan yang dapat dibaca, bukan 500. |
| K-27 | Pratinjau wizard menghitung **status akhir bawaan dan saran kelas tujuan di server**. | Aturan tingkat (X/XI → naik_kelas, XII → lulus) dan saran "+1 tingkat, jurusan sama" adalah aturan bisnis, jadi harus satu sumber. Frontend hanya menyajikan, tidak menghitung. |
| K-28 | Idempotensi wizard bertumpu pada `status_akhir` baris asal dan keberadaan baris plotting di tahun tujuan. | Setiap keputusan diperiksa lebih dulu; siswa yang sudah diproses dilewati dan dilaporkan, bukan digandakan atau digagalkan. Penanda "kelas selesai" dihitung dari ada/tidaknya siswa yang masih `berjalan`, sehingga tidak perlu tabel status tambahan. |
| K-29 | `pegawai_id` dan `kelas_id` pada `jadwal` didenormalisasi dari plotting (sesuai 7.3 catatan) dan **ikut diperbarui** ketika pengampu plotting diubah. | Tanpa itu, mengganti guru pengampu akan meninggalkan jadwal lama pada guru sebelumnya sehingga pengecekan bentrok (BR-06) menjadi salah. Ini diuji secara khusus. |
| K-30 | FR-PLK-06 (batalkan naik kelas) memakai `PenjagaHapus` seperti penjaga fase sebelumnya. | Aturan "selama tahun tujuan belum punya jurnal bagi siswa itu" mengacu ke tabel Fase 4. Dengan pola ini pembatalan otomatis tertutup begitu `presensi_siswa` dibuat, tanpa mengubah kode. |
| K-31 | Batas L/S guru ditegakkan **di server**, bukan hanya menyembunyikan menu. | Guru tidak dapat melihat jadwal/plotting guru lain, termasuk ketika mencoba mengirim `pegawai_id` milik orang lain — parameter itu diabaikan dan diganti dengan data pegawai miliknya sendiri. |
| K-32 | Seeder jadwal menyusun jadwal dengan offset per (hari, slot) sehingga tidak mungkin bentrok, lalu menyetel `jp_per_minggu` dari jumlah JP yang benar-benar terjadwal. | Karena setiap mapel diampu tepat satu guru, memutar indeks mapel per kelas menjamin BR-06 dan BR-07 aman sejak data awal. Menyetel JP dari hasil nyata membuat BR-09 dan FR-JDW-07 konsisten (tidak ada peringatan palsu). |
| K-33 | Rute `/plotting/kelas/mutasi` menampilkan halaman Plotting Kelas yang sama. | Mutasi adalah tindakan per siswa (tombol pada baris daftar), bukan layar tersendiri. Halaman terpisah hanya akan menduplikasi daftar yang sama. |

### Bug yang ditemukan dan diperbaiki pada Fase 2

Selain bug pada kode baru Fase 2, ada tiga cacat Fase 1 yang baru terlihat ketika dipakai:

| Bug | Akar masalah | Perbaikan |
|---|---|---|
| `meta` tambahan di respons daftar tidak pernah sampai ke klien | `ResponsDaftar::buat()` hanya menerima 2 argumen; PHP tidak mengeluh kelebihan argumen, jadi argumen ketiga dibuang diam-diam | Ditambahkan parameter `$metaTambahan` |
| `ImportMasterService` memakai tipe `?User` tanpa mengimpor `User` | Tipe parameter diselesaikan lambat; selama selalu `null` tidak pernah meledak | `use App\Models\User;` ditambahkan |
| Pelaku import pegawai tidak tercatat di `audit_log` | Controller tidak mengirim `$oleh`, sehingga nilainya `null` | Controller mengirim `$request->user()` |
| Filter plotting ambigu setelah join | `tahun_pelajaran_id` ada di `plotting_kelas` dan `kelas` → MySQL 1052 | Kolom dikualifikasi dengan nama tabel |
| `$semester->label` melempar galat resolusi relasi | `label` adalah **method**, bukan kolom | Memakai `$semester->label()` |
| Pembatalan naik kelas tidak pernah menghapus baris tujuan | Salah ketik `$asar` (variabel tak dikenal → `null`) | Memakai `$asal`; ditambah uji yang menutupnya |
| Seeder gagal: `values()` pada Builder | `values()` milik Collection | Ditambah `->get()` |
| Factory menghasilkan data tak konsisten | Plotting kelas membuat dua kelas berbeda; jadwal memakai id tetap `1` | Factory membangun rangkaian yang sah |

---

## I. Catatan Fase 3 (presensi & pengajuan)

Tanggal: 6 Oktober 2026 · Status: selesai (219 uji backend, 31 uji frontend)

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-34 | BR-12 "hanya satu lokasi default" ditegakkan **database**, bukan hanya layanan, lewat kolom bantu `penanda_default` (1 untuk default, NULL untuk sisanya) pada indeks unik. | MySQL mengizinkan banyak NULL pada indeks unik, sehingga pola ini memberi jaminan "maksimal satu" tanpa tabel tambahan. Diverifikasi langsung: default kedua ditolak (duplikat 1062) sementara lokasi non-default boleh banyak. |
| K-35 | Presensi **satu baris per pegawai per tanggal** yang memuat kolom masuk dan pulang berdampingan, bukan dua tabel terpisah. | BR-10 (satu masuk, satu pulang per hari) menjadi indeks unik `(pegawai_id, tanggal)`, dan keadaan "pulang tanpa masuk" secara struktural tidak mungkin tersimpan. Status hari itu juga dapat dibaca dengan satu query — penting untuk monitoring harian. |
| K-36 | Foto presensi disimpan di disk **privat** dan disajikan lewat endpoint berpelindung otorisasi (pemilik atau peran pemantau), bukan URL publik. | Foto wajah pegawai bersifat pribadi dan dipakai pada halaman monitoring. Otorisasi diperiksa per permintaan, dan foto hilang karena retensi dijawab 404 dengan penjelasan, bukan 500. |
| K-37 | Batas foto presensi memakai setelan `foto_target_maks_kb` (150 KB), **terpisah** dari `MAKS_HASIL_BYTE` milik logo sekolah (300 KB). | BR-29 menyebut 150 KB sedangkan FR-SCH-04 menyebut 300 KB untuk logo. Menyatukan keduanya akan melanggar salah satu; karena itu jalur foto presensi punya penurunan kualitas bertahap dan, bila perlu, penurunan dimensi. |
| K-38 | Watermark digambar memakai **font bawaan GD** (tanpa berkas TTF di repositori). | Terverifikasi berjalan dan mengubah piksel. Menghindari menambahkan biner font ke repo dan tetap bekerja di Linux produksi. Trade-off: ukuran huruf terbatas; bila kelak perlu lebih besar, tambahkan TTF ke `resources/fonts` dan setel `filename()` pada FontFactory. |
| K-39 | Akurasi GPS yang lebih buruk dari `gps_max_akurasi_m` **menolak** presensi, tidak diperlakukan sebagai "di luar radius". | Sesuai FR-PRS-06. Perbedaannya penting: luar radius adalah persoalan izin (dapat ditinjau admin), sedangkan akurasi buruk adalah persoalan teknis yang harus dicoba lagi — mencampurnya akan membuat antrean persetujuan penuh oleh presensi yang sebenarnya bisa dikirim ulang. |
| K-40 | Presensi pada hari **bukan hari kerja** atau hari libur ditolak dengan pesan jelas. | Jam kerja (FR-LOK-04) hanya bermakna bila hari kerja benar-benar ditegakkan; tanpa ini, perhitungan alpa dan kepatuhan menjadi tidak konsisten. Admin tetap dapat mengoreksi bila ada keadaan khusus (FR-PRS-13). |
| K-41 | Pengajuan luar radius disimpan **satu baris per tanggal**, bukan rentang. | Membuat BR-17 Jalur A deterministik: pencocokan pengajuan dengan presensi cukup satu pencarian `(pegawai_id, tanggal)` dan dijaga indeks unik. Rentang dari dinas (FR-IZN-02) dipecah per hari kerja saat persetujuan. |
| K-42 | Penurunan pengajuan luar radius dari dinas yang disetujui dilakukan **saat persetujuan**, dan `updateOrCreate` agar aman diulang. | Persetujuan dapat dilakukan ulang atau diperbaiki; `updateOrCreate` mencegah galat duplikat. Menolak dinas membatalkan turunan yang sudah terlanjur disetujui. |
| K-43 | Status hadir/terlambat dihitung **saat presensi dikirim** dan disimpan, bukan dihitung ulang saat keputusan. | BR-18. Diuji khusus: presensi terlambat 30 menit tetap terlambat 30 menit setelah admin menyetujui. |
| K-44 | Presensi yang **ditolak** boleh dikirim ulang pada hari yang sama; rekaman lama tercatat di `audit_log`. | FR-PRS-07 menyebut perilaku ini eksplisit. Baris tetap satu (BR-10), hanya isinya diganti, dan foto lama dihapus agar tidak menumpuk. |
| K-45 | Kategori monitoring dihitung **saat diminta**, tidak disimpan. | Status dapat berubah tanpa aksi apa pun (mis. tenggat pulang terlewat), sehingga nilai tersimpan akan cepat basi. Perhitungan ulang juga menjadi sumber tunggal kebenaran dengan laporan pada Fase 5 (BR-37). |
| K-46 | Batas L/S untuk foto presensi dan monitoring ditegakkan di **server**, bukan hanya menyembunyikan menu. | Guru hanya melihat jadwal dan plotting miliknya (Fase 2) dan hanya foto presensinya sendiri di sini; peran pemantau (admin/kepsek/wakasek) yang boleh melihat foto pegawai lain. |

### Bug yang ditemukan dan diperbaiki pada Fase 3

| Bug | Akar masalah | Perbaikan |
|---|---|---|
| `GET /jam-kerja` gagal **500** pada database tanpa baris jam kerja | Akses offset pada Collection **melempar galat** bila kunci tidak ada (`Collection::offsetGet`), sehingga `?->` tidak menolong — galatnya terjadi saat pengambilan kunci | Diganti `->get($kunci)` |
| Koreksi presensi admin **tidak pernah berefek** | `array_keys($model->getFillable())` menghasilkan indeks 0,1,2… sedangkan `getFillable()` sudah berupa daftar nama kolom, sehingga tidak ada kolom yang lolos | Memakai `getFillable()` langsung |
| Presensi `valid` bisa salah dikategori sebagai "luar radius" | Kategori disimpulkan dari `lokasi_id` kosong, padahal presensi valid selalu punya lokasi | Disimpulkan dari validasi `disetujui` + lokasi kosong |
| Seluruh unggahan multipart berisiko rusak | `api.ts` menyetel `Content-Type: application/json` sebagai header bawaan, yang ikut terkirim pada FormData sehingga boundary peramban tidak dipakai | Interceptor melepas `Content-Type` saat data berupa FormData |
| `drawRectangle` gagal | Tanda tangan Intervention v3 adalah `($x, $y, $init)`; lebar/tinggi diatur di dalam closure, bukan argumen terpisah | Disusun ulang sesuai API v3 |
| Relasi `Pegawai::lokasi()` meledak saat dipanggil | `BelongsToMany` dipakai tanpa diimpor (laten: tipe parameter baru diperiksa saat dipakai) | Impor ditambahkan |
| Halaman presensi menampilkan "Bukan hari kerja" saat permintaan gagal | Penanda hari diperiksa dengan `!data?.is_hari_kerja`, sehingga data yang tidak ada tampil seolah hari libur | Dijaga `data !== undefined` dan keadaan gagal dijelaskan apa adanya |

---

## J. Ilustrasi guru (penggantian aset, 6 Oktober 2026)

Permintaan pemilik: mengganti ilustrasi guru buatan sendiri dengan satu gambar kiriman,
diterapkan ke **semua** tampilan yang memuat ilustrasi guru.

**Gambar sumber** `Friendly Teacher Dashboard Illustration.png` (1536×1024, 1,19 MB)
berisi mockup dashboard di kiri dan dua guru di kanan (pria berpeci berkemeja koko putih,
wanita berhijab).

| No | Keputusan | Alasan / dampak |
|---|---|---|
| K-47 | Gambar **dipotong**, tidak dipakai utuh: mockup dashboard di bagian kiri dibuang. | Bagian itu akan menduplikasi tampilan dashboard asli tepat di belakangnya — persis elemen berulang yang ditolak pemilik. Batas potong ditentukan dari data piksel, bukan perkiraan: batang kartu berakhir di x≈792 dan badan pria mulai x≈805. Potongan diverifikasi memuat 0,9% (grup) dan 0% (tunggal) piksel kartu. |
| K-48 | Dua aset dari satu gambar: `guru-grup` (kedua guru) dan `guru-tunggal` (wanita saja). | Mengikuti struktur lama (grup untuk beranda & landing, tunggal untuk halaman masuk). Guru pria dieja terlalu ramping sebagai figur tunggal (rasio 0,23) sehingga wanita (0,44) yang dipakai. |
| K-49 | Latar dibuat **transparan**, bukan dibiarkan buram. | Latar gambar (244,249,253) hampir putih, sedangkan latar aplikasi `--color-app` = #cfe3f1 (biru muda). Gambar buram akan memunculkan persegi terang yang jelas terlihat. |
| K-50 | Transparansi memakai pemisah **m = b−r**, bukan sekadar jarak ke warna latar. | Kemeja koko putih (246,244,248) nyaris sama dengan latar (244,249,253) pada jarak warna biasa; yang membedakan adalah coraknya: latar kebiruan (m = +8…+15) sedangkan koko netral (m = 0…4). Gerbang kecerahan juga ditambahkan karena peci gelap pun ber-m = +6 — tanpa gerbang itu peci ikut berlubang. Hasil ukur: latar 100% transparan, kemeja koko 99,4% utuh (sisanya tepi anti-aliasing). |
| K-51 | Format **WebP**, bukan PNG. | Sumber 1,19 MB → 12,8 KB + 9,0 KB. Aplikasi ini PWA yang sudah menuntut peramban modern (kamera/getUserMedia pada Fase 3), sehingga dukungan WebP pasti ada. |
| K-52 | Ukuran hasil dibatasi 2× ukuran tampil terbesar (520 px dan 640 px tinggi). | Cukup tajam di layar retina tanpa membengkakkan bundel. Precahce bertambah 14,8 KiB (5,4 KB SVG → 22,3 KB WebP) — kenaikan yang disadari, karena raster menggantikan vektor. |

**Konsekuensi tata letak yang perlu diketahui:** aset baru lebih ramping daripada SVG lama
(grup 0,900 → 0,710; tunggal 0,769 → 0,442). Karena ketiga pemakaian mengatur tinggi dengan
`w-auto`, lebarnya mengecil — halaman masuk dari ~246 px menjadi 142 px. Untuk hiasan sudut
ini dinilai lebih rapi, tetapi bila kelak terasa terlalu kecil, ubah kelas tinggi di
`LoginPage.tsx`, bukan memotong ulang gambarnya.

**Verifikasi:** kedua berkas tersaji `HTTP 200 image/webp`; `guru-grup` termuat di landing
(369×520 → tampil 182×256) dan `guru-tunggal` di halaman masuk (283×640 → tampil 142×320),
keduanya dengan rasio terjaga. Ilustrasi beranda **belum terverifikasi secara visual** karena
hanya dirender pada breakpoint < 1024 px (`BerandaMobile`) dan alat uji yang dipakai tidak
dapat menyetel lebar viewport; asetnya sama dengan yang terbukti termuat di landing.

### Revisi K-47..K-52 (6 Oktober 2026, setelah penilaian pemilik)

Pemilik menilai hasil potongan **terlihat terpotong**, dan memberikan versi SVG dari
ilustrasi yang sama. Pendekatan potong-lalu-WebP pada K-47..K-52 karena itu **dibatalkan**
dan diganti satu SVG utuh. Alasan teknis mengapa ini lebih baik, bukan sekadar mengikuti
permintaan:

| Aspek | Potongan WebP (dibatalkan) | SVG utuh (dipakai) |
|---|---|---|
| Bagian gambar | 2 potongan, mockup dashboard dibuang | Utuh 1200x800, tidak ada yang hilang |
| Berat | 22,3 KB (dua berkas) | 6,84 KB, gzip 1,97 KB |
| Ketajaman | raster 2x, pecah bila diperbesar | vektor, tajam di segala ukuran |
| Precahce PWA | 1050,60 KiB | 1035,90 KiB (lebih baik dari sebelum perubahan) |
| Latar | perlu dijadikan transparan | sudah transparan |

**K-53 — SVG yang diberikan pemilik diperbaiki sebelum dipakai.** Hasil SVG-nya memang tidak
teratur, dan penyebabnya ditemukan dari pembacaan berkas, bukan dugaan:

1. **Lengan guru pria berlengan warna kulit tanpa tangan** — dua goresan `stroke="#f4bd80"`
   (30 px) dari bahu sampai ke buku, digambar *di atas* kemeja putih dan buku, tanpa bentuk
   tangan sama sekali. Akibatnya tampak berlengan telanjang menembus kemeja.
   Diukur pada kanvas: piksel kulit di area lengan/buku **16,6%** sebelum, **6,0%** sesudah —
   dan buku tidak lagi terbelah. Lengan kini koko putih bergaris tepi, dengan tangan
   digambar **setelah** buku agar memegang, bukan menembus.
2. **Garis tanah (`#d7e3ea`) nyaris tak terlihat** dan hanya membentang di bawah figur
   (x 615..1130) sehingga tampak menggantung. Gambar acuan **tidak punya** garis tanah —
   jadi dihapus, bukan dipertegas. Diverifikasi: baris y=760 kini kosong.
3. **Proporsi kepala BUKAN masalah.** Sempat saya duga kepala pria terlalu besar; pengukuran
   gambar acuan menunjukkan rasio kepala/badan 1,03 sementara SVG 1,04 — praktis sama.
   Dugaan tanpa ukur itu hampir menghasilkan "perbaikan" yang justru merusak.
4. Tangan guru wanita diberi garis jari dan lengan gaunnya diberi garis tepi agar terpisah
   dari badan gaun (sebelumnya menyatu).

**Penempatan.** Ilustrasi kini lanskap (rasio 1,5), bukan potret seperti dua SVG lama, jadi
ruang yang disediakan perlu disesuaikan di beranda mobile: judul diberi ruang kanan
`pr-24` -> `pr-44` dan tinggi ilustrasi `h-40` -> `h-32` agar tidak bertabrakan dengan teks.
Di halaman masuk dan landing, ukuran lama tetap dipakai dan rasio 1,5 terjaga utuh.

**Verifikasi.** `guru-ilustrasi.svg` termuat di landing (1200x800 -> tampil 384x256) dan
halaman masuk (-> tampil 480x320), keduanya rasio 1,500 — tidak ada yang terpotong.
Ilustrasi beranda **belum terverifikasi visual** karena hanya dirender pada breakpoint
< 1024 px (`BerandaMobile`), sedangkan alat uji tidak dapat menyetel lebar viewport.

### K-54 — Diganti lagi: PNG tanpa latar kiriman pemilik (6 Oktober 2026)

Pemilik mengirim PNG tanpa latar dan meminta **gambar itu saja dipakai untuk semuanya**,
menggantikan SVG pada K-53. SVG tersebut kini dihapus dari repositori.

**Berkas sumber** `new-pratinjau-ilustrasi-guru.png`: 1306x906, RGBA, 871,3 KB. Diperiksa
lebih dulu dan terbukti benar-benar tanpa latar: keempat sudut alpha = 0, sebaran alpha
35,1% transparan penuh / 57,1% opak / 7,8% tepi anti-aliasing. Kotak isi (0, 18, 1306, 889)
— hanya ~18 px ruang kosong atas-bawah, tidak ada sisa tepi yang perlu dipangkas.

**K-55 — Isi gambar tidak disentuh sama sekali; hanya wadah berkasnya.** Tidak ada
pemotongan dan tidak ada pengecilan. Dimensi dipertahankan penuh 1306x906 dan diverifikasi
sama antara sumber dan hasil, bersama mode RGBA dan sebaran alpha (35,11% / 57,07% / 7,82%).

| Bentuk berkas | Berat |
|---|---|
| PNG sumber | 871,3 KB |
| PNG optimize | 784,9 KB |
| WebP lossless | 414,4 KB |
| **WebP kualitas 95 (dipakai)** | **62,9 KB** |

Alasan memakai WebP dan bukan PNG mentah: berkas ikut di-precache PWA, sehingga PNG 871 KB
akan menambah unduhan setiap pemasangan/pembaruan hampir 1 MB — pada aplikasi sekolah yang
dibuka dari ponsel, itu biaya nyata. Dampak terukur: precache 1035,90 KiB -> 1091,78 KiB
(naik 56 KiB), dibandingkan ~871 KiB bila PNG mentah dipakai. Kualitas 95 dan resolusi penuh
dipilih agar tidak ada alasan komplain soal ketajaman.

**Rasio berubah** 1,500 (SVG) -> 1,442 (PNG), jadi lebar tampil sedikit mengecil pada tinggi
yang sama: beranda 192->185 px, landing 384->369 px, halaman masuk 480->461 px. Kelas Tailwind
tidak perlu diubah.

**Verifikasi:** `guru-ilustrasi.webp` termuat di landing (1306x906 -> tampil 369x256) dan
halaman masuk (-> tampil 461x320), keduanya rasio 1,441 — tidak ada yang terpotong. Beranda
(185x128) belum terverifikasi visual karena hanya dirender pada breakpoint < 1024 px.

### K-56 — Diganti dengan PNG terbaru: hanya kedua guru (6 Oktober 2026)

Pemilik mengirim PNG tanpa latar yang baru. Perbedaannya penting dan menyelesaikan akar
keluhan "terpotong":

| | Gambar sebelumnya | Gambar sekarang |
|---|---|---|
| Ukuran | 1306x906 | **708x798** |
| Rasio | 1,442 lanskap | **0,887 potret** |
| Isi | kartu dashboard + dua guru | **dua guru saja** |
| Berat berkas sumber | 871,3 KB | 480,4 KB |

Karena gambar baru **tidak lagi memuat mockup dashboard**, tidak ada bagian yang tersisa
untuk terpotong — masalahnya hilang dari akarnya, bukan hanya dihindari. Diperiksa dan
terbukti benar-benar tanpa latar: keempat sudut alpha = 0, sebaran alpha 35,6% transparan
penuh / 59,7% opak / 4,7% tepi anti-aliasing, kotak isi (0, 30, 708, 798).

**K-57 — Tata letak beranda dipulihkan.** Rasio baru (0,887) hampir sama dengan ilustrasi
asli (0,900), sehingga penyesuaian yang dulu dibuat untuk gambar lanskap tidak diperlukan
lagi dan **dikembalikan**: judul `pr-44` -> `pr-24`, tinggi ilustrasi `h-32` -> `h-40`.
Pada h-40 lebarnya 142 px — praktis sama dengan desain asli (144 px). Jadi beranda kembali
ke tampilan semula, bukan sekadar diberi gambar baru.

**K-58 — Isi tetap tidak disentuh.** Tanpa potong, tanpa perkecil: dimensi 708x798 dan
sebaran alpha diverifikasi identik antara sumber dan hasil. Hanya wadah berkas berubah,
PNG 480,4 KB -> WebP 45,5 KB (kualitas 95). Dampak: precache 1091,78 KiB -> 1074,31 KiB.

Lebar tampil: beranda 142 px, landing 227 px, halaman masuk 284 px. Sumber setinggi 798 px
lebih dari cukup untuk pemakaian retina terbesar (butuh 568 px).

**Verifikasi:** termuat di landing (708x798 -> tampil 227x256) dan halaman masuk
(-> tampil 284x320), keduanya rasio 0,887 — tidak ada yang terpotong. Beranda (142x160)
belum terverifikasi visual karena hanya dirender pada breakpoint < 1024 px.
