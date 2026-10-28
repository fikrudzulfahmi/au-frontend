import type { AntreanPresensi, SisiPresensi } from '@/features/presensi/types'

/**
 * Satu baris antrean = satu SISI keputusan.
 *
 * Server menampung presensi yang menunggu di sisi masuk DAN/ATAU pulang dalam satu
 * baris. Bila UI menampilkan satu baris saja, keputusan untuk sisi pulang dikirim
 * tanpa `sisi` dan ditolak server ("tidak sedang menunggu keputusan") — inilah sebab
 * tombol Setujui dan Tolak sama-sama gagal pada laporan sekolah.
 */
export interface BarisAntrean {
  kunci: string
  presensi_id: number
  sisi: SisiPresensi
  pegawai: string
  nip: string | null
  tanggal: string
  jam: string | null
  jarak_m: number | null
  lat: number | null
  lng: number | null
  alasan: string | null
  /** Sisi lain yang juga masih menunggu pada presensi yang sama. */
  sisi_lain: SisiPresensi[]
}

/** Sisi yang benar-benar menunggu keputusan untuk satu baris antrean. */
export function sisiMenunggu(b: AntreanPresensi): SisiPresensi[] {
  const sah: SisiPresensi[] = []
  if (b.masuk_validasi === 'menunggu') sah.push('masuk')
  if (b.pulang_validasi === 'menunggu') sah.push('pulang')

  // Payload lama belum mengirim status kedua sisi; anggap sisi masuk yang menunggu.
  if (sah.length === 0) {
    return b.sisi_menunggu?.length ? b.sisi_menunggu : ['masuk']
  }

  return sah
}

/** Pecah antrean server menjadi baris per sisi yang bisa diputuskan. */
export function barisAntrean(daftar: AntreanPresensi[]): BarisAntrean[] {
  return daftar.flatMap((b) => {
    const semua = sisiMenunggu(b)

    return semua.map<BarisAntrean>((sisi) => {
      const pulang = sisi === 'pulang'

      return {
        kunci: `${b.presensi_id}:${sisi}`,
        presensi_id: b.presensi_id,
        sisi,
        pegawai: b.pegawai ?? '—',
        nip: b.nip,
        tanggal: b.tanggal,
        jam: pulang ? b.pulang_jam : b.masuk_jam,
        jarak_m: pulang ? b.pulang_jarak_m : b.masuk_jarak_m,
        lat: pulang ? b.pulang_lat : b.masuk_lat,
        lng: pulang ? b.pulang_lng : b.masuk_lng,
        alasan: pulang ? b.pulang_alasan_luar_radius : b.masuk_alasan_luar_radius,
        sisi_lain: semua.filter((s) => s !== sisi),
      }
    })
  })
}

/** Label sisi untuk tampilan. */
export function labelSisi(sisi: SisiPresensi): string {
  return sisi === 'pulang' ? 'Pulang' : 'Masuk'
}
