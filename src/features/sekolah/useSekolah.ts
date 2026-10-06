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
 * FR-SCH-02 / FR-LND-09 — data info sekolah diambil dari API, bukan di-hardcode
 * (KP-0.6). Bila gagal, dikembalikan `null` agar UI memakai teks placeholder.
 */
export function useSekolah() {
  return useQuery({
    queryKey: ['publik', 'sekolah'],
    queryFn: async () => {
      try {
        const res = await get<PublikSekolahResponse>('/publik/sekolah')
        return res.data
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function namaSekolahAtau(sekolah: ProfilSekolah | null | undefined, cadangan = 'Info sekolah belum diisi'): string {
  return sekolah?.nama_sekolah?.trim() || cadangan
}
