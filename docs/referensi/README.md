# Referensi desain (FR-UI / 5.22)

Letakkan salinan tangkapan layar aplikasi kepegawaian **SIKEPO** yang diunggah
pemilik proyek di folder ini (mis. `sikepo-beranda.png`, `sikepo-bottom-menu.png`,
`sikepo-layanan.png`).

Yang ditiru adalah **gaya, tata letak, dan nuansa warna**-nya saja — bukan logo,
nama, atau merek SIKEPO. Identitas yang dipakai adalah **SIPANDU** (nama aplikasi)
dan **SMK Islam Anharul Ulum** (sekolah).

Rujukan yang sudah diterapkan pada Fase 0:

| Elemen referensi | Penerapan di repo ini |
|---|---|
| Latar biru muda penuh | token `--color-app` (`#CFE3F1`) pada `src/styles/tokens.css` |
| Kartu putih membulat besar | kelas `.card` (`--radius-card: 28px`) |
| Kartu "Presensi & Kinerja" | `src/components/ui/PresensiKinerjaCard.tsx` |
| Gauge setengah lingkaran bersegmen | `src/components/ui/GaugeMenitKerja.tsx` |
| Grid 4 kolom ikon bulat pastel | `src/components/ui/LayananGrid.tsx` |
| Bottom menu dengan lekuk cekung & tombol tengah melayang | `src/layouts/BottomNav.tsx` |
| Ilustrasi guru berseragam khaki | `src/assets/ilustrasi/guru-khaki-*.svg` (placeholder, A-18) |

Token warna adalah perkiraan dari referensi dan **boleh disetel** (A-22).
