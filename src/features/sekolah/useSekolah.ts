import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api'

export interface ProfilSekolah {
  nama_sekolah: string
  npsn: string | null
  status_sekolah: 'negeri' | 'swasta' | null
  akreditasi: string | null
  tagline: string | null
  tentang: string | null
  visi: string | null
  misi: string | null
  nama_kepala_sekolah: string | null
  nip_kepala_sekolah: string | null
  alamat_jalan: string | null
  dusun: string | null
  desa_kelurahan: string | null
  kecamatan: string | null
  kabupaten_kota: string | null
  provinsi: string | null
  kode_pos: string | null
  telepon: string | null
  email: string | null
  website: string | null
  media_sosial: Record<string, string | null>
  logo_kiri_url: string | null
  logo_kanan_url: string | null
  favicon_url: string | null
  hero_foto_url: string | null
  alamat_lengkap: string
  koordinat: { latitude: number; longitude: number } | null
  landing: {
    aktif: boolean
    judul_hero: string | null
    tampilkan_peta: boolean
    tampilkan_pengumuman: boolean
  }
}

interface PublikSekolahResponse {
  data: ProfilSekolah
}

/**
 * Memastikan respons memang berisi profil sekolah.
 *
 * Respons yang bukan profil tetap bisa berstatus 200 — mis. halaman tantangan anti-bot
 * hosting yang mengembalikan HTML. Tanpa pemeriksaan ini, axios menganggapnya sukses,
 * tidak ada percobaan ulang, dan UI menampilkan "Peta belum tersedia" seolah koordinat
 * memang belum diisi. Melempar galat membuat React Query mencoba ulang dan UI dapat
 * menampilkan keadaan "gagal memuat" yang jujur.
 */
export function pastikanProfilSekolah(data: unknown): ProfilSekolah {
  const profil = data as ProfilSekolah | null | undefined
  if (!profil || typeof profil !== 'object' || typeof profil.nama_sekolah !== 'string') {
    throw new Error('Respons info sekolah tidak dikenali')
  }
  return profil
}

/**
 * FR-SCH-02 / FR-LND-09 — data info sekolah diambil dari API, bukan di-hardcode (KP-0.6).
 *
 * PENTING: kegagalan TIDAK boleh ditelan menjadi `null`. Sebelumnya `catch { return null }`
 * membuat gangguan sesaat terlihat seperti "berhasil, datanya kosong": React Query
 * menganggapnya sukses (tidak mencoba ulang) lalu menyimpannya 5 menit. Akibatnya bagian
 * peta menampilkan "Peta belum tersedia" padahal koordinat sekolah sudah diisi — muncul
 * sekilas, lalu "hilang" setelah halaman dimuat ulang.
 *
 * Sekarang galat dibiarkan naik agar React Query mencoba ulang, dan UI dapat membedakan
 * "gagal memuat" dari "memang belum diisi".
 */
export function useSekolah() {
  return useQuery({
    queryKey: ['publik', 'sekolah'],
    queryFn: async () => {
      const res = await get<PublikSekolahResponse>('/publik/sekolah')
      return pastikanProfilSekolah(res?.data)
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (percobaan) => Math.min(1000 * 2 ** percobaan, 8000),
  })
}

export function namaSekolahAtau(sekolah: ProfilSekolah | null | undefined, cadangan = 'Info sekolah belum diisi'): string {
  return sekolah?.nama_sekolah?.trim() || cadangan
}
