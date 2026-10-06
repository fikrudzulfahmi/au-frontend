import { get, post, put, urlFotoBerpelindung } from '@/lib/api'
import { master } from '@/lib/crud'
import type {
  BarisPresensiSiswa,
  HariIniJurnal,
  Jurnal,
  JurnalLengkap,
  RekapSiswa,
} from './types'

/** FR-JRN-01 — sesi hari ini beserta status jurnalnya. */
export function ambilSesiHariIni(tanggal?: string) {
  const query = tanggal ? `?tanggal=${tanggal}` : ''

  return get<{ data: HariIniJurnal }>(`/jurnal/sesi-hari-ini${query}`)
}

/** FR-JRN-08 / BR-22 — siswa kelas untuk halaman isi jurnal (default hadir). */
export function ambilSiswaKelas(kelasId: number, semesterId?: number) {
  const query = new URLSearchParams({ kelas_id: String(kelasId) })
  if (semesterId) query.set('semester_id', String(semesterId))

  return get<{ data: BarisPresensiSiswa[] }>(`/jurnal/siswa-kelas?${query.toString()}`)
}

/** FR-JRN-09 — riwayat jurnal milik sendiri. */
export function riwayatJurnal(params: Record<string, unknown> = {}) {
  return master.daftar<Jurnal>('/jurnal', params)
}

export function ambilJurnal(id: number) {
  return get<{ data: JurnalLengkap }>(`/jurnal/${id}`)
}

/**
 * Foto adalah berkas, jadi dikirim sebagai multipart. `Content-Type` sengaja tidak
 * diisi — interceptor di `lib/api` melepasnya agar peramban menetapkan boundary.
 */
function keFormulir(
  data: Record<string, unknown>,
  foto: File[] = [],
): FormData {
  const form = new FormData()

  for (const [kunci, nilai] of Object.entries(data)) {
    if (nilai === undefined || nilai === null) continue

    if (kunci === 'presensi') {
      for (const [siswaId, isi] of Object.entries(nilai as Record<string, unknown>)) {
        const butir = isi as { status?: string; keterangan?: string | null }
        form.append(`presensi[${siswaId}][status]`, String(butir.status ?? 'H'))
        if (butir.keterangan) {
          form.append(`presensi[${siswaId}][keterangan]`, String(butir.keterangan))
        }
      }
      continue
    }

    form.append(kunci, String(nilai))
  }

  foto.forEach((berkas) => form.append('foto[]', berkas))

  return form
}

/** Membuat jurnal satu sesi (BR-19, BR-21, KP-4.6 ditegakkan server). */
export function isiJurnal(data: Record<string, unknown>, foto: File[] = []) {
  return post<{ message: string; data: Jurnal }>('/jurnal', keFormulir(data, foto))
}

/** BR-20 — edit kapan pun oleh pemilik. */
export function perbaruiJurnal(id: number, data: Record<string, unknown>, foto: File[] = []) {
  return put<{ message: string; data: Jurnal }>(`/jurnal/${id}`, keFormulir(data, foto))
}

/**
 * FR-JRN-10 — kelas yang boleh direkap pengguna ini.
 *
 * Tidak memakai master `/kelas`: endpoint itu khusus admin/kepsek/wakasek sehingga
 * guru (justru pengguna halaman rekap) menerima 403.
 */
export function ambilKelasWali() {
  return get<{ data: { id: number; nama: string; tingkat: string }[] }>('/jurnal/kelas-wali')
}

/** FR-JRN-10 — rekap presensi siswa kelas wali. */
export function ambilRekapSiswa(params: Record<string, unknown>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v))
  })

  return get<{ data: RekapSiswa }>(`/jurnal/rekap-siswa?${query.toString()}`)
}

/** Foto kegiatan disajikan lewat endpoint berpelindung. */
export function ambilFotoJurnal(fotoId: number): Promise<string> {
  return urlFotoBerpelindung(`/jurnal/foto/${fotoId}`)
}
