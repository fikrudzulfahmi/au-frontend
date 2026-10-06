/** Jalur yang dipakai bila tujuan tidak memenuhi syarat. */
export const JALUR_BAWAAN = '/dashboard'

/**
 * Menyaring tujuan pengalihan agar selalu berupa jalur internal aplikasi.
 *
 * Halaman masuk mengalihkan pengguna ke halaman yang tadi diminta. Nilai itu berasal
 * dari `location.pathname` (lewat RequireAuth) sehingga dapat dipengaruhi URL yang
 * dikirim penyerang. Tanpa penyaringan, tautan yang dibuat khusus dapat membuat
 * pengguna terlempar ke situs lain setelah berhasil masuk (open redirect) — ini jalur
 * yang dipakai advisory react-router terkait penanganan backslash.
 *
 * Hanya menerima jalur absolut internal yang sederhana; selain itu jatuh ke /dashboard.
 */
export function jalurAman(kandidat: unknown): string {
  if (typeof kandidat !== 'string') return JALUR_BAWAAN

  const jalur = kandidat.trim()
  if (jalur === '') return JALUR_BAWAAN

  // Wajib jalur absolut internal.
  if (!jalur.startsWith('/')) return JALUR_BAWAAN

  // '//situs' dan '/\situs' adalah URL tanpa protokol (protocol-relative) — keluar aplikasi.
  if (jalur.startsWith('//') || jalur.startsWith('/\\')) return JALUR_BAWAAN

  // Backslash: pernah lolos pemeriksaan pustaka sehingga menimbulkan pengalihan keluar.
  if (jalur.includes('\\')) return JALUR_BAWAAN

  // Bentuk ter-encode dari backslash, slash, dan NUL. Nilai di sini belum tentu sudah
  // didekode, sehingga '%5C' harus ditolak sama seperti backslash itu sendiri.
  if (/%5c|%2f|%00|%0d|%0a/i.test(jalur)) return JALUR_BAWAAN

  // Karakter kendali (termasuk hasil dekode %0d%0a) tidak diizinkan.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(jalur)) return JALUR_BAWAAN

  return jalur
}
