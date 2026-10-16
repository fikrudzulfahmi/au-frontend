import type { StatusVarian } from '@/components/ui/StatusBadge'

import type { RingkasanKelasHarianItem, SesiKelasHarian } from './types'

/**
 * Aturan tampilan keterisian jurnal (FR-LAP-13) yang dipakai bersama oleh
 * ringkasan berbentuk tabel (halaman laporan) dan berbentuk kartu (beranda),
 * supaya dua tampilan tidak pernah memberi label berbeda untuk data yang sama.
 */

/** Label + warna status satu sesi mengajar. */
export interface StatusTampilan {
  teks: string
  varian: StatusVarian
}

/**
 * Status satu kelas pada hari laporan.
 *
 * - 'Tidak ada jadwal' bila kelas tanpa jadwal (tanpa_jadwal = true atau sesi = 0),
 *   jangan sampai dianggap atau diberi label 'belum terisi'.
 * - 'N belum diisi' bila masih ada sesi mengajar yang jurnalnya belum diisi guru.
 * - 'Lengkap' bila seluruh sesi terjadwal telah terisi atau berhalangan dengan izin.
 */
export function tentukanStatusKelas(item: RingkasanKelasHarianItem): StatusTampilan {
  if (item.tanpa_jadwal || item.sesi === 0) {
    return { teks: 'Tidak ada jadwal', varian: 'netral' }
  }

  if (item.belum > 0) {
    return { teks: `${item.belum} belum diisi`, varian: 'bahaya' }
  }

  return { teks: 'Lengkap', varian: 'sukses' }
}

/**
 * Status satu sesi mengajar.
 *
 * 'berhalangan' sengaja berbeda dari 'belum': sesi dengan izin disetujui bukan
 * kelalaian guru, dan hanya sesi yang belum terisi tanpa izin yang perlu ditagih.
 *
 * Kata yang dipakai ("Sudah diisi" / "Belum diisi") mengikuti kolom Status pada
 * tabel rincian laporan, supaya satu halaman tidak memakai dua istilah berbeda.
 */
export function tentukanStatusSesi(sesi: SesiKelasHarian): StatusTampilan {
  if (sesi.status === 'sudah') {
    return { teks: 'Sudah diisi', varian: 'sukses' }
  }

  if (sesi.status === 'berhalangan') {
    return { teks: 'Berhalangan', varian: 'izin' }
  }

  return { teks: 'Belum diisi', varian: 'bahaya' }
}

/** Sesi pada satu kelas yang jurnalnya belum diisi — inti pertanyaan pemantau. */
export function sesiBelum(k: RingkasanKelasHarianItem): SesiKelasHarian[] {
  return (k.daftar ?? []).filter((s) => s.status === 'belum')
}

/**
 * Urutan baca: kelas yang masih menggantung lebih dulu.
 *
 * Seluruh kelas tetap ditampilkan (permintaan pemantau), tetapi kelas yang
 * belum lengkap tidak boleh tersembunyi di antara kelas yang sudah aman —
 * karena itu yang belum terisi naik ke atas, kelas tanpa jadwal turun ke bawah.
 */
export function urutkanKelas(data: RingkasanKelasHarianItem[]): RingkasanKelasHarianItem[] {
  return [...data].sort((a, b) => {
    if (a.tanpa_jadwal !== b.tanpa_jadwal) return a.tanpa_jadwal ? 1 : -1
    if (a.belum !== b.belum) return b.belum - a.belum
    return a.nama.localeCompare(b.nama)
  })
}

/**
 * Label jam satu sesi untuk tampilan kartu.
 *
 * Sesi dua jam (blok) ditulis sebagai rentang ("Jam ke-3–4") karena pada kartu
 * satu baris = satu sesi, sehingga rentang harus terbaca dari barisnya sendiri.
 * Sesi satu jam memakai label dari server agar tetap konsisten dengan laporan.
 */
export function labelJam(sesi: SesiKelasHarian): string {
  return sesi.jam_ke_selesai > sesi.jam_ke_mulai
    ? `Jam ke-${sesi.jam_ke_mulai}–${sesi.jam_ke_selesai}`
    : sesi.label_jam
}

/**
 * Sesi pada satu kelas menurut urutan jam mengajar.
 *
 * Daftar dari API sudah terurut, tetapi kartu menampilkan jam sebagai baris
 * sehingga urutan jam harus dijamin di sini juga (mis. data tersaring).
 */
export function sesiTerurut(k: RingkasanKelasHarianItem): SesiKelasHarian[] {
  return [...(k.daftar ?? [])].sort((a, b) => a.jam_ke_mulai - b.jam_ke_mulai)
}
